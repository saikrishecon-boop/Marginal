/**
 * Describes an economics diagram supplied as an image URL (e.g. a photo of a
 * textbook diagram, or a diagram exported from another tool) into the same
 * structured [DIAGRAM: ...] tag format the handwriting OCR pipeline uses, so
 * a typed online essay can get the same diagram credit as a scanned script.
 */
import { visionChat } from "../ai.server";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const SYSTEM_PROMPT = [
  "You are looking at an image of an economics diagram supplied by a Cambridge International AS/A Level Economics student, alongside their typed essay.",
  "Describe ONLY what is actually drawn — do not invent axes, curves or labels that are not visible.",
  "Respond with a single structured tag, and nothing else, in this exact format:",
  "[DIAGRAM: <best-guess standard name, e.g. AD/AS, demand and supply with price ceiling, PPC, monopoly, Lorenz curve>",
  "| axes: <x-axis label / y-axis label exactly as shown, or 'unlabelled'>",
  "| curves: <curves shown and any shifts/directions, e.g. 'AD shifts right AD1->AD2, SRAS static'>",
  "| labels: <equilibrium points, prices, quantities, shaded areas, annotations shown on the diagram>",
  "| accuracy: <short factual note on what is correct, missing or mislabelled — no marks, no praise>]",
].join("\n");

const USER_PROMPT =
  "Describe this economics diagram using the exact [DIAGRAM: ...] tag format from the system prompt. Output only the tag.";

async function fetchAsDataUrl(url: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("That doesn't look like a valid image URL.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Diagram URLs must be http or https links.");
  }

  const response = await fetch(parsed.toString());
  if (!response.ok) throw new Error(`Could not fetch that image (${response.status}).`);

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    throw new Error("That URL doesn't point directly at an image file.");
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("That image is too large — please use an image under 8MB.");
  }

  const base64 = Buffer.from(buffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

// Same fallback order as the handwriting OCR pipeline, so this stays working
// on the same models without depending on an admin-saved Google key.
const GATEWAY_MODELS = ["google/gemini-3.7-flash", "google/gemini-3.6-flash", "openai/gpt-5.6-sol"];

export async function describeDiagramFromUrl(url: string): Promise<string> {
  const dataUrl = await fetchAsDataUrl(url);

  let lastError: unknown = null;
  for (const model of GATEWAY_MODELS) {
    try {
      const result = await visionChat({
        model,
        systemPrompt: SYSTEM_PROMPT,
        prompt: USER_PROMPT,
        imageDataUrls: [dataUrl],
        maxCompletionTokens: 1024,
      });
      const text = result.text.trim();
      if (text.startsWith("[DIAGRAM:")) return text;
      lastError = new Error(`${model} did not return a diagram tag.`);
    } catch (error) {
      lastError = error;
    }
  }

  console.error("Diagram description failed for all models", lastError);
  throw new Error("Couldn't make out a diagram in that image — try a clearer, closer photo.");
}
