import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Layers, Loader2, Search, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { splitIntoChapters, type ChapterSplit } from "@/lib/chapter-split";
import { extractTextFromFile } from "@/lib/extract-text";
import { getMe } from "@/lib/account.functions";
import { cn } from "@/lib/utils";
import {
  deleteDocument,
  embedNextBatch,
  ingestDocument,
  listDocuments,
  searchKnowledge,
} from "@/lib/knowledge.functions";
import { isPdfFile, ocrPdf } from "@/lib/pdf-ocr";

const DOC_TYPES = [
  { value: "coursebook", label: "Coursebook" },
  { value: "syllabus", label: "Syllabus" },
  { value: "mark_scheme", label: "Mark scheme" },
  { value: "past_paper", label: "Past paper" },
  { value: "mcq_calibration", label: "MCQ calibration paper (real AS/A2 past paper)" },
  { value: "examiner_report", label: "Examiner report" },
  { value: "notes", label: "Class notes" },
  { value: "other", label: "Other" },
] as const;

export const Route = createFileRoute("/_authenticated/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge base — Marginal Economics" },
      {
        name: "description",
        content:
          "Upload your Economics coursebook, syllabus, mark schemes and examiner reports so every essay is marked against your own materials.",
      },
      { property: "og:title", content: "Knowledge base — Marginal Economics" },
      {
        property: "og:description",
        content: "Add PDFs and notes that ground every mark in real Cambridge source material.",
      },
    ],
  }),
  component: KnowledgePage,
});

type QueueStatus =
  "pending" | "reading" | "chunking" | "embedding" | "done" | "duplicate" | "failed";
type QueueItem = { id: string; title: string; status: QueueStatus; detail: string };

// A single PDF that splits into >= this many chapters gets a preview so a
// teacher can confirm/exclude before anything is written, rather than the
// heuristic silently deciding for them.
const MIN_PREVIEW_CHAPTERS = 2;

