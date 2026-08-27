import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/app-shell";
import { MarkBreakdown } from "@/components/app/mark-breakdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getEssayThread, gradeEssaySubmission } from "@/lib/grading.functions";
import type { Grading } from "@/lib/examiner/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/essay/$essayId")({
  head: () => ({
    meta: [
      { title: "Essay report — Marginal Economics" },
      {
        name: "description",
        content:
          "Full examiner report for your Cambridge 9708 Economics essay, with every rewrite tracked against the original mark.",
      },
      { property: "og:title", content: "Essay report — Marginal Economics" },
      {
        property: "og:description",
        content: "Mark, AO breakdown and rewrite history for a single essay.",
      },
    ],
  }),
  component: EssayPage,
});

function EssayPage() {
  const { essayId } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchThread = useServerFn(getEssayThread);
  const grade = useServerFn(gradeEssaySubmission);

  const thread = useQuery({
    queryKey: ["essay", essayId],
    queryFn: () => fetchThread({ data: { essayId } }),
  });

  const versions = thread.data?.versions ?? [];
  const [selected, setSelected] = useState<number | null>(null);
  const [rewrite, setRewrite] = useState("");
  const [rewriting, setRewriting] = useState(false);

  const activeIndex = selected ?? Math.max(versions.length - 1, 0);
  const active = versions[activeIndex];

  useEffect(() => {
    if (active && !rewrite) setRewrite(active.essay_text);
  }, [active, rewrite]);

  const mutation = useMutation({
    mutationFn: () =>
      grade({
        data: {
          question: thread.data!.essay.question,
          essayText: rewrite,
          maxMark: thread.data!.essay.max_mark,
          essayId,
          useAnchors: true,
          auditPass: true,
          useRetrieval: true,
        },
      }),
    onSuccess: (data) => {
      const previous = active?.total_mark ?? 0;
      const gained = data.grading.total_mark - previous;
      toast.success(
        gained > 0
          ? `${data.grading.total_mark}/${data.grading.max_mark} — up ${gained} mark${gained === 1 ? "" : "s"}`
          : `${data.grading.total_mark}/${data.grading.max_mark}`,
      );
      setSelected(null);
      setRewriting(false);
      queryClient.invalidateQueries({ queryKey: ["essay", essayId] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["essays"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (thread.isLoading) {
    return (
      <div className="space-y-3 p-8">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (thread.isError || !thread.data) {
    return (
      <div className="p-8">
        <p className="text-sm text-muted-foreground">That essay could not be loaded.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={thread.data.essay.question}
        description={`${versions.length} attempt${versions.length === 1 ? "" : "s"} · ${thread.data.essay.max_mark} marks available`}
        action={
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">
                <ArrowLeft className="size-4" /> Back
              </Link>
            </Button>
            <Button size="sm" onClick={() => setRewriting((value) => !value)}>
              <RefreshCw className="size-4" /> {rewriting ? "Cancel rewrite" : "Rewrite"}
            </Button>
          </div>
        }
      />

      <div className="space-y-6 px-5 py-6 md:px-8">
        {versions.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {versions.map((version, index) => (
              <button
                key={version.id}
                type="button"
                onClick={() => setSelected(index)}
                className={cn(
                  "rounded-md border border-border px-3 py-1.5 text-xs transition-colors",
                  index === activeIndex
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                Attempt {version.version} · {version.total_mark}/{thread.data.essay.max_mark}
              </button>
            ))}
          </div>
        ) : null}

        {rewriting ? (
          <div className="panel space-y-3 p-5">
            <h2 className="text-sm font-semibold">Rewrite and re-mark</h2>
            <p className="text-xs text-muted-foreground">
              Apply the feedback below, then re-submit. The new mark is saved as another attempt so
              you can see exactly what the changes were worth.
            </p>
            <Textarea
              rows={14}
              className="font-mono text-[13px] leading-relaxed"
              value={rewrite}
              onChange={(event) => setRewrite(event.target.value)}
            />
            <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Re-marking…
                </>
              ) : (
                "Re-mark this version"
              )}
            </Button>
          </div>
        ) : null}

        {active ? <MarkBreakdown grading={active.grading as unknown as Grading} /> : null}

        {active ? (
          <details className="panel p-5">
            <summary className="cursor-pointer text-sm font-semibold">
              Submitted answer (attempt {active.version})
            </summary>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {active.essay_text}
            </p>
          </details>
        ) : null}
      </div>
    </>
  );
}