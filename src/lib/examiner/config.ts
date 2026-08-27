// Ported from the original Python `config.py`. Central tunables so no agent
// or route hardcodes marking values.

export const SYLLABUS_CODE = "9708";

export const DEFAULT_MAX_MARK = 12;

/** Standard 12-mark evaluative essay split for syllabus 9708. NOT an even third. */
export const DEFAULT_AO_SPLIT = {
  ao1_marks: 2, // Knowledge and understanding
  ao2_marks: 6, // Analysis
  ao3_marks: 4, // Evaluation
} as const;

export type AoSplit = { ao1_marks: number; ao2_marks: number; ao3_marks: number };

/**
 * Marks available for a single point when coached in isolation. Cambridge
 * weights an evaluative essay 2 knowledge : 6 analysis : 4 evaluation, so the
 * AO skills coach scores out of those same tariffs, never out of 5.
 */
export const AO_MAX_MARKS = { ao1: 2, ao2: 6, ao3: 4 } as const;

/** Near-zero variance: consistent, reliable grading. */
export const TEMPERATURE_EXAMINER = 0;
export const TEMPERATURE_TUTOR = 0.4;

export const MAX_ANCHORS_PER_BAND = 2;

/**
 * Marking runs two sequential passes (examiner + independent audit), so the
 * examiner model is chosen for latency as well as judgement — the original
 * Gemini Pro pipeline pushed a single submission past a minute.
 */
export const MODEL_EXAMINER = "openai/gpt-5.6-sol";
export const MODEL_FAST = "openai/gpt-5.6-sol";
/**
 * Only used as the model name for the last-resort Lovable-gateway embedding
 * path in ai.server.ts — the direct OpenRouter/Google paths pick their own
 * model constants internally so they can be swapped independently.
 */
export const MODEL_EMBEDDING = "google/gemini-embedding-2";

/**
 * Nemotron 3 Embed 1B (OpenRouter, free) is fixed at 2048 dims, so this is
 * also what Google is asked to truncate to when it's used as a fallback —
 * keeps document_chunks.embedding a single comparable size regardless of
 * which provider actually produced a given chunk's vector.
 */
export const EMBEDDING_DIMS = 2048;

/**
 * Exact Cambridge 9708 AO splits per question tariff. These are authoritative
 * and must not be derived from a ratio.
 */
export const TARIFF_SPLITS: Record<number, AoSplit> = {
  8: { ao1_marks: 2, ao2_marks: 4, ao3_marks: 2 },
  12: { ao1_marks: 2, ao2_marks: 6, ao3_marks: 4 },
};

/** AO split by question tariff: exact for 8 and 12, proportional otherwise. */
export function defaultSplitForMaxMark(maxMark: number): AoSplit {
  const exact = TARIFF_SPLITS[maxMark];
  if (exact) return { ...exact };

  // Keep the 2:6:4 weighting and make the parts sum exactly to the tariff.
  const ao1 = Math.max(1, Math.round(maxMark * (2 / 12)));
  const ao2 = Math.max(1, Math.round(maxMark * (6 / 12)));
  const ao3 = maxMark - ao1 - ao2;
  if (ao3 >= 1) return { ao1_marks: ao1, ao2_marks: ao2, ao3_marks: ao3 };
  // Very small tariffs: protect evaluation before analysis.
  return { ao1_marks: ao1, ao2_marks: Math.max(1, maxMark - ao1 - 1), ao3_marks: 1 };
}

/** Per-AO mark ceiling for a given tariff, used by the AO skills coach. */
export function aoMaxMarks(maxMark: number): { ao1: number; ao2: number; ao3: number } {
  const split = defaultSplitForMaxMark(maxMark);
  return { ao1: split.ao1_marks, ao2: split.ao2_marks, ao3: split.ao3_marks };
}

/**
 * The 8-mark AO3 allocation (2 marks) is not a single undifferentiated
 * "evaluation" bucket in how a Cambridge 9708 script is actually written:
 * candidates are expected to produce one justified evaluative point AND a
 * short overall judgement/conclusion. Both live inside the same 2-mark AO3
 * total — this is a reporting/coaching split, not a change to the fixed
 * split above, and the examiner may still award the 2 marks holistically.
 */
export const AO3_SUBSPLIT_8_MARK = {
  evaluation_marks: 1,
  conclusion_marks: 1,
} as const;

export type StructureStep = { title: string; detail: string };

export type StructureGuidance = {
  tariff: number;
  label: string;
  questionType: string;
  aoSummary: string;
  steps: StructureStep[];
  note: string;
};

/**
 * "How to structure a response" reference content, matching the approach
 * taught in class. These are a sensible default shape, not a rigid template
 * the examiner enforces — the marking prompt is explicitly told a different,
 * equally well-argued structure must never be penalised.
 */
