import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

const CoachInput = z.object({
  ao: z.enum(["ao1", "ao2", "ao3"]),
  question: z.string().trim().min(5, "Add the question or topic first.").max(2000),
  pointText: z.string().trim().min(20, "Write a little more before asking for feedback.").max(6000),
  maxMark: z.number().int().min(1).max(30).optional(),
});

/** Coach a single AO point and log the call. */
export const coachAoPoint = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CoachInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { coachPoint } = await import("./coach/coach.server");

    try {
      const outcome = await coachPoint(supabase, {
        ao: data.ao,
        question: data.question,
        pointText: data.pointText,
        maxMark: data.maxMark,
      });

      await supabase.from("ai_usage_log").insert({
        user_id: userId,
        feature: `coach_${data.ao}`,
        model: outcome.model,
        prompt_tokens: outcome.promptTokens,
        completion_tokens: outcome.completionTokens,
        latency_ms: outcome.latencyMs,
        ok: true,
      });

      return outcome;
    } catch (error) {
      await supabase.from("ai_usage_log").insert({
        user_id: userId,
        feature: `coach_${data.ao}`,
        model: "openai/gpt-5.6-sol",
        ok: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  });