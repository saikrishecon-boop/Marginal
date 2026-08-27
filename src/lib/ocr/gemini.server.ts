/**
 * Handwriting OCR. Default path is the built-in Lovable AI gateway (Gemini
 * vision — no user key required). An admin-saved Google AI Studio key is used
 * as an optional first attempt; if it fails we silently fall back to the
 * gateway, then to further models, so transcription never dies on config.
 */
import { AiGatewayError, visionChat } from "../ai.server";

// Gemini 3.7 Flash reads small/cramped handwriting far more reliably than
// 2.5 Flash and is the only line that supports mediaResolution — the biggest
// lever we have for legibility. This is used ONLY for the direct Google AI
// Studio path (an admin-saved key calling Google's API directly).
const GOOGLE_MODEL = "models/gemini-3.7-flash";
const GOOGLE_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Gateway fallback chain. IMPORTANT: this must only ever contain models the
 * Lovable AI gateway actually serves (see AI_PROVIDERS in ai/providers.ts —
 * "google/gemini-3.6-flash", "openai/gpt-5.6-sol", "openai/gpt-5.6-terra").
 * A previous version of this list led with "google/gemini-3.7-flash", which
 * the gateway does not serve — every page burned 3 guaranteed-failed attempts
 * (with backoff) on a non-existent model before ever reaching a working one,
 * which both slowed every transcription down and made pages fail outright
 * under load, since the wasted retries increased the odds of a genuine rate
 * limit on the models that do work. Keep this list gateway-verified.
 */
const GATEWAY_MODELS = ["google/gemini-3.6-flash", "openai/gpt-5.6-sol", "openai/gpt-5.6-terra"];
const ATTEMPTS_PER_MODEL = 2;
const CONCURRENCY = 3;
const MAX_OUTPUT_TOKENS = 16384; // dense pages with several diagram tags can run long

const SYSTEM_PROMPT = [
  "You are an OCR engine specialised in Cambridge examination papers. Read handwritten English exactly as written.",
  "Preserve spelling mistakes, grammar mistakes, punctuation and line breaks. Never improve or rewrite the student's wording.",
  "This is a photographed or scanned exam script: handwriting may be cursive, cramped, faint pencil, or written over crossed-out text.",
  "Look closely at individual letter shapes before deciding a word is unreadable — use the surrounding sentence to resolve a genuinely",
  "ambiguous letter (e.g. a vs o, n vs u, or a word split across a line break), but never invent a word that isn't visually supported.",
  "If a word cannot be confidently read after that, replace only that word with [?]. Do not guess wildly.",
  "",
  "HAND-DRAWN DIAGRAMS: if the page contains a drawn economics diagram (axes, curves, shifts, arrows, shaded areas),",
  "do NOT skip it and do NOT invent handwriting for it. Insert a single structured tag at the exact point in the flow",
  "where the diagram appears, on its own line, in this format:",
  "[DIAGRAM: <best-guess standard name, e.g. AD/AS, demand and supply with price ceiling, PPC, monopoly, Lorenz curve>",
  "| axes: <x-axis label / y-axis label exactly as drawn, or 'unlabelled'>",
  "| curves: <curves drawn and any shifts/directions, e.g. 'AD shifts right AD1->AD2, SRAS static'>",
  "| labels: <equilibrium points, prices, quantities, shaded areas, annotations written on the diagram>",
  "| accuracy: <short factual note on what is correct, missing or mislabelled — no marks, no praise>]",
  "Describe only what is actually drawn. If a feature is missing (e.g. no axis labels), say so in that field.",
  "Do not summarise. Do not explain. Output only the transcription and any diagram tags.",
  "",
  "This page WILL contain something to transcribe — every page comes from a real, non-blank exam script. If the",
  "handwriting is faint, small or partly obscured, do your best rather than giving up; use [?] only for individual",
  "words you genuinely cannot resolve, never for a whole page.",
].join("\n");

const PAGE_PROMPT =
  "Transcribe the handwriting on this page exactly as written, and tag any hand-drawn diagram using the [DIAGRAM: ...] format. Ignore page numbers and printed exam instructions.";

export type PageTranscription = { page: number; text: string | null; error: string | null };

export type GeminiOcrOutcome = {
  text: string;
  /** Per-page text in original page order, null where that page failed. */
  pageTexts: (string | null)[];
  model: string;
  pages: number;
  failedPages: number[];
  /** Human-readable reason each failed page could not be read, keyed by page number. */
  pageErrors: Record<number, string>;
  latencyMs: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Full jitter backoff: never lets concurrent workers retry in lockstep. */
function backoffDelay(attempt: number, isRateLimited: boolean): number {
  const base = isRateLimited ? 2500 : 500;
  const cap = base * 2 ** attempt;
  return Math.round(Math.random() * cap);
}

/** Optional Google AI Studio key an admin saved in the app. */
async function getGoogleApiKey(): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/backend/client.server");
    const { data } = await supabaseAdmin
      .from("ai_provider_keys")
      .select("api_key")
      .eq("provider", "google")
      .order("is_active", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.api_key?.trim() || null;
  } catch {
    return null;
  }
}

function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) throw new Error("A page image was not a valid base64 image.");
  return { mimeType: match[1]!, data: match[2]! };
}

