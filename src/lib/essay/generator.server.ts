/**
 * Perfect Cambridge essay generator — produces a model answer in the exact
 * structure an examiner rewards, grounded in the project knowledge base, with
 * the correct diagrams selected from the diagram library and an AO breakdown.
 *
 * The section plan is NOT hardcoded here: it's generated directly from
 * getStructureGuidance() in examiner/config.ts, the same structure used on
 * the "How to structure a response" reference page and referenced by the
 * grader's marking prompt. That keeps a single definition of "how a 9708
 * response should be structured" shared across every tool, rather than the
 * essay generator teaching a different shape (e.g. a standalone "Application"
 * section) from what's actually taught and graded against.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { chat } from "../ai.server";
import { DIAGRAM_IDS, DIAGRAM_INDEX_FOR_AI } from "../diagrams/catalog";
import {
  defaultSplitForMaxMark,
  getStructureGuidance,
  MODEL_EXAMINER,
  type StructureStep,
} from "../examiner/config";
import { extractFirstJsonObject } from "../examiner/json";
import { renderContext, retrieve } from "../retrieval.server";

export type EssaySection = {
  heading: string;
  detail: string;
  paragraphs: string[];
  diagramIds: string[];
};

/** Hard cap on the model answer's total length, matching real exam-script standard. */
export const ESSAY_WORD_LIMIT = 650;

export type GeneratedEssay = {
  level: "as" | "a2";
  topic: string;
  question: string;
  maxMark: number;
  sections: EssaySection[];
  diagramIds: string[];
  wordCount: number;
  wordLimit: number;
  trimmedToFit: boolean;
  estimatedMark: number;
  ao: { ao1: number; ao2: number; ao3: number };
  aoMax: { ao1: number; ao2: number; ao3: number };
  examinerComments: string[];
  markSchemeNotes: string[];
  keyTerms: { term: string; definition: string }[];
};

const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

/** Splits a paragraph into whole sentences so a trim never cuts mid-thought. */
function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
  if (matches && matches.length > 0) return matches.map((s) => s.trim()).filter(Boolean);
  return text.trim() ? [text.trim()] : [];
}

/**
 * Safety net behind the word-limit instruction in the prompt: the model is
 * asked to stay under `maxWords`, but if it overshoots anyway, this trims
 * whole trailing sentences (never a partial sentence) until the essay fits,
 * working from the end of the essay backwards. Keeps AS/A2 model answers at
 * genuine exam-script length regardless of what the model returns.
 */
function trimToWordLimit(
  sections: EssaySection[],
  maxWords: number,
): { sections: EssaySection[]; wordCount: number; trimmed: boolean } {
  type Chunk = { sectionIndex: number; paragraphIndex: number; sentence: string; words: number };
  const chunks: Chunk[] = [];
  sections.forEach((section, sectionIndex) => {
    section.paragraphs.forEach((paragraph, paragraphIndex) => {
      splitSentences(paragraph).forEach((sentence) => {
        chunks.push({ sectionIndex, paragraphIndex, sentence, words: countWords(sentence) });
      });
    });
  });

  const totalWords = chunks.reduce((sum, chunk) => sum + chunk.words, 0);
  if (totalWords <= maxWords) {
    return { sections, wordCount: totalWords, trimmed: false };
  }

  let running = 0;
  const paraMap = new Map<string, string[]>();
  for (const chunk of chunks) {
    if (running + chunk.words > maxWords) break;
    const key = `${chunk.sectionIndex}:${chunk.paragraphIndex}`;
    if (!paraMap.has(key)) paraMap.set(key, []);
    paraMap.get(key)!.push(chunk.sentence);
    running += chunk.words;
  }

  const rebuilt: EssaySection[] = sections
    .map((section, sectionIndex) => ({
      ...section,
      paragraphs: section.paragraphs
        .map((_paragraph, paragraphIndex) => paraMap.get(`${sectionIndex}:${paragraphIndex}`))
        .filter((sentences): sentences is string[] => Boolean(sentences && sentences.length > 0))
        .map((sentences) => sentences.join(" ").trim()),
    }))
    .filter((section) => section.paragraphs.length > 0);

  return { sections: rebuilt, wordCount: running, trimmed: true };
}

