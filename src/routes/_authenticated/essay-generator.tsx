import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { GraduationCap, Loader2, Quote, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/app-shell";
import { EconomicsDiagram } from "@/components/diagrams/economics-diagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDiagram, topicsFor } from "@/lib/diagrams/catalog";
import { generateModelEssay } from "@/lib/essay.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/essay-generator")({
  head: () => ({
    meta: [
      { title: "Perfect essay generator — Cambridge 9708 Economics" },
      {
        name: "description",
        content:
          "Generate a full-mark Cambridge AS & A Level Economics essay, structured exactly as taught in class — knowledge, analysis with application, evaluation and a reasoned conclusion — with correct diagrams and an AO mark breakdown.",
      },
      { property: "og:title", content: "Perfect essay generator — Cambridge 9708 Economics" },
      {
        property: "og:description",
        content:
          "Examiner-standard model answers with the right diagrams inserted and an AO1/AO2/AO3 breakdown.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EssayGeneratorPage,
});

const MARKS = [8, 12, 20, 25];

function EssayGeneratorPage() {
  const [level, setLevel] = useState<"as" | "a2">("as");
  const [topic, setTopic] = useState("Government microeconomic intervention");
  const [question, setQuestion] = useState("");
  const [maxMark, setMaxMark] = useState(12);

  const generate = useServerFn(generateModelEssay);
  const topics = [...topicsFor("Microeconomics"), ...topicsFor("Macroeconomics")];

  const mutation = useMutation({
    mutationFn: () => generate({ data: { level, topic, question, maxMark } }),
    onError: (error: Error) => toast.error(error.message),
  });

  const essay = mutation.data?.essay ?? null;

  return (
    <>
      <PageHeader
        title="Perfect essay generator"
        description="An examiner-standard model answer, structured exactly as the mark scheme rewards, capped at 650 words to match real exam-script length, with the correct diagrams inserted and an AO breakdown."
      />

      <div className="grid gap-0 lg:grid-cols-[380px_1fr]">
        <section className="space-y-4 border-border p-5 lg:border-r md:p-6">
          <div className="space-y-2">
            <Label>Level</Label>
            <Tabs value={level} onValueChange={(value) => setLevel(value as "as" | "a2")}>
              <TabsList className="w-full">
                <TabsTrigger value="as" className="flex-1">
                  AS Level
                </TabsTrigger>
                <TabsTrigger value="a2" className="flex-1">
                  A Level
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              list="essay-topics"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Market failure and externalities"
            />
            <datalist id="essay-topics">
              {topics.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={6}
              placeholder="Paste the exact question, e.g. 'Assess whether an indirect tax is the best way to reduce consumption of a demerit good. [12]'"
            />
          </div>

          <div className="space-y-2">
            <Label>Marks</Label>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {MARKS.map((mark) => (
                <button
                  key={mark}
                  type="button"
                  onClick={() => setMaxMark(mark)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
                    maxMark === mark && "bg-background text-foreground shadow-sm",
                  )}
                >
                  {mark}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            disabled={mutation.isPending || question.trim().length < 10}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Writing the model answer…
              </>
            ) : (
              <>
                <Wand2 className="size-4" /> Generate model essay
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Grounded in your coursebook and syllabus knowledge base. Diagrams are taken from the
            diagram library so every figure follows Cambridge convention.
          </p>
        </section>

        <section className="min-w-0 p-5 md:p-8">
          {!essay ? (
            <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="size-5" />
              </span>
              <p className="max-w-sm text-sm text-muted-foreground">
                Choose the level, topic and marks, paste the question, and a principal-examiner
                model answer appears here with diagrams and an AO breakdown.
              </p>
            </div>
          ) : (
            <article className="space-y-6">
              <header className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{essay.level === "a2" ? "A Level" : "AS Level"}</Badge>
                  <Badge variant="outline">{essay.topic}</Badge>
                  <Badge variant="outline">{essay.maxMark} marks</Badge>
                  <Badge variant={essay.wordCount > essay.wordLimit ? "destructive" : "outline"}>
                    {essay.wordCount} / {essay.wordLimit} words
                  </Badge>
                </div>
                <p className="text-base font-medium">{essay.question}</p>
                {essay.trimmedToFit ? (
                  <p className="text-xs text-muted-foreground">
                    Trimmed to fit the {essay.wordLimit}-word exam-standard limit.
                  </p>
                ) : null}
              </header>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Estimated mark
                  </p>
                  <p className="text-2xl font-semibold">
                    {essay.estimatedMark}
                    <span className="text-base text-muted-foreground">/{essay.maxMark}</span>
                  </p>
                </div>
                <AoCard
                  label="AO1 Knowledge"
                  score={essay.ao.ao1}
                  max={essay.aoMax.ao1}
                  bar="bg-ao1"
                />
                <AoCard
                  label="AO2 Analysis"
                  score={essay.ao.ao2}
                  max={essay.aoMax.ao2}
                  bar="bg-ao2"
                />
                <AoCard
                  label="AO3 Evaluation"
                  score={essay.ao.ao3}
                  max={essay.aoMax.ao3}
                  bar="bg-ao3"
                />
              </div>

              {essay.keyTerms.length > 0 ? (
                <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                  <h3 className="mb-3 text-sm font-semibold">Key terms defined</h3>
                  <dl className="divide-y divide-border">
                    {essay.keyTerms.map((term) => (
                      <div
                        key={term.term}
                        className="grid gap-1 py-2 sm:grid-cols-[160px_1fr] sm:gap-4"
                      >
                        <dt className="text-sm font-medium">{term.term}</dt>
                        <dd className="text-sm text-muted-foreground">{term.definition}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

              <div className="space-y-6">
                {essay.sections.map((section, sectionIndex) => (
                  <section key={sectionIndex} className="space-y-3">
                    <h3 className="border-b border-border pb-1.5 text-sm font-semibold">
                      {section.heading}
                    </h3>
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={index} className="text-sm leading-relaxed text-foreground/90">
                        {paragraph}
                      </p>
                    ))}
                    {section.diagramIds.map((id) => {
                      const entry = getDiagram(id);
                      if (!entry) return null;
                      return (
                        <figure
                          key={id}
                          className="rounded-lg border border-border bg-card p-3 md:p-4"
                        >
                          <EconomicsDiagram
                            spec={entry.spec}
                            title={entry.title}
                            className="mx-auto max-w-lg"
                          />
                          <figcaption className="mt-1 text-center text-xs text-muted-foreground">
                            {entry.title}
                          </figcaption>
                        </figure>
                      );
                    })}
                  </section>
                ))}
              </div>

              {essay.examinerComments.length > 0 ? (
                <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Quote className="size-4 text-primary" /> Examiner comments
                  </h3>
                  <ul className="space-y-2">
                    {essay.examinerComments.map((comment, index) => (
                      <li key={index} className="flex gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/70" />
                        <span>{comment}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {essay.markSchemeNotes.length > 0 ? (
                <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="size-4 text-primary" /> What a mark scheme credits here
                  </h3>
                  <ul className="space-y-2">
                    {essay.markSchemeNotes.map((note, index) => (
                      <li key={index} className="flex gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          )}
        </section>
      </div>
    </>
  );
}

function AoCard({
  label,
  score,
  max,
  bar,
}: {
  label: string;
  score: number;
  max: number;
  bar: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-2xl font-semibold">
        {score}
        <span className="text-base text-muted-foreground">/{max}</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", bar)}
          style={{ width: `${max > 0 ? (score / max) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}
