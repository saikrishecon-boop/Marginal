import { Check, ShieldCheck, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Grading } from "@/lib/examiner/types";
import { cn } from "@/lib/utils";

const AO_META = [
  { key: "knowledge", label: "AO1 Knowledge", bar: "bg-ao1", text: "text-ao1" },
  { key: "analysis", label: "AO2 Analysis", bar: "bg-ao2", text: "text-ao2" },
  { key: "evaluation", label: "AO3 Evaluation", bar: "bg-ao3", text: "text-ao3" },
] as const;

export function MarkBreakdown({ grading }: { grading: Grading }) {
  const percent = grading.max_mark > 0 ? (grading.total_mark / grading.max_mark) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="panel flex flex-wrap items-center gap-6 p-5">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-semibold tabular-nums">{grading.total_mark}</span>
          <span className="text-xl text-muted-foreground">/{grading.max_mark}</span>
        </div>
        <div className="min-w-40 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{grading.band}</Badge>
            {grading.audited ? (
              <Badge variant="outline" className="gap-1 text-primary">
                <ShieldCheck className="size-3" /> Audited
              </Badge>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {Math.round(grading.confidence * 100)}% examiner confidence
            </span>
          </div>
          <Progress value={percent} className="h-1.5" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {AO_META.map((meta) => {
          const score = grading.ao_breakdown[meta.key];
          const width = score.out_of > 0 ? (score.awarded / score.out_of) * 100 : 0;
          return (
            <div key={meta.key} className="panel p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-muted-foreground">{meta.label}</span>
                <span className={cn("text-sm font-semibold tabular-nums", meta.text)}>
                  {score.awarded}/{score.out_of}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full", meta.bar)} style={{ width: `${width}%` }} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{score.comment}</p>
            </div>
          );
        })}
      </div>

      {grading.examiner_summary ? (
        <div className="panel p-5">
          <h3 className="text-sm font-semibold">Examiner summary</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {grading.examiner_summary}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <PointList title="What worked" items={grading.strengths} tone="good" />
        <PointList title="What cost you marks" items={grading.weaknesses} tone="bad" />
      </div>

      <MissingElements grading={grading} />

      {grading.actionable_feedback.length > 0 ? (
        <div className="panel p-5">
          <h3 className="text-sm font-semibold">How to improve this answer</h3>
          <ol className="mt-3 space-y-2.5">
            {grading.actionable_feedback.map((item, index) => (
              <li key={index} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {grading.suggested_practice.length > 0 ? (
          <div className="panel p-5">
            <h3 className="text-sm font-semibold">Practise next</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {grading.suggested_practice.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {grading.suggested_resources.length > 0 ? (
          <div className="panel p-5">
            <h3 className="text-sm font-semibold">Revise</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {grading.suggested_resources.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {grading.sources.length > 0 ? (
        <div className="panel p-5">
          <h3 className="text-sm font-semibold">Graded against your knowledge base</h3>
          <ul className="mt-3 space-y-2">
            {grading.sources.map((source, index) => (
              <li key={index} className="text-xs text-muted-foreground">
                <span className="font-mono text-primary">[S{index + 1}]</span>{" "}
                <span className="text-foreground">{source.documentTitle}</span>
                {source.heading ? ` — ${source.heading}` : ""}{" "}
                <span className="opacity-60">({Math.round(source.similarity * 100)}% match)</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function PointList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "bad";
}) {
  if (items.length === 0) return null;
  const Icon = tone === "good" ? Check : X;
  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
            <Icon
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                tone === "good" ? "text-success" : "text-destructive",
              )}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MissingElements({ grading }: { grading: Grading }) {
  const groups = [
    { label: "Definitions", items: grading.missing_elements.definitions },
    { label: "Analysis", items: grading.missing_elements.analysis },
    { label: "Evaluation", items: grading.missing_elements.evaluation },
    { label: "Examples", items: grading.missing_elements.examples },
    { label: "Diagrams", items: grading.missing_elements.diagrams },
  ].filter((group) => group.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="panel p-5">
      <h3 className="text-sm font-semibold">Missing from this answer</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-medium text-muted-foreground">{group.label}</p>
            <ul className="mt-1.5 space-y-1 text-sm text-muted-foreground">
              {group.items.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}