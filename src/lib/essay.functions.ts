import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

const EssayInput = z.object({
  level: z.enum(["as", "a2"]).default("as"),
  topic: z.string().trim().min(2, "Choose a topic.").max(200),
  question: z.string().trim().min(10, "Paste the full question.").max(2000),
  maxMark: z.coerce.number().int().min(4).max(25).default(12),
});

/** Generate an examiner-standard model essay with diagrams and an AO breakdown. */
export const generateModelEssay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EssayInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generatePerfectEssay } = await import("./essay/generator.server");

    try {
      const outcome = await generatePerfectEssay(supabase, data);

      await supabase.from("ai_usage_log").insert({
        user_id: userId,
        feature: "essay_generate",
        model: outcome.meta.model,
        prompt_tokens: outcome.meta.promptTokens,
        completion_tokens: outcome.meta.completionTokens,
        latency_ms: outcome.meta.latencyMs,
        ok: true,
      });

      return { essay: outcome.essay, sourceCount: outcome.sourceCount };
    } catch (error) {
      await supabase.from("ai_usage_log").insert({
        user_id: userId,
        feature: "essay_generate",
        model: "openai/gpt-5.6-sol",
        ok: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  });