async function transcribeViaGoogle(apiKey: string, dataUrl: string, hint?: string) {
  const { mimeType, data } = splitDataUrl(dataUrl);
  const response = await fetch(`${GOOGLE_ENDPOINT}/${GOOGLE_MODEL}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data } },
            { text: hint ? `${PAGE_PROMPT}\nContext: ${hint}` : PAGE_PROMPT },
          ],
        },
      ],
      // No temperature override: Gemini 3.x models are tuned for their
      // default sampling and Google now advises against changing it —
      // legibility comes from mediaResolution + the prompt, not temperature.
      generationConfig: {
        mediaResolution: "MEDIA_RESOLUTION_HIGH",
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const error = new Error(`Google returned ${response.status}. ${detail.slice(0, 200)}`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = (payload.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Google returned no text for this page.");
  return text;
}

async function transcribeViaGateway(model: string, dataUrl: string, hint?: string) {
  const result = await visionChat({
    model,
    systemPrompt: SYSTEM_PROMPT,
    prompt: hint ? `${PAGE_PROMPT}\nContext: ${hint}` : PAGE_PROMPT,
    imageDataUrls: [dataUrl],
    maxCompletionTokens: MAX_OUTPUT_TOKENS,
  });
  const text = result.text.trim();
  if (!text) throw new Error(`${model} returned no text for this page.`);
  return text;
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof AiGatewayError) return error.status === 429;
  const status = (error as { status?: number } | null)?.status;
  return status === 429;
}

/** Try every path for one page: saved key, then each gateway model with backoff. */
async function transcribePage(
  dataUrl: string,
  page: number,
  googleKey: string | null,
  hint: string | undefined,
  usedModels: Set<string>,
): Promise<{ text: string | null; error: string | null }> {
  let lastError: unknown = null;

  if (googleKey) {
    try {
      const text = await transcribeViaGoogle(googleKey, dataUrl, hint);
      usedModels.add(GOOGLE_MODEL);
      return { text, error: null };
    } catch (error) {
      lastError = error;
      console.error(`OCR page ${page}: saved Google key failed`, error);
    }
  }

  for (const model of GATEWAY_MODELS) {
    for (let attempt = 1; attempt <= ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const text = await transcribeViaGateway(model, dataUrl, hint);
        usedModels.add(model);
        return { text, error: null };
      } catch (error) {
        lastError = error;
        console.error(`OCR page ${page}: ${model} attempt ${attempt} failed`, error);
        if (attempt < ATTEMPTS_PER_MODEL) {
          await sleep(backoffDelay(attempt, isRateLimitError(error)));
        }
      }
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "Every model failed to read this page.";
  return { text: null, error: message };
}

async function transcribeAll(
  pages: PageTranscription[],
  imageDataUrls: string[],
  pageIndexes: number[],
  googleKey: string | null,
  hint: string | undefined,
  usedModels: Set<string>,
  concurrency: number,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, pageIndexes.length) }, async () => {
    while (cursor < pageIndexes.length) {
      const listIndex = cursor++;
      const pageIndex = pageIndexes[listIndex]!;
      const outcome = await transcribePage(
        imageDataUrls[pageIndex]!,
        pageIndex + 1,
        googleKey,
        hint,
        usedModels,
      );
      pages[pageIndex]!.text = outcome.text;
      pages[pageIndex]!.error = outcome.error;
    }
  });
  await Promise.all(workers);
}

export async function transcribeWithGemini(
  imageDataUrls: string[],
  hint?: string,
): Promise<GeminiOcrOutcome> {
  const startedAt = Date.now();
  const googleKey = await getGoogleApiKey();
  const usedModels = new Set<string>();
  const results: PageTranscription[] = imageDataUrls.map((_, index) => ({
    page: index + 1,
    text: null,
    error: null,
  }));

  const allIndexes = imageDataUrls.map((_, index) => index);
  await transcribeAll(results, imageDataUrls, allIndexes, googleKey, hint, usedModels, CONCURRENCY);

  // Second sweep: any page that failed the first pass gets one more full
  // life-cycle through every model, run with reduced concurrency so it isn't
  // competing against the rest of the batch for the same rate limits. This
  // is what turns "usually works" into "works every time" — most first-pass
  // failures are transient (a momentary 429 or network blip), not a page
  // that is genuinely unreadable.
  const stillFailed = results.filter((page) => !page.text).map((page) => page.page - 1);
  if (stillFailed.length > 0) {
    await transcribeAll(results, imageDataUrls, stillFailed, googleKey, hint, usedModels, 1);
  }

  const failedPages = results.filter((page) => !page.text).map((page) => page.page);
  const pageErrors = Object.fromEntries(
    results.filter((page) => !page.text).map((page) => [page.page, page.error ?? "Unknown error"]),
  );
  const text = results
    .filter((page) => page.text)
    .map((page) => page.text!.trim())
    .join("\n\n");

  if (!text) {
    throw new Error(
      "No handwriting could be read from those pages. Try a brighter, straight-on photo of the full page.",
    );
  }

  return {
    text,
    pageTexts: results.map((page) => page.text),
    model: [...usedModels].join(", ") || GATEWAY_MODELS[0]!,
    pages: results.length,
    failedPages,
    pageErrors,
    latencyMs: Date.now() - startedAt,
  };
}
