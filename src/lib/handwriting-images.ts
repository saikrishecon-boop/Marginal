// Browser-side page-image preparation for handwriting transcription. Photos are
// downscaled and PDF scans are rasterised in the tab, so only compact JPEGs
// travel to the server.

// Cambridge handwriting is small and dense; 1600px on the long edge was
// blurring thin pen strokes and faint pencil after JPEG compression, which
// was the single biggest cause of bad transcriptions. 2600px + higher JPEG
// quality keeps files well within Gemini's per-request limits while giving
// the model enough resolution to actually resolve individual letters.
const MAX_EDGE = 2600;
const JPEG_QUALITY = 0.92;

export type PageProgress = (done: number, total: number) => void;

export async function filesToPageImages(
  files: File[],
  onProgress?: PageProgress,
): Promise<string[]> {
  const pages: string[] = [];

  for (const file of files) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      pages.push(...(await pdfToImages(file)));
    } else if (file.type.startsWith("image/")) {
      pages.push(await imageToDataUrl(file));
    } else {
      throw new Error(`${file.name} is not a photo or PDF scan.`);
    }
    onProgress?.(pages.length, pages.length);
  }

  if (pages.length === 0) throw new Error("Add a photo or PDF scan of the handwritten answer.");
  if (pages.length > 12) throw new Error("Up to 12 pages at a time — split longer answers.");
  return pages;
}

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

function fitted(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

async function imageToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = fitted(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not process the image.");
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  return canvasToDataUrl(canvas);
}

async function pdfToImages(file: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const images: string[] = [];

  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 12); pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    // Render at a resolution that keeps thin pen strokes legible to the model.
    const scale = Math.min(3.5, MAX_EDGE / Math.max(base.width, base.height));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser could not render the PDF scan.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    images.push(canvasToDataUrl(canvas));
  }

  return images;
}