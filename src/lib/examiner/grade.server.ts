/**
 * Examiner engine — ported from the original Python `agents/examiner.py`.
 *
 * Preserved exactly:
 *  - the fixed AO1/AO2/AO3 allocation, validated against max_mark (never
 *    silently redistributed into equal thirds)
 *  - human-verified calibration anchors injected as few-shot ground truth,
 *    grouped by band and capped per band
 *  - two-pass grading: examiner pass, then an independent audit pass that can
 *    correct the mark in EITHER direction, falling back to the unaudited
 *    result if the audit call fails rather than blocking grading
 *
 * Added: retrieval grounding, so marking references the real syllabus and
 * mark scheme material rather than the model's recollection of it.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { chat } from "../ai.server";
import { renderContext, retrieve } from "../retrieval.server";
import { AUDIT_PROMPT } from "./audit-prompt";
import {
  formatStructureNote,
  getStructureGuidance,
  MAX_ANCHORS_PER_BAND,
  MODEL_EXAMINER,
  TEMPERATURE_EXAMINER,
  type AoSplit,
} from "./config";
import { EXAMINER_PROMPT } from "./examiner-prompt";
import { extractFirstJsonObject } from "./json";
import { normaliseGrading, type Grading, type GroundingSource } from "./types";

type Anchor = {
  question: string;
  essay_text: string;
  mark: number;
  max_mark: number;
  band_label: string;
  notes: string | null;
};

/** Fill `{placeholder}` tokens in the ported prompt templates. */
function loadPrompt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

const RESPONSE_CONTRACT = `
Return ONLY a single JSON object with exactly this shape:
{
  "total_mark": number,
  "band": string,
  "ao_breakdown": {
    "knowledge":  { "awarded": number, "out_of": number, "comment": string },
    "analysis":   { "awarded": number, "out_of": number, "comment": string },
    "evaluation": { "awarded": number, "out_of": number, "comment": string }
  },
  "examiner_summary": string,
  "strengths": string[],
  "weaknesses": string[],
  "missing_elements": {
    "definitions": string[],
    "analysis": string[],
    "evaluation": string[],
    "examples": string[],
    "diagrams": string[]
  },
  "actionable_feedback": string[],
  "suggested_resources": string[],
  "suggested_practice": string[],
  "confidence": number
}
"confidence" is your own 0-1 confidence that a real Cambridge examiner would
award the same total mark. "suggested_practice" must be concrete next tasks
(e.g. "write a 4-mark evaluation paragraph on subsidy incidence in this market").
Keep every comment specific to this essay's actual text — never generic advice.
`.trim();

/**
 * Build a few-shot calibration section from human-provided anchor essays,
 * grouped by band and capped so the prompt does not grow unbounded.
 */
function buildAnchorBlock(anchors: Anchor[]): string {
  if (anchors.length === 0) return "";

  const byBand = new Map<string, Anchor[]>();
  for (const anchor of anchors) {
    const band = anchor.band_label || "top";
    byBand.set(band, [...(byBand.get(band) ?? []), anchor]);
  }

  const sections: string[] = [
    "REAL CALIBRATION EXAMPLES — provided by a human expert, with a mark they " +
      "have confirmed is correct. Treat these as ground truth for your scoring " +
      "scale: if a new essay is of similar quality to one of these, it should " +
      "receive a similar mark, even at the top or bottom of the range.",
  ];

  for (const [band, bandAnchors] of byBand) {
    const label =
      band === "top" ? "TOP-BAND" : band === "bottom" ? "BOTTOM-BAND" : band.toUpperCase();
    for (const anchor of bandAnchors.slice(0, MAX_ANCHORS_PER_BAND)) {
      sections.push(
        `\n--- ${label} EXAMPLE ---\n` +
          `Question: ${anchor.question}\n` +
          `Confirmed mark: ${anchor.mark}/${anchor.max_mark}\n` +
          `Why it deserves this mark: ${anchor.notes ?? "(no additional notes provided)"}\n` +
          `Essay:\n${anchor.essay_text}\n` +
          `--- END EXAMPLE ---`,
      );
    }
  }

  return sections.join("\n");
}

export type GradeOptions = {
  question: string;
  essayText: string;
  maxMark: number;
  split: AoSplit;
  useAnchors?: boolean;
  auditPass?: boolean;
  useRetrieval?: boolean;
  topicId?: string | null;
};

