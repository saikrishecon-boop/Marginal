import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, BookOpen, PenLine, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listMyEssays, getProgress } from "@/lib/grading.functions";
import { listDocuments } from "@/lib/knowledge.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Marginal Economics" },
      {
        name: "description",
        content:
          "Track your Cambridge 9708 Economics essay marks, AO breakdown and knowledge base coverage in one place.",
      },
      { property: "og:title", content: "Dashboard — Marginal Economics" },
      {
        property: "og:description",
        content: "Your marks, assessment-objective trends and graded essay history.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const fetchProgress = useServerFn(getProgress);
  const fetchEssays = useServerFn(listMyEssays);
  const fetchDocs = useServerFn(listDocuments);

  const progress = useQuery({ queryKey: ["progress"], queryFn: () => fetchProgress() });
  const essays = useQuery({ queryKey: ["essays"], queryFn: () => fetchEssays() });
  const docs = useQuery({ queryKey: ["documents"], queryFn: () => fetchDocs() });

  const versions = progress.data ?? [];
  const marks = versions.map((v) => v.total_mark ?? 0);
  const average = marks.length ? marks.reduce((a, b) => a + b, 0) / marks.length : 0;
  const best = marks.length ? Math.max(...marks) : 0;
  const recent = marks.slice(-5);
  const earlier = marks.slice(0, -5);
  const delta =
    recent.length && earlier.length
      ? recent.reduce((a, b) => a + b, 0) / recent.length -
        earlier.reduce((a, b) => a + b, 0) / earlier.length
      : 0;

  const aoAverage = (key: "ao1_awarded" | "ao2_awarded" | "ao3_awarded") => {
    const values = versions.map((v) => v[key] ?? 0);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };

  const readyDocs = (docs.data ?? []).filter((d) => d.status === "ready").length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Everything you've submitted, marked against Cambridge 9708 standards."
        action={
          <Button asChild>
            <Link to="/grade">
              <PenLine className="size-4" /> Mark an essay
            </Link>
          </Button>
        }
      />

      <div className="space-y-6 px-5 py-6 md:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Essays marked"
            value={String(versions.length)}
            hint={`${essays.data?.length ?? 0} essay threads`}
            loading={progress.isLoading}
          />
          <Stat
            label="Average mark"
            value={versions.length ? average.toFixed(1) : "—"}
            hint={
              delta !== 0
                ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)} vs earlier attempts`
                : "Submit more to see a trend"
            }
            loading={progress.isLoading}
          />
          <Stat
            label="Best mark"
            value={versions.length ? String(best) : "—"}
            hint="Highest single attempt"
            loading={progress.isLoading}
          />
          <Stat
            label="Knowledge base"
            value={String(readyDocs)}
            hint="Documents ready for grounding"
            loading={docs.isLoading}
          />
        </div>

        {versions.length > 0 ? (
          <div className="panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-primary" /> Assessment objective averages
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <AoBar label="AO1 Knowledge" value={aoAverage("ao1_awarded")} tone="bg-ao1" />
              <AoBar label="AO2 Analysis" value={aoAverage("ao2_awarded")} tone="bg-ao2" />
              <AoBar label="AO3 Evaluation" value={aoAverage("ao3_awarded")} tone="bg-ao3" />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Evaluation is where most 9708 candidates lose marks — a weak AO3 average usually means
              judgements are asserted rather than justified.
            </p>
          </div>
        ) : null}

        <div className="panel">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-semibold">Recent essays</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/knowledge">
                <BookOpen className="size-4" /> Knowledge base
              </Link>
            </Button>
          </div>

          {essays.isLoading ? (
            <div className="space-y-2 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (essays.data?.length ?? 0) === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No essays yet. Paste a past-paper question and your answer to get a mark with a full
                AO breakdown.
              </p>
              <Button asChild className="mt-4">
                <Link to="/grade">Mark your first essay</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {essays.data?.map((essay) => (
                <li key={essay.id}>
                  <Link
                    to="/essay/$essayId"
                    params={{ essayId: essay.id }}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{essay.question}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(essay.updated_at).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {essay.latest_mark ?? "—"}
                      <span className="text-muted-foreground">/{essay.max_mark}</span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  hint,
  loading,
}: {
  label: string;
  value: string;
  hint: string;
  loading: boolean;
}) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-16" />
      ) : (
        <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function AoBar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value.toFixed(1)}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={tone + " h-full rounded-full"} style={{ width: `${Math.min(value * 16, 100)}%` }} />
      </div>
    </div>
  );
}