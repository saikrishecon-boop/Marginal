import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, ListChecks, Loader2, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/app-shell";
import { EconomicsDiagram } from "@/components/diagrams/economics-diagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDiagram } from "@/lib/diagrams/catalog";
import { cn } from "@/lib/utils";
import {
  createMcqPaper,
  generateMcqBatch,
  getMcqAttempt,
  listMcqAttempts,
  submitMcqPaper,
} from "@/lib/mcq.functions";
import type { McqOption, McqQuestion } from "@/lib/mcq/mcq.server";

export const Route = createFileRoute("/_authenticated/mcq")({
  head: () => ({
    meta: [
      { title: "MCQ papers — Marginal Economics" },
      {
        name: "description",
        content:
          "Generate a 30-question Cambridge 9708 style multiple choice paper from your own coursebook and syllabus, then get it marked question by question.",
      },
      { property: "og:title", content: "MCQ papers — Marginal Economics" },
      {
        property: "og:description",
        content: "Past-paper style 30-question MCQ practice, marked with examiner explanations.",
      },
    ],
  }),
  component: McqPage,
});

const LETTERS: McqOption[] = ["A", "B", "C", "D"];

/** Real Cambridge 9708 paper timings: Paper 1 (AS) is 1 hour, Paper 3 (A Level) is 1h15. */
const PAPER_DURATION_SECONDS: Record<"as" | "a2", number> = {
  as: 60 * 60,
  a2: 75 * 60,
};

