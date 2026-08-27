import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import type { McqOption, McqQuestion } from "./mcq/mcq.server";

const CreateInput = z.object({
  topic: z.string().trim().max(200).optional(),
  level: z.enum(["as", "a2"]).default("as"),
});

/** Start a new 30-question paper. Questions are generated in batches after this. */
export const createMcqPaper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateInput.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { PAPER_TOTAL } = await import("./mcq/mcq.server");
    const topic = data.topic?.trim() || null;

    const { data: row, error } = await context.supabase
      .from("mcq_attempts")
      .insert({
        user_id: context.userId,
        title: topic
          ? `${topic} — 30 question paper`
          : data.level === "a2"
            ? "A Level Paper 3 practice — 30 questions"
            : "AS Level Paper 1 practice — 30 questions",
        topic,
        level: data.level,
        status: "building",
        total: PAPER_TOTAL,
      })
      .select("id, title, total")
      .single();

    if (error || !row) throw new Error(error?.message ?? "Could not start the paper.");
    return { attemptId: row.id, title: row.title, total: row.total };
  });

/** Generate and append the next batch of questions. Call until `done`. */
export const generateMcqBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ attemptId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateMcqBatchQuestions, PAPER_TOTAL, BATCH_SIZE } = await import("./mcq/mcq.server");

    const { data: attempt, error } = await supabase
      .from("mcq_attempts")
      .select("id, topic, level, questions, total")
      .eq("id", data.attemptId)
      .single();
    if (error || !attempt) throw new Error("That paper could not be found.");

    const existing = (attempt.questions ?? []) as McqQuestion[];
    const total = attempt.total ?? PAPER_TOTAL;
    if (existing.length >= total) {
      await supabase.from("mcq_attempts").update({ status: "ready" }).eq("id", attempt.id);
      return { done: true, generated: 0, count: existing.length, total };
    }

    const want = Math.min(BATCH_SIZE, total - existing.length);

    try {
      const { questions, meta } = await generateMcqBatchQuestions(supabase, {
        level: (attempt.level as "as" | "a2") ?? "as",
        topic: attempt.topic,
        count: want,
        batchIndex: Math.floor(existing.length / BATCH_SIZE),
        existingStems: existing.map((q) => q.stem),
      });

      const merged = [...existing, ...questions.slice(0, want)].map((q, index) => ({
        ...q,
        number: index + 1,
      }));
      const done = merged.length >= total;

      const { error: updateError } = await supabase
        .from("mcq_attempts")
        .update({
          questions: merged,
          status: done ? "ready" : "building",
          model: meta.model,
        })
        .eq("id", attempt.id);
      if (updateError) throw new Error(updateError.message);

      await supabase.from("ai_usage_log").insert({
        user_id: userId,
        feature: "mcq_generate",
        model: meta.model,
        prompt_tokens: meta.promptTokens,
        completion_tokens: meta.completionTokens,
        latency_ms: meta.latencyMs,
        ok: true,
      });

      return { done, generated: questions.length, count: merged.length, total };
    } catch (generationError) {
      await supabase.from("ai_usage_log").insert({
        user_id: userId,
        feature: "mcq_generate",
        model: "openai/gpt-5.6-sol",
        ok: false,
        error_message:
          generationError instanceof Error ? generationError.message : "Unknown error",
      });
      throw generationError;
    }
  });

export const getMcqAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ attemptId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("mcq_attempts")
      .select("*")
      .eq("id", data.attemptId)
      .single();
    if (error || !row) throw new Error("That paper could not be found.");
    return {
      ...row,
      questions: (row.questions ?? []) as McqQuestion[],
      answers: (row.answers ?? {}) as Record<string, McqOption>,
    };
  });

/** Mark the paper: 1 mark per correct answer, with a per-question review. */
export const submitMcqPaper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        attemptId: z.string().uuid(),
        answers: z.record(z.string(), z.enum(["A", "B", "C", "D"])),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: attempt, error } = await supabase
      .from("mcq_attempts")
      .select("id, questions, total")
      .eq("id", data.attemptId)
      .single();
    if (error || !attempt) throw new Error("That paper could not be found.");

    const questions = (attempt.questions ?? []) as McqQuestion[];
    let score = 0;
    const review = questions.map((question) => {
      const given = data.answers[String(question.number)] ?? null;
      const correct = given === question.answer;
      if (correct) score += 1;
      return {
        number: question.number,
        stem: question.stem,
        options: question.options,
        given,
        answer: question.answer,
        correct,
        explanation: question.explanation,
        whyWrong: given && !correct ? (question.distractorNotes[given] ?? null) : null,
        topic: question.topic,
        syllabusRef: question.syllabusRef,
        skill: question.skill,
        diagramId: question.diagramId ?? null,
      };
    });

    const { error: updateError } = await supabase
      .from("mcq_attempts")
      .update({
        answers: data.answers,
        score,
        status: "marked",
        completed_at: new Date().toISOString(),
      })
      .eq("id", attempt.id);
    if (updateError) throw new Error(updateError.message);

    const byTopic = new Map<string, { correct: number; total: number }>();
    for (const item of review) {
      const entry = byTopic.get(item.topic) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (item.correct) entry.correct += 1;
      byTopic.set(item.topic, entry);
    }

    return {
      score,
      total: questions.length,
      review,
      weakestTopics: [...byTopic.entries()]
        .map(([topic, stats]) => ({ topic, ...stats }))
        .filter((entry) => entry.correct < entry.total)
        .sort((a, b) => a.correct / a.total - b.correct / b.total)
        .slice(0, 4),
    };
  });

export const listMcqAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mcq_attempts")
      .select("id, title, topic, level, status, score, total, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
