import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

const TranscribeInput = z.object({
  /** Page images as data URLs, in reading order. */
  images: z
    .array(z.string().startsWith("data:image/", "Each page must be an image."))
    .min(1, "Add at least one page image.")
    .max(12, "Up to 12 pages at a time."),
  hint: z.string().trim().max(2000).optional(),
});

/** Read a handwritten answer into plain text for marking or AO coaching. */
export const transcribeHandwriting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TranscribeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { transcribeWithGemini } = await import("./ocr/gemini.server");

    try {
      const outcome = await transcribeWithGemini(data.images, data.hint);

      await supabase.from("ai_usage_log").insert({
        user_id: userId,
        feature: "transcribe_handwriting",
        model: outcome.model,
        latency_ms: outcome.latencyMs,
        ok: true,
      });

      return {
        text: outcome.text,
        pageTexts: outcome.pageTexts,
        pages: outcome.pages,
        failedPages: outcome.failedPages,
        pageErrors: outcome.pageErrors,
      };
    } catch (error) {
      await supabase.from("ai_usage_log").insert({
        user_id: userId,
        feature: "transcribe_handwriting",
        model: "handwriting-ocr",
        ok: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  });