const formatClock = (totalSeconds: number): string => {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

type Marked = Awaited<ReturnType<typeof submitMcqPaper>>;

function McqPage() {
  const queryClient = useQueryClient();
  const startPaper = useServerFn(createMcqPaper);
  const nextBatch = useServerFn(generateMcqBatch);
  const submit = useServerFn(submitMcqPaper);
  const fetchAttempts = useServerFn(listMcqAttempts);
  const loadAttempt = useServerFn(getMcqAttempt);

  const attempts = useQuery({ queryKey: ["mcq-attempts"], queryFn: () => fetchAttempts() });

  const [level, setLevel] = useState<"as" | "a2">("as");
  const [topic, setTopic] = useState("");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, McqOption>>({});
  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [marked, setMarked] = useState<Marked | null>(null);

  // Exam timer: real Cambridge time per paper, counted down from when the
  // paper is ready to answer (or, on resume, from when it was first built —
  // reopening a paper never grants extra time). null means no active clock.
  const [examEndsAt, setExamEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    if (examEndsAt === null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [examEndsAt]);

  const remainingSeconds =
    examEndsAt === null ? null : Math.max(0, Math.round((examEndsAt - now) / 1000));

  const build = async () => {
    setBuilding(true);
    setMarked(null);
    setAnswers({});
    setQuestions([]);
    setProgress(2);
    try {
      const paper = await startPaper({ data: { level, topic: topic.trim() || undefined } });
      setAttemptId(paper.attemptId);

      let done = false;
      let guard = 0;
      while (!done && guard < 8) {
        guard += 1;
        const batch = await nextBatch({ data: { attemptId: paper.attemptId } });
        done = batch.done;
        setProgress(Math.round((batch.count / batch.total) * 100));
      }

      const full = await loadAttempt({ data: { attemptId: paper.attemptId } });
      setQuestions(full.questions);
      toast.success(`${full.questions.length} questions ready.`);
      queryClient.invalidateQueries({ queryKey: ["mcq-attempts"] });
      autoSubmittedRef.current = false;
      setExamEndsAt(Date.now() + PAPER_DURATION_SECONDS[level] * 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not build the paper.");
    } finally {
      setBuilding(false);
    }
  };

  const markMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId) throw new Error("Build a paper first.");
      return submit({ data: { attemptId, answers } });
    },
    onSuccess: (result) => {
      setMarked(result);
      setExamEndsAt(null);
      queryClient.invalidateQueries({ queryKey: ["mcq-attempts"] });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Auto-submit the moment real exam time runs out — a candidate never gets
  // to keep answering past the clock, so neither does this practice paper.
  useEffect(() => {
    if (
      remainingSeconds === 0 &&
      questions.length > 0 &&
      !marked &&
      !autoSubmittedRef.current &&
      !markMutation.isPending
    ) {
      autoSubmittedRef.current = true;
      toast.info("Time's up — your paper was submitted automatically.");
      markMutation.mutate();
    }
  }, [remainingSeconds, questions.length, marked, markMutation]);

  const answered = Object.keys(answers).length;

  const resume = async (id: string) => {
    try {
      const full = await loadAttempt({ data: { attemptId: id } });
      setAttemptId(id);
      setQuestions(full.questions);
      setAnswers(full.answers ?? {});
      setMarked(null);
      autoSubmittedRef.current = false;
      // Already-marked papers get no clock; otherwise the clock resumes from
      // when the paper was first built, so reopening it never buys extra time.
      if (full.status === "marked" || full.score !== null) {
        setExamEndsAt(null);
      } else {
        const resumedLevel = (full.level as "as" | "a2") ?? "as";
        const createdAtMs = new Date(full.created_at).getTime();
        setExamEndsAt(createdAtMs + PAPER_DURATION_SECONDS[resumedLevel] * 1000);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open that paper.");
    }
  };

  return (
    <>
      <PageHeader
        title="MCQ papers"
        description="A 30-question multiple choice paper written in real Cambridge 9708 house style from your own coursebook and syllabus — then marked question by question with the misconception behind every wrong option."
        action={
          remainingSeconds !== null ? (
            <div
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm font-semibold tabular-nums",
                remainingSeconds <= 300
                  ? "border-destructive/50 bg-destructive/10 text-destructive"
                  : "border-border bg-card text-foreground",
              )}
              role="timer"
              aria-live="polite"
            >
              <Clock className="size-4" />
              {formatClock(remainingSeconds)}
              <span className="hidden font-sans text-xs font-normal text-muted-foreground sm:inline">
                {level === "a2" ? "Paper 3 · 1h15" : "Paper 1 · 1h"} remaining
              </span>
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-6 px-5 py-6 md:px-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="panel space-y-4 p-5">
            <h2 className="text-sm font-semibold">New paper</h2>

            <Tabs value={level} onValueChange={(value) => setLevel(value as "as" | "a2")}>
              <TabsList className="w-full">
                <TabsTrigger value="as" className="flex-1">
                  AS Paper 1
                </TabsTrigger>
                <TabsTrigger value="a2" className="flex-1">
                  A Level Paper 3
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-1.5">
              <Label htmlFor="topic">Topic focus (optional)</Label>
              <Input
                id="topic"
                value={topic}
                disabled={building}
                placeholder="e.g. elasticity and price controls"
                onChange={(event) => setTopic(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank for a full-syllabus paper spread across all sections.
              </p>
            </div>

            {building ? (
              <div className="space-y-2">
                <Progress value={progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">
                  Writing questions from the knowledge base… {progress}%
                </p>
              </div>
            ) : null}

            <Button className="w-full" disabled={building} onClick={build}>
              {building ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Building 30 questions…
                </>
              ) : (
                <>
                  <ListChecks className="size-4" /> Generate 30 questions
                </>
              )}
            </Button>
          </div>

          <div className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold">Your papers</h2>
            {(attempts.data?.length ?? 0) === 0 ? (
              <p className="text-xs text-muted-foreground">No papers yet.</p>
            ) : (
              <ul className="space-y-2">
                {attempts.data?.map((attempt) => (
                  <li key={attempt.id}>
                    <button
                      className="w-full rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-accent"
                      onClick={() => resume(attempt.id)}
                    >
                      <p className="truncate text-xs font-medium">{attempt.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {attempt.score !== null
                          ? `${attempt.score}/${attempt.total}`
                          : attempt.status}
                        {" · "}
                        {new Date(attempt.created_at).toLocaleDateString()}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {marked ? (
            <div className="panel space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-2xl font-semibold">
                  {marked.score}
                  <span className="text-base text-muted-foreground">/{marked.total}</span>
                </p>
                <Badge variant="secondary">
                  {Math.round((marked.score / Math.max(marked.total, 1)) * 100)}%
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setMarked(null)}
                >
                  <RotateCcw className="size-4" /> Review answers
                </Button>
              </div>
              {marked.weakestTopics.length > 0 ? (
                <div>
                  <p className="text-xs font-medium">Work on these next</p>
                  <ul className="mt-1 space-y-1">
                    {marked.weakestTopics.map((entry) => (
                      <li key={entry.topic} className="text-xs text-muted-foreground">
                        {entry.topic} — {entry.correct}/{entry.total}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Full marks — nothing flagged.</p>
              )}
            </div>
          ) : null}

          {questions.length === 0 && !building ? (
            <div className="panel px-5 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Generate a paper to start. Thirty questions, one mark each, exactly like the real
                multiple choice paper.
              </p>
            </div>
          ) : null}

          {questions.map((question) => {
            const reviewed = marked?.review.find((item) => item.number === question.number);
            return (
              <div key={question.number} className="panel space-y-3 p-5">
                <div className="flex items-start gap-3">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {question.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm whitespace-pre-line">{question.stem}</p>
                    <McqDiagram id={question.diagramId} />
                    <div className="mt-3 space-y-1.5">
                      {LETTERS.map((letter) => {
                        const selected = answers[String(question.number)] === letter;
                        const isKey = reviewed && reviewed.answer === letter;
                        const wrongPick = reviewed && selected && !reviewed.correct;
                        return (
                          <button
                            key={letter}
                            disabled={Boolean(marked)}
                            onClick={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [String(question.number)]: letter,
                              }))
                            }
                            className={cn(
                              "flex w-full items-start gap-2.5 rounded-md border border-border px-3 py-2 text-left text-sm transition-colors",
                              !marked && "hover:bg-accent",
                              selected && !marked && "border-primary bg-primary/10",
                              isKey && "border-primary bg-primary/10",
                              wrongPick && "border-destructive bg-destructive/10",
                            )}
                          >
                            <span className="font-medium">{letter}</span>
                            <span className="min-w-0 flex-1">{question.options[letter]}</span>
                            {isKey ? (
                              <CheckCircle2 className="size-4 shrink-0 text-primary" />
                            ) : wrongPick ? (
                              <XCircle className="size-4 shrink-0 text-destructive" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>

                    {reviewed ? (
                      <div className="mt-3 space-y-1.5 rounded-md bg-muted/40 p-3">
                        <p className="text-xs">
                          <span className="font-medium">Answer {reviewed.answer}.</span>{" "}
                          {reviewed.explanation}
                        </p>
                        {reviewed.whyWrong ? (
                          <p className="text-xs text-muted-foreground">
                            Why {reviewed.given} is wrong: {reviewed.whyWrong}
                          </p>
                        ) : null}
                        <p className="text-xs text-muted-foreground">
                          {reviewed.topic}
                          {reviewed.syllabusRef ? ` · syllabus ${reviewed.syllabusRef}` : ""} ·{" "}
                          {reviewed.skill}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}

          {questions.length > 0 && !marked ? (
            <div className="sticky bottom-4 flex items-center gap-3 rounded-lg border border-border bg-card/95 px-4 py-3 backdrop-blur">
              <p className="text-xs text-muted-foreground">
                {answered} of {questions.length} answered
              </p>
              {remainingSeconds !== null ? (
                <p
                  className={cn(
                    "font-mono text-xs font-semibold tabular-nums",
                    remainingSeconds <= 300 && "text-destructive",
                  )}
                >
                  {formatClock(remainingSeconds)} left
                </p>
              ) : null}
              <Button
                className="ml-auto"
                disabled={answered === 0 || markMutation.isPending}
                onClick={() => markMutation.mutate()}
              >
                {markMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Marking…
                  </>
                ) : (
                  "Mark paper"
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

/** Renders the library diagram a generated question refers to, if any. */
function McqDiagram({ id }: { id?: string | null }) {
  const entry = getDiagram(id);
  if (!entry) return null;
  return (
    <figure className="mt-3 rounded-lg border border-border bg-card p-3">
      <EconomicsDiagram spec={entry.spec} title={entry.title} className="mx-auto max-w-md" />
      <figcaption className="mt-1 text-center text-xs text-muted-foreground">
        {entry.title}
      </figcaption>
    </figure>
  );
}
