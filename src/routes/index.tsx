import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, ShieldCheck, Target } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marginal — Cambridge 9708 Economics essay marking" },
      {
        name: "description",
        content:
          "Mark AS & A Level Economics essays to Cambridge 9708 standards with AO1/AO2/AO3 breakdowns, grounded in your own coursebook, syllabus and mark schemes.",
      },
      { property: "og:title", content: "Marginal — Cambridge 9708 Economics essay marking" },
      {
        property: "og:description",
        content:
          "Examiner-standard marks, assessment-objective breakdowns and rewrite plans for AS & A Level Economics.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  {
    icon: BookOpen,
    title: "Your materials, not a generic model",
    body: "Upload the coursebook, the 9708 syllabus, mark schemes and examiner reports. Every mark is retrieved from and cited back to those documents.",
  },
  {
    icon: Target,
    title: "Calibrated to real marks",
    body: "Teacher-verified anchor essays with confirmed marks are shown to the examiner as exemplars, which keeps the standard where Cambridge sets it.",
  },
  {
    icon: ShieldCheck,
    title: "Independently audited",
    body: "A second pass re-checks the mark without seeing the first, correcting the central-tendency bias that makes AI cluster everything in the middle bands.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-5 py-4 md:px-10">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4.5" />
          </span>
          <span className="font-semibold">Marginal</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="hero-glow px-5 py-20 text-center md:px-10 md:py-28">
        <p className="text-xs font-medium tracking-widest text-primary uppercase">
          Cambridge International 9708
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl leading-tight font-semibold text-balance md:text-6xl">
          Economics essays marked like an examiner marks them
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-pretty text-muted-foreground">
          Paste a past-paper question and your answer. Get a mark, an AO1/AO2/AO3 breakdown, the
          exact elements you left out, and a rewrite plan — grounded in your own coursebook and mark
          schemes.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Start marking</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">For teachers</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-24 md:grid-cols-3 md:px-10">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="panel p-6">
            <feature.icon className="size-5 text-primary" />
            <h2 className="mt-4 text-sm font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border px-5 py-6 text-center text-xs text-muted-foreground md:px-10">
        Marginal is an independent study tool and is not endorsed by Cambridge Assessment
        International Education.
      </footer>
    </div>
  );
}
