import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, FileType, Loader2, PenLine, RotateCw } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { filesToPageImages } from "@/lib/handwriting-images";
import { transcribeHandwriting } from "@/lib/ocr.functions";
import { ocrPdf } from "@/lib/pdf-ocr";

type OutstandingPage = { page: number; image: string; error: string | null };

/**
 * Two separate, explicit upload slots rather than one input that guesses
 * from the file type — a PDF is ambiguous (a typed export vs. a scanned
 * photo of handwriting look identical to a file picker), so the user says
 * which one it is instead of the app trying to detect it:
 *
 *  - "Typed answer": PDF or .txt/.md. Routed through the OCR pipeline
 *    (extract-text.ts / pdf-ocr.ts) — a real text layer (e.g. a PDF
 *    exported from Google Docs) is read directly, and a PDF with no text
 *    layer is OCR'd with Tesseract. This never calls Gemini.
 *
 *  - "Handwritten answer": photos, OR a PDF that is itself a scan of
 *    handwriting. Every page — however it arrived — is rasterised and sent
 *    through Gemini vision (ocr/gemini.server.ts), which is what's actually
 *    needed to read handwriting reliably; Tesseract cannot.
 */
export function HandwritingUpload({
  hint,
  onText,
}: {
  hint?: string;
  onText: (text: string) => void;
}) {
  const typedInput = useRef<HTMLInputElement>(null);
  const handwrittenInput = useRef<HTMLInputElement>(null);
  const transcribe = useServerFn(transcribeHandwriting);

  const [typedStage, setTypedStage] = useState<string | null>(null);
  const [handwrittenStage, setHandwrittenStage] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [readPages, setReadPages] = useState(0);
  const [outstanding, setOutstanding] = useState<OutstandingPage[]>([]);

  const typedMutation = useMutation({
    mutationFn: async (files: File[]) => {
      let text = "";
      let pages = 0;
      let failedPages = 0;

      for (let index = 0; index < files.length; index++) {
        const file = files[index]!;
        if (file.type === "text/plain" || file.name.toLowerCase().match(/\.(txt|md)$/)) {
          setTypedStage(
            files.length > 1 ? `Reading file ${index + 1} of ${files.length}…` : "Reading file…",
          );
          text += (text ? "\n\n" : "") + (await file.text());
          pages += 1;
          continue;
        }
        const outcome = await ocrPdf(file, (label) =>
          setTypedStage(
            files.length > 1 ? `${label} (file ${index + 1} of ${files.length})` : label,
          ),
        );
        text += (text ? "\n\n" : "") + outcome.text;
        pages += outcome.pages;
        failedPages += outcome.failedPages.length;
      }

      return { text, pages, failedPages };
    },
    onSuccess: ({ text, pages, failedPages }) => {
      onText(text);
      if (failedPages > 0) {
        toast.warning(
          `${failedPages} page${failedPages === 1 ? "" : "s"} couldn't be OCR'd — check the text before grading.`,
        );
      } else {
        toast.success(`Read ${pages} page${pages === 1 ? "" : "s"}.`);
      }
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setTypedStage(null),
  });

  const handwrittenMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setHandwrittenStage("Preparing pages…");
      const images = await filesToPageImages(files);
      setHandwrittenStage(
        `Reading ${images.length} page${images.length === 1 ? "" : "s"} of handwriting…`,
      );
      const result = await transcribe({ data: { images, hint: hint?.trim() || undefined } });
      return { images, result };
    },
    onSuccess: ({ images, result }) => {
      onText(result.text);
      setTotalPages(result.pages);
      setReadPages(result.pages - result.failedPages.length);

      const failed: OutstandingPage[] = result.failedPages.map((page) => ({
        page,
        image: images[page - 1]!,
        error: result.pageErrors?.[page] ?? null,
      }));
      setOutstanding(failed);

      if (failed.length === 0) {
        toast.success(
          `All ${result.pages} page${result.pages === 1 ? "" : "s"} of handwriting read successfully.`,
        );
      } else {
        toast.error(
          `${failed.length} of ${result.pages} page${result.pages === 1 ? "" : "s"} couldn't be read — retry them below.`,
        );
      }
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setHandwrittenStage(null),
  });

  const retryMutation = useMutation({
    mutationFn: async (pages: OutstandingPage[]) => {
      setHandwrittenStage(`Retrying ${pages.length} page${pages.length === 1 ? "" : "s"}…`);
      const result = await transcribe({
        data: { images: pages.map((page) => page.image), hint: hint?.trim() || undefined },
      });
      return { pages, result };
    },
    onSuccess: ({ pages, result }) => {
      const recovered: string[] = [];
      const stillFailed: OutstandingPage[] = [];

      pages.forEach((original, index) => {
        const text = result.pageTexts[index];
        if (text) {
          recovered.push(`[Page ${original.page}]\n${text.trim()}`);
        } else {
          stillFailed.push({
            page: original.page,
            image: original.image,
            error: result.pageErrors?.[index + 1] ?? original.error,
          });
        }
      });

      if (recovered.length > 0) {
        onText(recovered.join("\n\n"));
        setReadPages((current) => current + recovered.length);
        toast.success(
          `Recovered ${recovered.length} page${recovered.length === 1 ? "" : "s"} — added to the end of your answer. Move the text into place if needed.`,
        );
      }
      setOutstanding(stillFailed);
      if (stillFailed.length > 0) {
        toast.error(
          `${stillFailed.length} page${stillFailed.length === 1 ? "" : "s"} still couldn't be read.`,
        );
      }
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setHandwrittenStage(null),
  });

  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5 rounded-lg border border-dashed border-border p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <FileType className="size-3.5" />
            Typed answer
          </div>
          <p className="text-[11px] text-muted-foreground">
            PDF or text file — read directly / OCR'd.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            disabled={typedMutation.isPending}
            onClick={() => typedInput.current?.click()}
          >
            {typedMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileType className="size-4" />
            )}
            Upload PDF / text
          </Button>
          {typedStage ? <p className="text-[11px] text-muted-foreground">{typedStage}</p> : null}
          <input
            ref={typedInput}
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain"
            multiple
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length > 0) typedMutation.mutate(files);
            }}
          />
        </div>

        <div className="space-y-1.5 rounded-lg border border-dashed border-border p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <PenLine className="size-3.5" />
            Handwritten answer
          </div>
          <p className="text-[11px] text-muted-foreground">
            Photos, or a PDF scan of handwriting — read by AI. Up to 12 pages.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            disabled={handwrittenMutation.isPending}
            onClick={() => handwrittenInput.current?.click()}
          >
            {handwrittenMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <PenLine className="size-4" />
            )}
            Upload photo / scan
          </Button>
          {handwrittenStage ? (
            <p className="text-[11px] text-muted-foreground">{handwrittenStage}</p>
          ) : handwrittenMutation.isSuccess && totalPages > 0 ? (
            <p className="text-[11px] text-muted-foreground">
              {readPages} of {totalPages} page{totalPages === 1 ? "" : "s"} read.
            </p>
          ) : null}
          <input
            ref={handwrittenInput}
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            multiple
            capture="environment"
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length > 0) handwrittenMutation.mutate(files);
            }}
          />
        </div>
      </div>

      {outstanding.length > 0 ? (
        <div className="space-y-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            <AlertCircle className="size-3.5 shrink-0" />
            {outstanding.length} page{outstanding.length === 1 ? "" : "s"} couldn't be read
            {outstanding.length === 1 ? ` (page ${outstanding[0]!.page})` : ""}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Usually a blurry, dark, or cropped photo — retry, or reshoot that page and upload it on
            its own.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={retryMutation.isPending}
            onClick={() => retryMutation.mutate(outstanding)}
          >
            {retryMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RotateCw className="size-3.5" />
            )}
            Retry {outstanding.length} page{outstanding.length === 1 ? "" : "s"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
