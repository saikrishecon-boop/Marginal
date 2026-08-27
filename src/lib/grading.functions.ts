import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

const GradeInput = z.object({
  question: z.string().trim().min(10, "Paste the exam question.").max(2000),
  essayText: z.string().trim().min(40, "That essay is too short to mark.").max(40_000),
  maxMark: z.number().int().min(4).max(30),
  essayId: z.string().uuid().nullable().optional(),
  useAnchors: z.boolean().optional(),
  auditPass: z.boolean().optional(),
  useRetrieval: z.boolean().optional(),
  /**
   * A [DIAGRAM: ...] tag describing a diagram the student referenced for a
   * typed (non-handwritten) essay — either picked from the diagram library
   * or generated from a pasted image URL. Appended to the graded text so it
   * gets the same credit a scanned script's hand-drawn diagram would.
   */
  diagramReference: z.string().trim().max(1000).optional(),
});

/**
 * Mark an essay and persist it as a new version of the same essay thread, so a
 * student can rewrite and watch the mark move rather than losing the history.
 */
export const gradeEssaySubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GradeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { gradeEssay } = await import("./examiner/grade.server");
    const { defaultSplitForMaxMark } = await import("./examiner/config");

    const split = defaultSplitForMaxMark(data.maxMark);

    // A referenced diagram is appended after the student's own text, exactly
    // like a hand-drawn diagram tag from OCR, so the examiner prompt's
    // existing diagram-handling rules apply unchanged.
    const gradedText = data.diagramReference
      ? `${data.essayText}\n\n${data.diagramReference}`
      : data.essayText;

    let outcome;
    try {
      outcome = await gradeEssay(supabase, {
        question: data.question,
        essayText: gradedText,
        maxMark: data.maxMark,
        split,
        useAnchors: data.useAnchors,
        auditPass: data.auditPass,
        useRetrieval: data.useRetrieval,
      });
    } catch (error) {
      await supabase.from("ai_usage_log").insert({
        user_id: userId,
        feature: "grade_essay",
        model: "google/gemini-2.5-pro",
        ok: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }

    const { grading } = outcome;

    // Reuse the existing essay thread on a rewrite; otherwise open a new one.
    let essayId = data.essayId ?? null;
    if (essayId) {
      await supabase
        .from("essays")
        .update({ latest_mark: grading.total_mark, updated_at: new Date().toISOString() })
        .eq("id", essayId)
        .eq("user_id", userId);
    } else {
      const { data: essay, error } = await supabase
        .from("essays")
        .insert({
          user_id: userId,
          question: data.question,
          max_mark: data.maxMark,
          latest_mark: grading.total_mark,
        })
        .select("id")
        .single();
      if (error || !essay) throw new Error(error?.message ?? "Could not save this essay.");
      essayId = essay.id;
    }

    const { count } = await supabase
      .from("essay_versions")
      .select("id", { count: "exact", head: true })
      .eq("essay_id", essayId);

    const { data: version, error: versionError } = await supabase
      .from("essay_versions")
      .insert({
        essay_id: essayId,
        user_id: userId,
        version: (count ?? 0) + 1,
        essay_text: gradedText,
        grading: grading as unknown as never,
        total_mark: grading.total_mark,
        ao1_awarded: grading.ao_breakdown.knowledge.awarded,
        ao2_awarded: grading.ao_breakdown.analysis.awarded,
        ao3_awarded: grading.ao_breakdown.evaluation.awarded,
        confidence: grading.confidence,
        audited: grading.audited,
        sources: grading.sources as unknown as never,
        model: outcome.model,
      })
      .select("id, version")
      .single();

    if (versionError) throw new Error(versionError.message);

    await supabase.from("ai_usage_log").insert({
      user_id: userId,
      feature: "grade_essay",
      model: outcome.model,
      prompt_tokens: outcome.promptTokens,
      completion_tokens: outcome.completionTokens,
      latency_ms: outcome.latencyMs,
      ok: true,
    });

    return {
      essayId,
      versionId: version?.id ?? null,
      version: version?.version ?? 1,
      grading,
      latencyMs: outcome.latencyMs,
    };
  });

export const listMyEssays = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("essays")
      .select("id, question, max_mark, latest_mark, created_at, updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getEssayThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ essayId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: essay, error } = await supabase
      .from("essays")
      .select("id, question, max_mark, latest_mark, created_at")
      .eq("id", data.essayId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!essay) throw new Error("That essay could not be found.");

    const { data: versions, error: versionError } = await supabase
      .from("essay_versions")
      .select("id, version, essay_text, grading, total_mark, confidence, audited, created_at")
      .eq("essay_id", data.essayId)
      .order("version", { ascending: true });
    if (versionError) throw new Error(versionError.message);

    return { essay, versions: versions ?? [] };
  });

/** Student progress figures for the dashboard. */
export const getProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("essay_versions")
      .select("total_mark, ao1_awarded, ao2_awarded, ao3_awarded, confidence, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