export const STRUCTURE_GUIDANCE: Record<number, StructureGuidance> = {
  8: {
    tariff: 8,
    label: "8-mark question",
    questionType:
      "A normal 8-mark question (not a data-response sub-question) — a short, tightly-focused essay.",
    aoSummary: "AO1 Knowledge: 2 marks · AO2 Analysis: 4 marks · AO3 Evaluation: 2 marks",
    steps: [
      {
        title: "Knowledge (2 marks)",
        detail:
          "Define the key term(s) in the question accurately and set up the economic concept you'll use to answer it.",
      },
      {
        title: "Analysis (4 marks)",
        detail:
          "Build one or two clear chains of reasoning: define -> explain the mechanism -> analyse the effect -> apply to the context in the question. Depth matters more than the number of points at this tariff.",
      },
      {
        title: "Evaluation (1 of the 2 AO3 marks)",
        detail:
          "Make one genuinely justified evaluative point — a reason why the analysis might not hold, or a factor that determines whether it holds (e.g. elasticity, time period, market structure).",
      },
      {
        title: "Conclusion (the other 1 of the 2 AO3 marks)",
        detail:
          "Close with a brief, direct overall judgement that follows from the evaluation above — it can be short, but it must be a real answer to the question, not a restatement of it.",
      },
    ],
    note: "This 2/4/1/1 shape is a strong default for an 8-mark question, not a rigid rule — a well-argued response structured differently is never marked down for that reason alone.",
  },
  12: {
    tariff: 12,
    label: "12-mark question",
    questionType: 'A standard 12-mark evaluative essay ("discuss"/"assess"/"to what extent").',
    aoSummary: "AO1 Knowledge: 2 marks · AO2 Analysis: 6 marks · AO3 Evaluation: 4 marks",
    steps: [
      {
        title: "Knowledge (2 marks)",
        detail:
          "Open with two clear knowledge points — accurate definitions/concepts the essay will build its analysis from.",
      },
      {
        title: "Analysis — three points (6 marks)",
        detail:
          "Write three separate analytical points, each following define -> explain -> analyse -> apply to the specific context in the question. Roughly 2 marks of depth per point.",
      },
      {
        title: "Evaluate each analysis point (part of the 4 AO3 marks)",
        detail:
          "Immediately after each analysis point, evaluate it — is it significant, does it depend on a condition (elasticity, time frame, size of the effect), is there a counter-argument? Evaluating alongside each point (rather than only at the end) usually produces stronger, better-linked evaluation.",
      },
      {
        title: "Conclusion paragraph (remainder of the 4 AO3 marks)",
        detail:
          'Finish with a conclusion paragraph that weighs the evaluative points against each other and reaches a reasoned, ideally conditional, overall judgement (e.g. "this depends on X, because..."). A conclusion that just repeats the introduction earns little here.',
      },
    ],
    note: "This 2 knowledge points -> 3 analysis points (each evaluated) -> conclusion shape is how this is taught in class. It is a strong, reliable default — not the only valid structure — and the examiner is told never to penalise a different structure that is equally well-argued.",
  },
};

/**
 * Single source of truth for "how a response should be structured" across
 * every tool (grading's structure note, the essay generator's section plan,
 * the response-structure reference page). STRUCTURE_GUIDANCE only has exact,
 * hand-written entries for 8 and 12 — the two tariffs actually taught this
 * way in class — so this synthesises an equivalent shape for any other
 * tariff (20/25-mark extended essays) from the same AO split, rather than
 * letting a caller invent its own structure independently.
 */
export function getStructureGuidance(maxMark: number, split?: AoSplit): StructureGuidance {
  const exact = STRUCTURE_GUIDANCE[maxMark];
  if (exact) return exact;

  const { ao1_marks, ao2_marks, ao3_marks } = split ?? defaultSplitForMaxMark(maxMark);

  return {
    tariff: maxMark,
    label: `${maxMark}-mark question`,
    questionType: `An extended Cambridge 9708 evaluative essay worth ${maxMark} marks.`,
    aoSummary: `AO1 Knowledge: ${ao1_marks} marks · AO2 Analysis: ${ao2_marks} marks · AO3 Evaluation: ${ao3_marks} marks`,
    steps: [
      {
        title: `Knowledge (${ao1_marks} marks)`,
        detail:
          "Open by defining the key term(s) in the question accurately and setting up the economic concept(s) the essay will build its analysis from.",
      },
      {
        title: `Analysis (${ao2_marks} marks)`,
        detail:
          "Build separate, clearly signposted chains of reasoning: define -> explain the mechanism -> analyse the effect -> apply to the exact context in the question. Roughly 2 marks of depth per point.",
      },
      {
        title: `Evaluate each analysis point (part of the ${ao3_marks} AO3 marks)`,
        detail:
          "Evaluate each analytical point as you make it — is it significant, does it depend on a condition (elasticity, time frame, market structure), is there a counter-argument? — rather than leaving all evaluation to the end.",
      },
      {
        title: `Conclusion (remainder of the ${ao3_marks} AO3 marks)`,
        detail:
          "Close with a reasoned, ideally conditional, overall judgement that directly answers the question and weighs the evaluative points against each other. A conclusion that just repeats the introduction earns little here.",
      },
    ],
    note: `This ${ao1_marks}/${ao2_marks}/${ao3_marks} shape is a strong default for a ${maxMark}-mark question, not a rigid rule — a well-argued response structured differently is never marked down for that reason alone.`,
  };
}

/**
 * Renders a StructureGuidance as the numbered plain-text note used in the
 * examiner's marking prompt. Kept here (rather than duplicated per caller)
 * so the essay generator and the grader describe the exact same structure
 * in the exact same words.
 */
export function formatStructureNote(structure: StructureGuidance): string {
  return (
    `For a ${structure.label} (${structure.questionType}), a strong default shape taught to candidates is:\n` +
    structure.steps.map((step, index) => `${index + 1}. ${step.title} — ${step.detail}`).join("\n")
  );
}
