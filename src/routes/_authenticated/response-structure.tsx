import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/app/app-shell";
import { STRUCTURE_GUIDANCE, type StructureGuidance } from "@/lib/examiner/config";

export const Route = createFileRoute("/_authenticated/response-structure")({
  head: () => ({
    meta: [
      { title: "How to structure a response — Marginal Economics" },
      {
        name: "description",
        content:
          "A class-taught default structure for 8-mark and 12-mark Cambridge 9708 essay questions.",
      },
    ],
  }),
  component: ResponseStructurePage,
});

function ResponseStructurePage() {
  const guides = Object.values(STRUCTURE_GUIDANCE).sort((a, b) => a.tariff - b.tariff);

  return (
    <>
      <PageHeader
        title="How to structure a response"
        description="A strong default layout for each question type, as taught in class. Not the only valid structure — a different, equally well-argued response is never marked down for using a different layout."
      />

      <div className="grid gap-6 px-5 py-6 md:px-8 lg:grid-cols-2">
        {guides.map((guide) => (
          <StructureCard key={guide.tariff} guide={guide} />
        ))}
      </div>

      <div className="px-5 pb-8 md:px-8">
        <div className="panel space-y-2 p-5">
          <h3 className="text-sm font-semibold">
            A few general principles that apply to any tariff
          </h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            <li>
              Every analytical point should follow a chain: <em>define</em> the term,{" "}
              <em>explain</em> the mechanism,
              <em> analyse</em> the effect, then <em>apply</em> it explicitly to the exact context
              in the question — not a generic textbook explanation.
            </li>
            <li>
              Evaluation earns marks when it is <em>justified</em> — a reason is given for why a
              point is significant, conditional, or contestable — not just an asserted "it depends"
              with nothing behind it.
            </li>
            <li>
              A diagram is never compulsory unless the question explicitly requires one. A complete,
              well-applied chain of reasoning can reach full marks with no diagram at all — but
              where you do use one, make sure the written analysis actually refers back to it.
            </li>
            <li>
              A conclusion should follow logically from your own evaluation. Conditional conclusions
              ("this depends on X, because...") are exactly what Cambridge rewards at the top band —
              you don't need a rigid ranking.
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}

function StructureCard({ guide }: { guide: StructureGuidance }) {
  return (
    <div className="panel space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold">{guide.label}</h2>
        <p className="text-sm text-muted-foreground">{guide.questionType}</p>
        <p className="mt-1 text-xs font-medium text-foreground/80">{guide.aoSummary}</p>
      </div>

      <ol className="space-y-3">
        {guide.steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">{guide.note}</p>
    </div>
  );
}