function KnowledgePage() {
  const queryClient = useQueryClient();
  const fetchMe = useServerFn(getMe);
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const ingest = useServerFn(ingestDocument);
  const embedBatch = useServerFn(embedNextBatch);
  const removeDoc = useServerFn(deleteDocument);
  const fetchDocs = useServerFn(listDocuments);
  const search = useServerFn(searchKnowledge);

  const docs = useQuery({ queryKey: ["documents"], queryFn: () => fetchDocs() });

  // Two separate places sharing the same library: general course materials,
  // and real past MCQ papers dropped in purely as calibration reference for
  // the MCQ generator (question style, difficulty balance, timing).
  const [scope, setScope] = useState<"materials" | "mcq_calibration">("materials");
  const scopedDocs = (docs.data ?? []).filter((doc) =>
    scope === "mcq_calibration"
      ? doc.doc_type === "mcq_calibration"
      : doc.doc_type !== "mcq_calibration",
  );

  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<string>("coursebook");
  const [examSeries, setExamSeries] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // Set only when a single PDF is selected and it looks like a chaptered
  // coursebook — lets the teacher confirm the split before anything is added.
  const [chapterPreview, setChapterPreview] = useState<{
    file: File;
    chapters: ChapterSplit[];
    included: boolean[];
  } | null>(null);

  const [busy, setBusy] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const [query, setQuery] = useState("");
  const searchMutation = useMutation({
    mutationFn: (value: string) => search({ data: { query: value } }),
    onError: (error: Error) => toast.error(error.message),
  });

  const isStaff = me.data?.isStaff ?? false;

  const reset = () => {
    setTitle("");
    setExamSeries("");
    setPastedText("");
    setFiles([]);
    setChapterPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setOverallProgress(0);
    setQueue([]);
  };

  const updateQueueItem = (id: string, patch: Partial<QueueItem>) => {
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  /** Read a single File into plain text, routing PDFs through the OCR pipeline. */
  const readFile = async (file: File, onProgress: (label: string) => void): Promise<string> => {
    if (isPdfFile(file)) {
      const outcome = await ocrPdf(file, onProgress);
      if (outcome.failedPages.length > 0) {
        toast.warning(
          `${outcome.failedPages.length} page(s) of "${file.name}" couldn't be OCR'd and were skipped.`,
        );
      }
      return outcome.text;
    }
    onProgress("Reading file…");
    return file.text();
  };

  /** Ingest one already-extracted document: chunk, store, then embed to completion. */
  const ingestOne = async (params: {
    id: string;
    text: string;
    title: string;
    sourceName?: string;
  }) => {
    if (params.text.trim().length < 200) {
      updateQueueItem(params.id, { status: "failed", detail: "Not enough readable text." });
      return;
    }

    updateQueueItem(params.id, {
      status: "chunking",
      detail: "Splitting into searchable sections…",
    });

    const result = await ingest({
      data: {
        title: params.title,
        docType: (scope === "mcq_calibration"
          ? "mcq_calibration"
          : docType) as (typeof DOC_TYPES)[number]["value"],
        sourceName: params.sourceName,
        examSeries: examSeries.trim() || undefined,
        text: params.text,
      },
    });

    if (result.duplicateOf) {
      updateQueueItem(params.id, {
        status: "duplicate",
        detail: `Already in your library as "${result.duplicateOf}".`,
      });
      return;
    }

    let done = false;
    let embedded = 0;
    while (!done) {
      const batch = await embedBatch({ data: { documentId: result.documentId } });
      embedded += batch.embedded;
      done = batch.done;
      const total = embedded + batch.remaining;
      updateQueueItem(params.id, {
        status: "embedding",
        detail: `Indexing ${embedded} of ${total} sections…`,
      });
    }

    updateQueueItem(params.id, { status: "done", detail: "Ready." });
  };

  const runQueue = async (
    items: { id: string; title: string; text: string; sourceName?: string }[],
  ) => {
    setBusy(true);
    setQueue(
      items.map((item) => ({ id: item.id, title: item.title, status: "pending", detail: "" })),
    );
    setOverallProgress(0);

    let completed = 0;
    for (const item of items) {
      try {
        await ingestOne(item);
      } catch (error) {
        updateQueueItem(item.id, {
          status: "failed",
          detail: error instanceof Error ? error.message : "Failed to add this document.",
        });
      }
      completed += 1;
      setOverallProgress(Math.round((completed / items.length) * 100));
    }

    setBusy(false);
    const added = queue.filter((item) => item.status === "done").length;
    queryClient.invalidateQueries({ queryKey: ["documents"] });
    toast.success(
      items.length === 1
        ? "Document added to the knowledge base."
        : `Added ${items.length} documents to the knowledge base.`,
    );
    void added; // queue state updates are async; the toast above is a safe generic summary
    reset();
  };

  /** Called once files are chosen: extract text and decide single-doc vs preview. */
  const handleFilesSelected = async (selected: File[]) => {
    setFiles(selected);
    setChapterPreview(null);
    if (selected.length === 1 && !title) {
      setTitle(selected[0]!.name.replace(/\.[^.]+$/, ""));
    }

    // Chapter-split preview only makes sense for a single PDF — with several
    // files queued at once we just add each one as its own document (or,
    // if it happens to split into chapters, those are added automatically
    // without an interactive preview, since previewing several files' worth
    // of chapters at once isn't manageable in this UI).
    if (selected.length !== 1 || !isPdfFile(selected[0]!)) return;

    const file = selected[0]!;
    try {
      setBusy(true);
      setQueue([{ id: "preview", title: file.name, status: "reading", detail: "Reading file…" }]);
      const text = await readFile(file, (label) => updateQueueItem("preview", { detail: label }));
      const chapters = splitIntoChapters(text, file.name.replace(/\.[^.]+$/, ""));
      if (chapters.length >= MIN_PREVIEW_CHAPTERS) {
        setChapterPreview({ file, chapters, included: chapters.map(() => true) });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that file.");
    } finally {
      setBusy(false);
      setQueue([]);
    }
  };

  const handleAddChapters = async () => {
    if (!chapterPreview) return;
    const selected = chapterPreview.chapters.filter((_, index) => chapterPreview.included[index]);
    if (selected.length === 0) {
      toast.error("Select at least one chapter to add.");
      return;
    }
    await runQueue(
      selected.map((chapter, index) => ({
        id: `chapter-${index}`,
        title: chapter.title,
        text: chapter.text,
        sourceName: chapterPreview.file.name,
      })),
    );
  };

  const handleAddAsSingleDocument = async () => {
    if (!chapterPreview) return;
    const text = chapterPreview.chapters.map((chapter) => chapter.text).join("\n\n");
    await runQueue([
      {
        id: "single",
        title: title.trim() || chapterPreview.file.name.replace(/\.[^.]+$/, ""),
        text,
        sourceName: chapterPreview.file.name,
      },
    ]);
  };

  const handleUpload = async () => {
    if (chapterPreview) {
      await handleAddChapters();
      return;
    }

    try {
      if (files.length === 0) {
        const text = pastedText.trim();
        await runQueue([{ id: "pasted", title: title.trim() || "Untitled document", text }]);
        return;
      }

      setBusy(true);
      setQueue(
        files.map((file, index) => ({
          id: `file-${index}`,
          title: file.name,
          status: "pending",
          detail: "",
        })),
      );
      setBusy(false);

      const items: { id: string; title: string; text: string; sourceName?: string }[] = [];
      for (let index = 0; index < files.length; index++) {
        const file = files[index]!;
        const id = `file-${index}`;
        updateQueueItem(id, { status: "reading", detail: "Reading file…" });
        try {
          const text = await readFile(file, (label) => updateQueueItem(id, { detail: label }));
          const singleTitle =
            files.length === 1
              ? title.trim() || file.name.replace(/\.[^.]+$/, "")
              : file.name.replace(/\.[^.]+$/, "");

          // A single coursebook-looking file with several chapters gets split
          // automatically here (no interactive preview, since we're already
          // past that step for a multi-file batch); a lone file follows the
          // preview flow above instead and never reaches this branch.
          const chapters =
            files.length > 1
              ? splitIntoChapters(text, singleTitle)
              : [{ title: singleTitle, text }];

          if (chapters.length > 1) {
            chapters.forEach((chapter, chapterIndex) => {
              items.push({
                id: `${id}-ch${chapterIndex}`,
                title: chapter.title,
                text: chapter.text,
                sourceName: file.name,
              });
            });
          } else {
            items.push({
              id,
              title: chapters[0]!.title,
              text: chapters[0]!.text,
              sourceName: file.name,
            });
          }
        } catch (error) {
          updateQueueItem(id, {
            status: "failed",
            detail: error instanceof Error ? error.message : "Could not read this file.",
          });
        }
      }

      if (items.length === 0) {
        toast.error("Nothing readable was found in the selected file(s).");
        setBusy(false);
        return;
      }

      await runQueue(items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
      setBusy(false);
    }
  };

  const canSubmit = chapterPreview
    ? chapterPreview.included.some(Boolean)
    : files.length > 0 || pastedText.trim().length >= 200;

  return (
    <>
      <PageHeader
        title="Knowledge base"
        description="Add your coursebook, the 9708 syllabus, mark schemes and examiner reports. Every mark is then grounded in these documents and cited back to them."
      />

      {me.isLoading ? null : !isStaff ? (
        <div className="px-5 py-16 md:px-8">
          <div className="panel mx-auto max-w-md px-6 py-10 text-center">
            <h2 className="text-sm font-semibold">Teachers only</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The shared knowledge library is managed by your teachers. Everything in it already
              grounds your marking, MCQ papers and coaching automatically.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="px-5 pt-6 md:px-8">
            <Tabs
              value={scope}
              onValueChange={(value) => {
                setScope(value as "materials" | "mcq_calibration");
                setDocType(value === "mcq_calibration" ? "mcq_calibration" : "coursebook");
                reset();
              }}
            >
              <TabsList>
                <TabsTrigger value="materials">Course materials</TabsTrigger>
                <TabsTrigger value="mcq_calibration">MCQ calibration papers</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-6 px-5 py-6 md:px-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="panel space-y-4 p-5">
                <h2 className="text-sm font-semibold">
                  {scope === "mcq_calibration" ? "Add a calibration paper" : "Add documents"}
                </h2>
                {scope === "mcq_calibration" ? (
                  <p className="-mt-2 text-xs text-muted-foreground">
                    A separate place, kept apart from your teaching materials: drop in real AS/A2
                    past MCQ papers here. The MCQ generator uses them only as a calibration
                    reference — for real question style and the pacing of a 30-question paper —
                    never as a source it copies questions from.
                  </p>
                ) : null}

                <div className="space-y-1.5">
                  <Label htmlFor="file">PDF or text file(s)</Label>
                  <Input
                    id="file"
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.txt,.md,application/pdf,text/plain"
                    multiple
                    disabled={busy}
                    onChange={(event) => {
                      const selected = Array.from(event.target.files ?? []);
                      void handleFilesSelected(selected);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Select several files to bulk-add them in one go. A single coursebook PDF with
                    "Chapter N" headings is automatically offered as separate chapter documents —
                    typed PDFs are read directly, scanned ones with OCR.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="title">
                    Title{files.length > 1 ? " (used per file name)" : ""}
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    disabled={busy || files.length > 1}
                    placeholder={
                      scope === "mcq_calibration"
                        ? "Cambridge 9708 Paper 1 MCQ — Nov 2024"
                        : "Cambridge International AS & A Level Economics Coursebook"
                    }
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>

                <div className={cn("grid gap-3", scope === "mcq_calibration" ? "" : "grid-cols-2")}>
                  {scope === "mcq_calibration" ? null : (
                    <div className="space-y-1.5">
                      <Label htmlFor="docType">Type</Label>
                      <Select value={docType} onValueChange={setDocType} disabled={busy}>
                        <SelectTrigger id="docType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOC_TYPES.filter((type) => type.value !== "mcq_calibration").map(
                            (type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="series">Series (optional)</Label>
                    <Input
                      id="series"
                      value={examSeries}
                      disabled={busy}
                      placeholder="Nov 2024"
                      onChange={(event) => setExamSeries(event.target.value)}
                    />
                  </div>
                </div>

                {files.length === 0 ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="paste">Or paste text</Label>
                    <Textarea
                      id="paste"
                      rows={5}
                      disabled={busy}
                      placeholder="Paste syllabus sections, mark scheme wording or class notes…"
                      value={pastedText}
                      onChange={(event) => setPastedText(event.target.value)}
                    />
                  </div>
                ) : null}

                {chapterPreview ? (
                  <div className="space-y-2 rounded-md border border-border p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <Layers className="size-3.5" />
                      Detected {chapterPreview.chapters.length} chapters in "
                      {chapterPreview.file.name}"
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Add each chapter as its own document, or uncheck any you don't want.
                    </p>
                    <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                      {chapterPreview.chapters.map((chapter, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Checkbox
                            checked={chapterPreview.included[index]}
                            onCheckedChange={(checked) =>
                              setChapterPreview((current) => {
                                if (!current) return current;
                                const included = [...current.included];
                                included[index] = checked === true;
                                return { ...current, included };
                              })
                            }
                            disabled={busy}
                          />
                          <span className="text-xs leading-snug">
                            {chapter.title}
                            <span className="text-muted-foreground">
                              {" "}
                              · {Math.round(chapter.text.length / 1000)}k characters
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      disabled={busy}
                      onClick={handleAddAsSingleDocument}
                    >
                      Add as one document instead
                    </Button>
                  </div>
                ) : null}

                {queue.length > 0 ? (
                  <div className="space-y-2">
                    {busy ? <Progress value={overallProgress} className="h-1.5" /> : null}
                    <ul className="max-h-48 space-y-1 overflow-y-auto text-xs">
                      {queue.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-2">
                          <span className="truncate">{item.title}</span>
                          <span
                            className={
                              item.status === "failed"
                                ? "text-destructive"
                                : item.status === "done"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-muted-foreground"
                            }
                          >
                            {item.status === "pending" ? "Queued…" : item.detail || item.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <Button className="w-full" disabled={busy || !canSubmit} onClick={handleUpload}>
                  {busy ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Working…
                    </>
                  ) : chapterPreview ? (
                    <>
                      <Upload className="size-4" />
                      Add {chapterPreview.included.filter(Boolean).length} chapters
                    </>
                  ) : (
                    <>
                      <Upload className="size-4" />
                      {scope === "mcq_calibration"
                        ? "Add calibration paper"
                        : "Add to knowledge base"}
                    </>
                  )}
                </Button>
              </div>

              <div className="panel space-y-3 p-5">
                <h2 className="text-sm font-semibold">Test retrieval</h2>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. evaluation of price ceilings"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && query.trim().length > 1) {
                        searchMutation.mutate(query.trim());
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    disabled={query.trim().length < 2 || searchMutation.isPending}
                    onClick={() => searchMutation.mutate(query.trim())}
                  >
                    {searchMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                  </Button>
                </div>
                {searchMutation.data?.length ? (
                  <ul className="space-y-2.5">
                    {searchMutation.data.map((hit, index) => (
                      <li key={index} className="rounded-md border border-border p-3">
                        <p className="text-xs font-medium">
                          {hit.documentTitle}
                          {hit.heading ? ` — ${hit.heading}` : ""}{" "}
                          <span className="text-muted-foreground">
                            ({Math.round(hit.similarity * 100)}%)
                          </span>
                        </p>
                        <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                          {hit.snippet}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : searchMutation.isSuccess ? (
                  <p className="text-xs text-muted-foreground">
                    No matches yet — add more documents.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="panel">
              <div className="border-b border-border px-5 py-3.5">
                <h2 className="text-sm font-semibold">
                  {scope === "mcq_calibration" ? "Calibration papers" : "Library"}
                </h2>
              </div>

              {docs.isLoading ? (
                <div className="space-y-2 p-5">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : scopedDocs.length === 0 ? (
                <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {scope === "mcq_calibration"
                    ? "No calibration papers yet. Add a real AS/A2 MCQ past paper on the left."
                    : "Nothing here yet. Start with the 9708 syllabus and your coursebook."}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {scopedDocs.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-3 px-5 py-3.5">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{doc.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {doc.doc_type.replace(/_/g, " ")} · {doc.chunk_count} sections ·{" "}
                          {Math.round(doc.char_count / 1000)}k characters
                          {doc.exam_series ? ` · ${doc.exam_series}` : ""}
                        </p>
                        {doc.error_message ? (
                          <p className="mt-1 text-xs text-destructive">{doc.error_message}</p>
                        ) : null}
                      </div>
                      <Badge
                        variant={
                          doc.status === "ready"
                            ? "default"
                            : doc.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {doc.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          try {
                            await removeDoc({ data: { id: doc.id } });
                            queryClient.invalidateQueries({ queryKey: ["documents"] });
                            toast.success("Removed.");
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? "Only teachers and admins can remove documents."
                                : "Delete failed.",
                            );
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