function buildContract(steps: StructureStep[]): string {
  const sectionShape = steps
    .map(
      (_step, index) =>
        `    { "paragraphs": [string], "diagram_ids": [string] }${index < steps.length - 1 ? "," : ""}`,
    )
    .join("\n");

  return `
Return ONLY one JSON object with this shape:
{
  "sections": [
${sectionShape}
  ],
  "estimated_mark": number,
  "ao": { "ao1": number, "ao2": number, "ao3": number },
  "examiner_comments": [string],
  "mark_scheme_notes": [string],
  "key_terms": [{ "term": string, "definition": string }]
}
"sections" must have exactly ${steps.length} entries, in this exact order:
${steps.map((step, index) => `${index + 1}. ${step.title}`).join("\n")}
`.trim();
}

export async function generatePerfectEssay(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  input: { level: "as" | "a2"; topic: string; question: string; maxMark: number },
) {
  const split = defaultSplitForMaxMark(input.maxMark);
  const structure = getStructureGuidance(input.maxMark, split);

  let sources: Awaited<ReturnType<typeof retrieve>> = [];
  try {
    sources = await retrieve(supabase, {
      query: `${input.question} ${input.topic} — definitions, mechanisms, diagrams and evaluation`,
      matchCount: 10,
      docTypes: ["coursebook", "syllabus", "past_paper", "mark_scheme"],
    });
  } catch (error) {
    console.error("Essay generator retrieval failed", error);
  }

  const structurePlan = structure.steps
    .map((step, index) => `${index + 1}. ${step.title} — ${step.detail}`)
    .join("\n");

  const systemPrompt = [
    "You are a Cambridge International 9708 Economics principal examiner writing a full-mark model answer",
    input.level === "a2" ? "at A Level standard." : "at AS Level standard.",
    "",
    `The question is worth ${input.maxMark} marks with the fixed allocation AO1 = ${split.ao1_marks}, AO2 = ${split.ao2_marks}, AO3 = ${split.ao3_marks}.`,
    "",
    `Write the essay in EXACTLY this structure — the same structure taught to candidates and used to mark them,` +
      ` not a different shape of your own choosing:`,
    structurePlan,
    "",
    "House rules for the model answer:",
    "- Write in continuous examiner prose. No bullet lists inside paragraphs, no markdown, no headings inside the text.",
    "- Knowledge: accurate syllabus definitions and theory, using Cambridge wording.",
    "- Analysis: explicit causal chains — cause, therefore, therefore, outcome — following define -> explain -> analyse -> apply",
    "  to the exact context in the question within each point (application is part of the analysis chain, not a separate",
    "  section), and describe the diagram movement in words (which curve shifts, in which direction, and what happens to",
    "  price/quantity or the price level/output).",
    "- Evaluation: judgement supported by criteria — magnitude, elasticity, time period, counterfactual, assumptions,",
    "  distributional effects — placed immediately after the point it evaluates wherever the structure above calls for that.",
    "  Never an unweighted list of 'on the other hand' points.",
    "- Conclusion: an explicit supported judgement that answers the exact question asked, with the decisive criterion.",
    "",
    `Length: the WHOLE essay across every section must be no more than ${ESSAY_WORD_LIMIT} words in total —`,
    "this is genuine exam-script length, not a rough guide, so write concisely and never pad for length.",
    "Prioritise the marks: keep knowledge concise, spend the words on analysis chains and evaluation judgement.",
    "",
    "Diagrams: choose from the library below and put the diagram id(s) in the diagram_ids of the section where they belong.",
    "Only ever use ids from this list, and only where a diagram genuinely earns marks (usually analysis, sometimes evaluation).",
    "Reference the diagram in the prose ('as the diagram shows, supply shifts right from S1 to S2') so the text and figure match.",
    "",
    "AVAILABLE DIAGRAMS:",
    DIAGRAM_INDEX_FOR_AI,
    "",
    sources.length > 0
      ? `Use the taught course material below for definitions, wording and examples:\n${renderContext(sources)}`
      : "",
    "",
    `estimated_mark must be out of ${input.maxMark}, and ao.ao1/ao2/ao3 must not exceed ${split.ao1_marks}/${split.ao2_marks}/${split.ao3_marks}.`,
    "examiner_comments explain, in examiner voice, why this answer reaches the top band.",
    "mark_scheme_notes list the specific points a mark scheme would credit.",
    "",
    buildContract(structure.steps),
  ]
    .filter(Boolean)
    .join("\n");

  const userMessage = [
    `Level: ${input.level === "a2" ? "A Level" : "AS Level"}`,
    `Topic: ${input.topic}`,
    `Marks: ${input.maxMark}`,
    `Question: ${input.question}`,
  ].join("\n");

  const result = await chat({
    model: MODEL_EXAMINER,
    temperature: 0.3,
    json: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const raw = extractFirstJsonObject(result.text) ?? {};
  const rawSections = Array.isArray(raw.sections) ? (raw.sections as unknown[]) : [];

  const sections: EssaySection[] = structure.steps
    .map((step, index) => {
      const node = (rawSections[index] ?? {}) as Record<string, unknown>;
      const paragraphs = Array.isArray(node.paragraphs)
        ? node.paragraphs.map((p) => String(p).trim()).filter((p) => p.length > 0)
        : [];
      const diagramIds = Array.isArray(node.diagram_ids)
        ? node.diagram_ids.map((id) => String(id).trim()).filter((id) => DIAGRAM_IDS.includes(id))
        : [];
      return { heading: step.title, detail: step.detail, paragraphs, diagramIds };
    })
    .filter((section) => section.paragraphs.length > 0);

  const rawAo = (raw.ao ?? {}) as Record<string, unknown>;
  const clamp = (value: unknown, max: number) =>
    Math.max(0, Math.min(max, Math.round(Number(value) || 0)));

  const ao = {
    ao1: clamp(rawAo.ao1, split.ao1_marks),
    ao2: clamp(rawAo.ao2, split.ao2_marks),
    ao3: clamp(rawAo.ao3, split.ao3_marks),
  };

  const stringList = (value: unknown) =>
    Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter((item) => item.length > 0)
      : [];

  if (sections.length === 0) {
    throw new Error("The examiner model did not return a usable essay. Please try again.");
  }

  const {
    sections: fittedSections,
    wordCount,
    trimmed,
  } = trimToWordLimit(sections, ESSAY_WORD_LIMIT);

  if (fittedSections.length === 0) {
    throw new Error("The examiner model did not return a usable essay. Please try again.");
  }

  const essay: GeneratedEssay = {
    level: input.level,
    topic: input.topic,
    question: input.question,
    maxMark: input.maxMark,
    sections: fittedSections,
    diagramIds: [...new Set(fittedSections.flatMap((section) => section.diagramIds))],
    wordCount,
    wordLimit: ESSAY_WORD_LIMIT,
    trimmedToFit: trimmed,
    estimatedMark: Math.max(0, Math.min(input.maxMark, ao.ao1 + ao.ao2 + ao.ao3)),
    ao,
    aoMax: { ao1: split.ao1_marks, ao2: split.ao2_marks, ao3: split.ao3_marks },
    examinerComments: stringList(raw.examiner_comments),
    markSchemeNotes: stringList(raw.mark_scheme_notes),
    keyTerms: Array.isArray(raw.key_terms)
      ? raw.key_terms
          .map((item) => {
            const record = (item ?? {}) as Record<string, unknown>;
            return {
              term: String(record.term ?? "").trim(),
              definition: String(record.definition ?? "").trim(),
            };
          })
          .filter((item) => item.term.length > 0 && item.definition.length > 0)
      : [],
  };

  return { essay, meta: result, sourceCount: sources.length };
}
