/**
 * AO skills coach — teaches essay writing one point at a time.
 *
 * The essay marker judges a whole answer. This coach does the opposite: the
 * student writes ONE point (an AO1 knowledge point, an AO2 analysis chain, or
 * an AO3 evaluation point) and gets told exactly what to change, sentence by
 * sentence, plus a model rewrite built from their own material.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { chat } from "../ai.server";
import { renderContext, retrieve } from "../retrieval.server";
import { MODEL_EXAMINER, TEMPERATURE_EXAMINER, defaultSplitForMaxMark } from "../examiner/config";
import { extractFirstJsonObject } from "../examiner/json";
import type { GroundingSource } from "../examiner/types";

export type AoTarget = "ao1" | "ao2" | "ao3";

export const AO_BRIEF: Record<AoTarget, { label: string; skill: string; rubric: string }> = {
  ao1: {
    label: "AO1 — Knowledge and understanding",
    skill: "a knowledge point",
    rubric: [
      "A credit-worthy AO1 point on Cambridge 9708 must:",
      "1. Define the key term(s) precisely, in syllabus wording, not everyday wording.",
      "2. State the relevant theory/mechanism accurately (correct variables, correct direction).",
      "3. Apply the definition to the context in the question rather than leaving it abstract.",
      "4. Where relevant, name the correct diagram and the axes/curves it uses.",
      "AO1 is NOT rewarded for length, for listing, or for repeating the question.",
    ].join("\n"),
  },
  ao2: {
    label: "AO2 — Analysis",
    skill: "an analysis point",
    rubric: [
      "A credit-worthy AO2 point on Cambridge 9708 must be an explicit causal CHAIN:",
      "1. Start from the stated cause/policy.",
      "2. Give each intervening step in order, with a linking word (so, therefore, which leads to).",
      "3. Use correct economic mechanism at each step (incentives, prices, costs, demand/supply shifts).",
      "4. Land on an outcome that answers the question, in context.",
      "5. Support with the correct diagram movement (which curve shifts, which way, new equilibrium).",
      "Chains that jump from cause straight to outcome ('a tax reduces demand so pollution falls')",
      "are asserted, not analysed, and score low. Missing links are the single most common failure.",
    ].join("\n"),
  },
  ao3: {
    label: "AO3 — Evaluation",
    skill: "an evaluation point",
    rubric: [
      "A credit-worthy AO3 point on Cambridge 9708 must WEIGH, not just add another argument:",
      "1. Make a judgement, not a list of 'on the other hand' statements.",
      "2. Justify it with a criterion: magnitude, elasticity, time period, opportunity cost,",
      "   who gains/loses, the counterfactual, or the quality of the assumption.",
      "3. Show it depends on something specific ('this holds only if demand is price inelastic').",
      "4. Prioritise: say which effect dominates and why.",
      "Phrases like 'however, it may not work' with no criterion score nothing.",
    ].join("\n"),
  },
};

function responseContract(maxMarks: number): string {
  return `
Return ONLY one JSON object with exactly this shape:
{
  "verdict": string,              // one sentence: is this point credit-worthy as written?
  "score": number,                // marks awarded to THIS single point, 0-${maxMarks} (whole or half marks)
  "score_label": string,          // e.g. "Asserted, not analysed"
  "what_works": string[],         // quote the student's own words where possible
  "what_is_missing": string[],    // the specific missing requirement, named
  "fix_list": [                   // EXACT changes, in order of impact
    { "change": string, "why": string, "example": string }
  ],
  "chain": [                      // the logical steps this point should contain,
    { "step": string, "present": boolean }   // marking which the student actually wrote
  ],
  "model_answer": string,         // a rewritten version of THEIR point, same content, exam standard
  "next_drill": string            // one short task to practise the weakest requirement
}
Every item must quote or refer to the student's actual words. Never give generic advice.
"example" must be a usable sentence the student could write, in their context.
`.trim();
}

export type CoachOutcome = {
  verdict: string;
  score: number;
  maxScore: number;
  scoreLabel: string;
  whatWorks: string[];
  whatIsMissing: string[];
  fixList: { change: string; why: string; example: string }[];
  chain: { step: string; present: boolean }[];
  modelAnswer: string;
  nextDrill: string;
  sources: GroundingSource[];
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  latencyMs: number;
};

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
    .filter((item) => item.trim().length > 0);
}

export async function coachPoint(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  options: {
    ao: AoTarget;
    question: string;
    pointText: string;
    useRetrieval?: boolean;
    /** Question tariff the point belongs to (8 or 12 mark). */
    maxMark?: number;
  },
): Promise<CoachOutcome> {
  const brief = AO_BRIEF[options.ao];
  const split = defaultSplitForMaxMark(options.maxMark ?? 12);
  const maxMarks = { ao1: split.ao1_marks, ao2: split.ao2_marks, ao3: split.ao3_marks }[options.ao];


  let sources: GroundingSource[] = [];
  if (options.useRetrieval !== false) {
    try {
      sources = await retrieve(supabase, {
        query: `${options.question}\n${options.pointText}`,
        matchCount: 5,
        docTypes: ["coursebook", "syllabus", "mark_scheme", "examiner_report"],
      });
    } catch (error) {
      console.error("Retrieval failed during coaching", error);
    }
  }

  const systemPrompt = [
    "You are a senior Cambridge International 9708 Economics examiner acting as a one-to-one",
    "writing coach. The student has written a SINGLE point, not a full essay. Coach that one",
    `point against ${brief.label} only. Do not comment on the other assessment objectives.`,
    "",
    brief.rubric,
    "",
    `${brief.label} carries ${maxMarks} marks in this Cambridge ${options.maxMark ?? 12}-mark`,
    `essay (AO1 ${split.ao1_marks}, AO2 ${split.ao2_marks}, AO3 ${split.ao3_marks}). Award this point a mark out of`,
    `${maxMarks} on that tariff — never on a 5-point scale.`,
    "",
    "If the point contains a line like [DIAGRAM: ... | axes: ... | curves: ... | labels: ... | accuracy: ...],",
    "that is a machine description of a diagram the student actually DREW. Treat it as a real drawn",
    "diagram: credit accurate axes, curves, shifts and labels, and how well the written point uses it.",
    "Never say they only described a diagram in words, and never quote the tag back to them.",
    "",

    "Teach: name the requirement that is missing, show the exact wording change, and rewrite",
    "their point at exam standard using THEIR economics — never substitute a different argument.",
    sources.length > 0 ? `\n${renderContext(sources)}` : "",
    "",
    responseContract(maxMarks),
  ].join("\n");

  const userMessage =
    `Exam question or topic:\n${options.question}\n\n` +
    `Student's ${brief.skill}:\n${options.pointText}`;

  const result = await chat({
    model: MODEL_EXAMINER,
    temperature: TEMPERATURE_EXAMINER,
    json: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const raw = extractFirstJsonObject(result.text);
  if (!raw) throw new Error("The coach returned an unreadable response. Please try again.");

  const rawFixes = Array.isArray(raw.fix_list) ? raw.fix_list : [];
  const rawChain = Array.isArray(raw.chain) ? raw.chain : [];
  const score = Number(raw.score);

  return {
    verdict: typeof raw.verdict === "string" ? raw.verdict : "",
    score: Number.isFinite(score)
      ? Math.max(0, Math.min(maxMarks, Math.round(score * 2) / 2))
      : 0,
    maxScore: maxMarks,
    scoreLabel: typeof raw.score_label === "string" ? raw.score_label : "",
    whatWorks: strings(raw.what_works),
    whatIsMissing: strings(raw.what_is_missing),
    fixList: rawFixes
      .map((item) => {
        const fix = (item ?? {}) as Record<string, unknown>;
        return {
          change: typeof fix.change === "string" ? fix.change : "",
          why: typeof fix.why === "string" ? fix.why : "",
          example: typeof fix.example === "string" ? fix.example : "",
        };
      })
      .filter((fix) => fix.change.length > 0),
    chain: rawChain
      .map((item) => {
        const step = (item ?? {}) as Record<string, unknown>;
        return {
          step: typeof step.step === "string" ? step.step : "",
          present: step.present === true,
        };
      })
      .filter((step) => step.step.length > 0),
    modelAnswer: typeof raw.model_answer === "string" ? raw.model_answer : "",
    nextDrill: typeof raw.next_drill === "string" ? raw.next_drill : "",
    sources,
    model: result.model,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    latencyMs: result.latencyMs,
  };
}