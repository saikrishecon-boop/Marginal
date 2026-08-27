// PDF text pipeline. Two tiers, cheapest first:
//   1. Text-layer extraction (pdf.js) — free, instant, exact. Covers the
//      common case of a PDF exported from Google Docs / Word / any word
//      processor, which carries a real embedded text layer.
//   2. Tesseract OCR on rasterised pages — covers a PDF with no text layer
//      at all (a straight scan of printed pages, e.g. a photocopied
//      worksheet saved as PDF).
//
// This is deliberately NOT the Gemini vision pipeline: Tesseract reads
// machine-printed text very well and far more cheaply than a vision model,
// but it cannot reliably read handwriting. Genuine handwritten answers
// (photographed or scanned by hand) should be uploaded as images, or as a
// PDF scan of handwriting — see routeFilesForOcr in handwriting-images.ts,
// which sends photos of handwriting to Gemini instead of here.

export type PdfOcrOutcome = {
  text: string;
  pages: number;
  failedPages: number[];
  pageErrors: Record<number, string>;
  /** Which tier actually produced the text, for UI messaging / debugging. */
  source: "text-layer" | "tesseract";
};

export type OcrProgress = (label: string) => void;

// Below this many characters, a PDF has no meaningful text layer (either
// truly empty or just a handful of stray glyphs) and is treated as scan-only.
const MIN_TEXT_LAYER_CHARS = 200;

export async function ocrPdf(file: File, onProgress?: OcrProgress): Promise<PdfOcrOutcome> {
  onProgress?.("Reading PDF text…");
  const { extractTextFromFile } = await import("./extract-text");
  const textLayer = (await extractTextFromFile(file)).trim();

  if (textLayer.length >= MIN_TEXT_LAYER_CHARS) {
    return {
      text: textLayer,
      pages: 1,
      failedPages: [],
      pageErrors: {},
      source: "text-layer",
    };
  }

  return ocrScannedPdf(file, onProgress);
}

/** Rasterise every page and OCR it with Tesseract — for PDFs with no text layer. */
async function ocrScannedPdf(file: File, onProgress?: OcrProgress): Promise<PdfOcrOutcome> {
  onProgress?.("No text layer found — running OCR…");
  const { filesToPageImages } = await import("./handwriting-images");
  const images = await filesToPageImages([file]);

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");

  const pageTexts: (string | null)[] = [];
  const pageErrors: Record<number, string> = {};

  try {
    for (let index = 0; index < images.length; index++) {
      onProgress?.(`OCR page ${index + 1} of ${images.length}…`);
      try {
        const { data } = await worker.recognize(images[index]!);
        const text = (data.text ?? "").trim();
        pageTexts.push(text || null);
        if (!text) pageErrors[index + 1] = "No text detected on this page.";
      } catch (error) {
        pageTexts.push(null);
        pageErrors[index + 1] = error instanceof Error ? error.message : "OCR failed on this page.";
      }
    }
  } finally {
    await worker.terminate();
  }

  const failedPages = pageTexts
    .map((text, index) => (text ? null : index + 1))
    .filter((page): page is number => page !== null);

  const text = pageTexts.filter((page): page is string => Boolean(page)).join("\n\n");

  if (!text) {
    throw new Error(
      "No readable text could be OCR'd from this PDF. If it's a photo or scan of handwriting, upload it as an image instead so it goes through AI handwriting recognition.",
    );
  }

  return { text, pages: images.length, failedPages, pageErrors, source: "tesseract" };
}

/** True for anything that should go through the PDF text/OCR pipeline. */
export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}
