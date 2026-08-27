import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

const CheckInput = z.object({
  essayText: z.string().trim().min(20, "That's too short to check.").max(40_000),
});

const CheckSystemPrompt = `You are a careful proofreader checking a student's Cambridge Economics essay ONLY for spelling and grammar — never for economics content, argument quality, or marks.

Rules:
- Find genuine spelling mistakes, typos, and grammar errors (subject-verb agreement, tense, punctuation, missing words, run-on sentences).
- Do NOT flag economics terminology, technical jargon, or [DIAGRAM: ...] tags as errors — these are correct as written even if they look unusual.
- Do NOT suggest rewording for style, tone, or argument strength. Only fix what is factually a spelling or grammar error.
- If the essay contains a [DIAGRAM: ...] tag, leave it completely untouched in the corrected text.
- If a word was already marked "[?]" by OCR (illegible handwriting), leave it as "[?]" — do not guess a replacement.

Respond ONLY with a single valid JSON object, no markdown fences, no commentary, in exactly this shape:
{
  "issues": [
    { "original": "<the exact mistaken word or short phrase>", "suggestion": "<the corrected word or phrase>", "type": "spelling" | "grammar", "context": "<the short sentence or clause it appears in, unmodified>" }
  ],
  "corrected_text": "<the full essay text with every listed issue fixed, and nothing else changed — same paragraphing, same content, same diagram tags>",
  "clean": <true if no issues were found, else false>
}
Keep "issues" capped at the 40 most significant problems. If the essay is already clean, return an empty issues array, clean: true, and corrected_text identical to the input.`;

/**
 * Spelling/grammar pass, run before marking so the student can see and
 * optionally accept corrections before the examiner ever sees the essay.
 * This never touches economics content or the mark — purely proofreading.
 */
export const checkWritingQuality = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CheckInput.parse(input))
  .handler(async ({ data, context }) => {
    const { chat } = await import("./ai.server");
    const { MODEL_FAST } = await import("./examiner/config");
    const { extractFirstJsonObject } = await import("./examiner/json");

    try {
      const result = await chat({
        model: MODEL_FAST,
        temperature: 0,
        json: true,
        messages: [
          { role: "system", content: CheckSystemPrompt },
          { role: "user", content: `Essay to proofread:\n\n${data.essayText}` },
        ],
      });

      const raw = extractFirstJsonObject(result.text);
      const issuesRaw = Array.isArray(raw.issues) ? raw.issues : [];
      const issues = issuesRaw
        .map((item) => {
          const record = (item ?? {}) as Record<string, unknown>;
          const original = typeof record.original === "string" ? record.original : "";
          const suggestion = typeof record.suggestion === "string" ? record.suggestion : "";
          if (!original || !suggestion) return null;
          return {
            original,
            suggestion,
            type: record.type === "grammar" ? ("grammar" as const) : ("spelling" as const),
            context: typeof record.context === "string" ? record.context : "",
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .slice(0, 40);

      const correctedText =
        typeof raw.corrected_text === "string" && raw.corrected_text.trim()
          ? raw.corrected_text
          : data.essayText;

      await context.supabase.from("ai_usage_log").insert({
        user_id: context.userId,
        feature: "check_writing_quality",
        model: result.model,
        prompt_tokens: result.promptTokens,
        completion_tokens: result.completionTokens,
        latency_ms: result.latencyMs,
        ok: true,
      });

      return {
        issues,
        correctedText,
        clean: issues.length === 0,
      };
    } catch (error) {
      await context.supabase.from("ai_usage_log").insert({
        user_id: context.userId,
        feature: "check_writing_quality",
        model: "spelling-grammar-check",
        ok: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      // Proofreading is an enhancement, never a hard gate — a failed check
      // must not block the student from marking their essay.
      return { issues: [], correctedText: data.essayText, clean: true, checkFailed: true };
    }
  });
