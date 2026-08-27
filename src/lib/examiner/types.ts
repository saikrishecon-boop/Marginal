export type AoKey = "knowledge" | "analysis" | "evaluation";

export type AoScore = {
  awarded: number;
  out_of: number;
  comment: string;
};

export type MissingElements = {
  definitions: string[];
  analysis: string[];
  evaluation: string[];
  examples: string[];
  diagrams: string[];
};

export type GroundingSource = {
  documentId: string;
  documentTitle: string;
  docType: string;
  heading: string | null;
  snippet: string;
  similarity: number;
};

export type Grading = {
  total_mark: number;
  max_mark: number;
  band: string;
  ao_breakdown: Record<AoKey, AoScore>;
  examiner_summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_elements: MissingElements;
  actionable_feedback: string[];
  suggested_resources: string[];
  suggested_practice: string[];
  confidence: number;
  audited: boolean;
  sources: GroundingSource[];
};

const EMPTY_MISSING: MissingElements = {
  definitions: [],
  analysis: [],
  evaluation: [],
  examples: [],
  diagrams: [],
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
    .filter((item) => item.trim().length > 0);
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback;
}

function normaliseAo(value: unknown, outOf: number): AoScore {
  const raw = (value ?? {}) as Record<string, unknown>;
  const declaredOutOf = toNumber(raw.out_of, outOf);
  return {
    awarded: Math.max(0, Math.min(declaredOutOf, Math.round(toNumber(raw.awarded, 0)))),
    out_of: declaredOutOf,
    comment: typeof raw.comment === "string" ? raw.comment : "",
  };
}

/**
 * Coerce raw model JSON into a Grading. Enforces the fixed AO allocation:
 * the model is never allowed to redistribute marks or invent an `out_of`.
 */
export function normaliseGrading(
  raw: Record<string, unknown>,
  maxMark: number,
  split: { ao1_marks: number; ao2_marks: number; ao3_marks: number },
): Grading {
  const rawAo = (raw.ao_breakdown ?? {}) as Record<string, unknown>;

  const knowledge = normaliseAo(rawAo.knowledge ?? rawAo.ao1, split.ao1_marks);
  const analysis = normaliseAo(rawAo.analysis ?? rawAo.ao2, split.ao2_marks);
  const evaluation = normaliseAo(rawAo.evaluation ?? rawAo.ao3, split.ao3_marks);

  // The mark scheme owns the allocation, not the model.
  knowledge.out_of = split.ao1_marks;
  analysis.out_of = split.ao2_marks;
  evaluation.out_of = split.ao3_marks;
  knowledge.awarded = Math.min(knowledge.awarded, split.ao1_marks);
  analysis.awarded = Math.min(analysis.awarded, split.ao2_marks);
  evaluation.awarded = Math.min(evaluation.awarded, split.ao3_marks);

  const aoTotal = knowledge.awarded + analysis.awarded + evaluation.awarded;
  const declaredTotal = Math.round(toNumber(raw.total_mark, aoTotal));
  // The AO marks are the source of truth; a stated total that disagrees is a
  // model arithmetic slip, not a separate judgement.
  const total = Math.max(0, Math.min(maxMark, aoTotal || declaredTotal));

  const rawMissing = (raw.missing_elements ?? {}) as Record<string, unknown>;

  return {
    total_mark: total,
    max_mark: maxMark,
    band: typeof raw.band === "string" ? raw.band : bandFor(total, maxMark),
    ao_breakdown: { knowledge, analysis, evaluation },
    examiner_summary: typeof raw.examiner_summary === "string" ? raw.examiner_summary : "",
    strengths: toStringArray(raw.strengths),
    weaknesses: toStringArray(raw.weaknesses),
    missing_elements: {
      ...EMPTY_MISSING,
      definitions: toStringArray(rawMissing.definitions),
      analysis: toStringArray(rawMissing.analysis),
      evaluation: toStringArray(rawMissing.evaluation),
      examples: toStringArray(rawMissing.examples),
      diagrams: toStringArray(rawMissing.diagrams),
    },
    actionable_feedback: toStringArray(raw.actionable_feedback),
    suggested_resources: toStringArray(raw.suggested_resources),
    suggested_practice: toStringArray(raw.suggested_practice),
    confidence: Math.max(0, Math.min(1, toNumber(raw.confidence, 0.7))),
    audited: false,
    sources: [],
  };
}

export function bandFor(total: number, maxMark: number): string {
  const ratio = maxMark > 0 ? total / maxMark : 0;
  if (ratio >= 0.8) return "Top band";
  if (ratio >= 0.55) return "Upper middle band";
  if (ratio >= 0.35) return "Lower middle band";
  return "Bottom band";
}