export type GradeOutcome = {
  grading: Grading;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  latencyMs: number;
};

export async function gradeEssay(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  options: GradeOptions,
): Promise<GradeOutcome> {
  const { question, essayText, maxMark, split } = options;
  const { ao1_marks, ao2_marks, ao3_marks } = split;

  if (ao1_marks + ao2_marks + ao3_marks !== maxMark) {
    throw new Error(
      `The AO split (${ao1_marks}+${ao2_marks}+${ao3_marks}) does not sum to the ` +
        `total mark (${maxMark}). Set a matching split for questions that are not ` +
        `the standard 12-mark type.`,
    );
  }

  const structureNote = formatStructureNote(getStructureGuidance(maxMark, split));

  const promptValues = {
    syllabus_code: "9708",
    max_mark: maxMark,
    ao1_marks,
    ao2_marks,
    ao3_marks,
    structure_note: structureNote,
  };

  let systemPrompt = loadPrompt(EXAMINER_PROMPT, promptValues);

  // --- retrieval grounding -------------------------------------------------
  let sources: GroundingSource[] = [];
  if (options.useRetrieval !== false) {
    try {
      sources = await retrieve(supabase, {
        query: `${question}\n\nMark scheme, band descriptors and examiner report guidance for this question.`,
        matchCount: 6,
        docTypes: ["mark_scheme", "examiner_report", "syllabus", "coursebook"],
        topicId: options.topicId ?? null,
      });
    } catch (error) {
      // Grounding is an enhancement; a retrieval outage must not block marking.
      console.error("Retrieval failed during grading", error);
    }
  }
  if (sources.length > 0) {
    systemPrompt = `${systemPrompt}\n\n${renderContext(sources)}`;
  }

  // --- calibration anchors -------------------------------------------------
  if (options.useAnchors !== false) {
    const { data } = await supabase
      .from("calibration_anchors")
      .select("question, essay_text, mark, max_mark, band_label, notes")
      .eq("active", true)
      .order("created_at", { ascending: true });

    const anchorBlock = buildAnchorBlock((data ?? []) as Anchor[]);
    if (anchorBlock) systemPrompt = `${systemPrompt}\n\n${anchorBlock}`;
  }

  systemPrompt = `${systemPrompt}\n\n${RESPONSE_CONTRACT}`;

  const userMessage =
    `Exam question (${maxMark} marks):\n\n${question}\n\n` +
    `Student essay to mark:\n\n${essayText}`;

  const first = await chat({
    model: MODEL_EXAMINER,
    temperature: TEMPERATURE_EXAMINER,
    json: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  let grading = normaliseGrading(extractFirstJsonObject(first.text), maxMark, split);
  let promptTokens = first.promptTokens;
  let completionTokens = first.completionTokens;
  let latencyMs = first.latencyMs;

  // --- audit pass ----------------------------------------------------------
  if (options.auditPass !== false) {
    const auditSystemPrompt = `${loadPrompt(AUDIT_PROMPT, promptValues)}\n\n${RESPONSE_CONTRACT}`;
    const auditUserMessage =
      `Exam question (${maxMark} marks):\n\n${question}\n\n` +
      `Student essay:\n\n${essayText}\n\n` +
      `Original examiner's grading JSON to audit:\n\n${JSON.stringify(grading, null, 2)}`;

    try {
      const second = await chat({
        model: MODEL_EXAMINER,
        temperature: TEMPERATURE_EXAMINER,
        json: true,
        messages: [
          { role: "system", content: auditSystemPrompt },
          { role: "user", content: auditUserMessage },
        ],
      });

      grading = normaliseGrading(extractFirstJsonObject(second.text), maxMark, split);
      grading.audited = true;
      promptTokens = (promptTokens ?? 0) + (second.promptTokens ?? 0);
      completionTokens = (completionTokens ?? 0) + (second.completionTokens ?? 0);
      latencyMs += second.latencyMs;
    } catch (error) {
      // The audit is a correction pass, not a gate. A transient audit failure
      // returns the already-valid first-pass result instead of failing.
      console.error("Audit pass failed; returning unaudited grading", error);
    }
  }

  grading.sources = sources;

  return {
    grading,
    model: MODEL_EXAMINER,
    promptTokens,
    completionTokens,
    latencyMs,
  };
}
