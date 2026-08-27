import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, CheckCircle2, Loader2, SpellCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/app-shell";
import { HandwritingUpload } from "@/components/app/handwriting-upload";
import { MarkBreakdown } from "@/components/app/mark-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { describeDiagramUrl, listDiagramLibrary } from "@/lib/diagrams.functions";
import { gradeEssaySubmission } from "@/lib/grading.functions";
import { checkWritingQuality } from "@/lib/writing-check.functions";
import type { Grading } from "@/lib/examiner/types";

export const Route = createFileRoute("/_authenticated/grade")({
  head: () => ({
    meta: [
      { title: "Mark an essay — Marginal Economics" },
      {
        name: "description",
        content:
          "Submit a Cambridge 9708 Economics essay and get an examiner-standard mark with AO1, AO2 and AO3 breakdown plus rewrite guidance.",
      },
      { property: "og:title", content: "Mark an essay — Marginal Economics" },
      {
        property: "og:description",
        content: "Examiner-standard marking with a full assessment-objective breakdown.",
      },
    ],
  }),
  component: GradePage,
});

type WritingIssue = {
  original: string;
  suggestion: string;
  type: "spelling" | "grammar";
  context: string;
};
type WritingCheck = { issues: WritingIssue[]; correctedText: string; clean: boolean };

function GradePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const grade = useServerFn(gradeEssaySubmission);
  const checkWriting = useServerFn(checkWritingQuality);
  const describeDiagram = useServerFn(describeDiagramUrl);
  const listDiagrams = useServerFn(listDiagramLibrary);

  const [question, setQuestion] = useState("");
  const [essayText, setEssayText] = useState("");
  const [maxMark, setMaxMark] = useState("12");
  const [useAnchors, setUseAnchors] = useState(true);
  const [auditPass, setAuditPass] = useState(true);
  const [useRetrieval, setUseRetrieval] = useState(true);
  const [result, setResult] = useState<{ grading: Grading; essayId: string | null } | null>(null);

  const [diagramMode, setDiagramMode] = useState<"none" | "library" | "url">("none");
  const [diagramLibraryId, setDiagramLibraryId] = useState<string>("");
  const [diagramUrl, setDiagramUrl] = useState("");
  const [diagramTag, setDiagramTag] = useState<string | null>(null);

  const [writingCheck, setWritingCheck] = useState<WritingCheck | null>(null);
  const [checkedTextSnapshot, setCheckedTextSnapshot] = useState<string | null>(null);

  const diagramLibraryQuery = useQuery({
    queryKey: ["diagram-library"],
    queryFn: () => listDiagrams(),
    staleTime: 10 * 60_000,
  });

  const describeDiagramMutation = useMutation({
    mutationFn: (url: string) => describeDiagram({ data: { url } }),
    onSuccess: (data) => {
      setDiagramTag(data.tag);
      toast.success("Diagram read and ready to attach to your essay.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const checkMutation = useMutation({
    mutationFn: () => checkWriting({ data: { essayText } }),
    onSuccess: (data) => {
      setWritingCheck(data as WritingCheck);
      setCheckedTextSnapshot(essayText);
      if (data.clean) toast.success("No spelling or grammar issues found.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const mutation = useMutation({
    mutationFn: () =>
      grade({
        data: {
          question,
          essayText,
          maxMark: Number(maxMark),
          useAnchors,
          auditPass,
          useRetrieval,
          diagramReference: diagramTag ?? undefined,
        },
      }),
    onSuccess: (data) => {
      setResult({ grading: data.grading as Grading, essayId: data.essayId });
      queryClient.invalidateQueries({ queryKey: ["essays"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      toast.success(`Marked ${data.grading.total_mark}/${data.grading.max_mark}`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const words = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;

  // Any edit to the essay after a check invalidates it, so a stale "clean"
  // result can never be carried into a since-edited essay.
  const checkIsStale = writingCheck !== null && checkedTextSnapshot !== essayText;
  const readyToMark = writingCheck !== null && !checkIsStale;

  const selectedDiagram = useMemo(
    () => diagramLibraryQuery.data?.find((entry) => entry.id === diagramLibraryId) ?? null,
    [diagramLibraryQuery.data, diagramLibraryId],
  );

  function applyLibraryDiagram(id: string) {
    setDiagramLibraryId(id);
    const entry = diagramLibraryQuery.data?.find((item) => item.id === id);
    if (!entry) return;
    const curves = entry.curveLabels.filter(Boolean).join(", ") || "not specified";
    const tag =
      `[DIAGRAM: ${entry.title} | axes: ${entry.yLabel} (y) / ${entry.xLabel} (x) | ` +
      `curves: ${curves} | labels: as per the standard ${entry.title} diagram | ` +
      `accuracy: reference diagram selected from the diagram library by the student — verify it is correctly applied to their written argument]`;
    setDiagramTag(tag);
  }

  function handleMarkClick() {
    if (!readyToMark) {
      checkMutation.mutate();
      return;
    }
    mutation.mutate();
  }

  return (
    <>
      <PageHeader
        title="Mark an essay"
        description="Marked to Cambridge 9708 standards, grounded in your own coursebook and mark schemes, then independently audited for central-tendency bias."
      />

      <div className="grid gap-6 px-5 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="panel space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Not sure how to lay out your answer?{" "}
              <Link
                to="/response-structure"
                className="font-medium text-foreground underline underline-offset-2"
              >
                See how to structure a response
              </Link>
              .
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="question">Exam question</Label>
            <Textarea
              id="question"
              rows={3}
              placeholder="Discuss whether a rise in the minimum wage will always reduce employment."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maxMark">Question type</Label>
            <Select
              value={maxMark}
              onValueChange={(value) => {
                setMaxMark(value);
                setWritingCheck(null);
              }}
            >
              <SelectTrigger id="maxMark">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">
                  8 marks (normal 8-mark question — AO1 2 / AO2 4 / AO3 2)
                </SelectItem>
                <SelectItem value="12">
                  12 marks (evaluative essay — AO1 2 / AO2 6 / AO3 4)
                </SelectItem>
                <SelectItem value="20">20 marks (A Level essay)</SelectItem>
                <SelectItem value="25">25 marks (A Level extended)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="essay">Your answer</Label>
              <span className="text-xs text-muted-foreground">{words} words</span>
            </div>
            <Textarea
              id="essay"
              rows={16}
              className="font-mono text-[13px] leading-relaxed"
              placeholder="Paste or type your full essay here…"
              value={essayText}
              onChange={(event) => {
                setEssayText(event.target.value);
                setWritingCheck(null);
              }}
            />
          </div>

          <HandwritingUpload
            hint={question}
            onText={(text) => {
              setEssayText((current) => (current.trim() ? `${current.trim()}\n\n${text}` : text));
              setWritingCheck(null);
            }}
          />

          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <Label className="text-sm font-medium">Diagram reference (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Typed your essay online and referred to a diagram without drawing it? Attach one so
              it's marked like a real drawn diagram — pick it from the diagram library, or paste a
              link to an image of it.
            </p>

            <Select
              value={diagramMode}
              onValueChange={(value: "none" | "library" | "url") => {
                setDiagramMode(value);
                if (value === "none") setDiagramTag(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No diagram to reference</SelectItem>
                <SelectItem value="library">Choose from the diagram library</SelectItem>
                <SelectItem value="url">Paste a diagram image URL</SelectItem>
              </SelectContent>
            </Select>

            {diagramMode === "library" ? (
              <Select value={diagramLibraryId} onValueChange={applyLibraryDiagram}>
                <SelectTrigger>
                  <SelectValue placeholder="Search the diagram library…" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {(diagramLibraryQuery.data ?? []).map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.title} · {entry.section === "Microeconomics" ? "Micro" : "Macro"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}

            {diagramMode === "url" ? (
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/my-diagram.png"
                  value={diagramUrl}
                  onChange={(event) => setDiagramUrl(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!diagramUrl.trim() || describeDiagramMutation.isPending}
                  onClick={() => describeDiagramMutation.mutate(diagramUrl.trim())}
                >
                  {describeDiagramMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Read diagram"
                  )}
                </Button>
              </div>
            ) : null}

            {diagramTag ? (
              <div className="flex items-start gap-2 rounded-md border border-border bg-background p-2.5 text-xs">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                <span className="text-muted-foreground">
                  Attached{selectedDiagram ? `: ${selectedDiagram.title}` : ""} — this will be
                  graded like a diagram drawn on the page.
                </span>
              </div>
            ) : null}
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <Toggle
              label="Independent audit pass"
              hint="A second examiner re-checks the mark to correct clustering around the middle bands."
              checked={auditPass}
              onChange={setAuditPass}
            />
            <Toggle
              label="Calibration anchors"
              hint="Anchor the standard to teacher-verified essays with confirmed marks."
              checked={useAnchors}
              onChange={setUseAnchors}
            />
            <Toggle
              label="Ground in knowledge base"
              hint="Retrieve syllabus, coursebook and mark scheme extracts before marking."
              checked={useRetrieval}
              onChange={setUseRetrieval}
            />
          </div>

          {writingCheck && !checkIsStale ? (
            <WritingCheckPanel
              check={writingCheck}
              onAccept={() => {
                setEssayText(writingCheck.correctedText);
                setCheckedTextSnapshot(writingCheck.correctedText);
              }}
            />
          ) : null}

          <Button
            className="w-full"
            disabled={
              mutation.isPending ||
              checkMutation.isPending ||
              question.trim().length < 10 ||
              words < 20
            }
            onClick={handleMarkClick}
          >
            {checkMutation.isPending ? (
              <>
                <SpellCheck className="size-4 animate-pulse" /> Checking spelling &amp; grammar…
              </>
            ) : mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Marking — this takes up to a minute
              </>
            ) : readyToMark ? (
              <>
                <Sparkles className="size-4" /> Mark this essay
              </>
            ) : (
              <>
                <SpellCheck className="size-4" /> Check spelling &amp; grammar, then mark
              </>
            )}
          </Button>
        </div>

        <div>
          {result ? (
            <div className="space-y-4">
              <MarkBreakdown grading={result.grading} />
              {result.essayId ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    navigate({ to: "/essay/$essayId", params: { essayId: result.essayId! } })
                  }
                >
                  Open full report and rewrite
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="panel flex h-full min-h-64 flex-col items-center justify-center p-8 text-center">
              <Sparkles className="size-6 text-muted-foreground" />
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                Your mark, AO breakdown, missing elements and rewrite plan will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function WritingCheckPanel({ check, onAccept }: { check: WritingCheck; onAccept: () => void }) {
  if (check.clean) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-4 shrink-0" /> No spelling or grammar issues found — ready to
        mark.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
        <AlertCircle className="size-4 shrink-0" />
        {check.issues.length} spelling/grammar issue{check.issues.length === 1 ? "" : "s"} found
      </div>
      <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
        {check.issues.map((issue, index) => (
          <li key={index} className="rounded-md border border-border bg-background p-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] capitalize">
                {issue.type}
              </Badge>
              <span className="text-destructive line-through">{issue.original}</span>
              <span>→</span>
              <span className="font-medium">{issue.suggestion}</span>
            </div>
            {issue.context ? <p className="mt-1 text-muted-foreground">"{issue.context}"</p> : null}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onAccept}>
          Apply corrections
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        These are spelling/grammar fixes only — economics content and marks are never changed by
        this check. You can also mark the essay as originally written.
      </p>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
