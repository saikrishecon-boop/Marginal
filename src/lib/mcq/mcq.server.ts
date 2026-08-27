/**
 * MCQ engine — generates Cambridge 9708 Paper 1 style multiple choice questions
 * from the project's own knowledge base (coursebook + syllabus), in the exact
 * house style of a real paper: one stem, four options A–D, one correct answer,
 * distractors that encode a real misconception.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import { chat } from "../ai.server";
import { renderContext, retrieve } from "../retrieval.server";
import { DIAGRAM_IDS, DIAGRAM_INDEX_FOR_AI } from "../diagrams/catalog";
import { MODEL_EXAMINER } from "../examiner/config";
import { extractFirstJsonObject } from "../examiner/json";

export type McqOption = "A" | "B" | "C" | "D";

export type McqQuestion = {
  number: number;
  stem: string;
  options: Record<McqOption, string>;
  answer: McqOption;
  explanation: string;
  distractorNotes: Partial<Record<McqOption, string>>;
  topic: string;
  syllabusRef: string | null;
  skill: "knowledge" | "application" | "analysis";
  /** Optional diagram from the library shown above the stem. */
  diagramId?: string | null;
};

/** Paper 1 (AS) and Paper 3 (A Level) both run 30 questions, 1 mark each. */
export const PAPER_TOTAL = 30;
export const BATCH_SIZE = 10;

const AS_SECTIONS = [
  "Basic economic ideas and resource allocation (scarcity, PPCs, positive vs normative, factors of production, specialisation)",
  "The price system and the microeconomy (demand and supply, elasticities, consumer/producer surplus, price controls)",
  "Government microeconomic intervention (taxes, subsidies, market failure, externalities, public and merit goods)",
  "The macroeconomy (AD/AS, national income, inflation, unemployment, balance of payments, exchange rates)",
  "Government macroeconomic intervention (fiscal, monetary and supply-side policy, policy conflicts)",
  "International economic issues (comparative advantage, protectionism, terms of trade)",
];

const A2_SECTIONS = [
  "Utility, indifference curves and budget lines, behavioural economics",
  "Costs, revenues and market structures (perfect competition, monopoly, oligopoly, contestability)",
  "Labour market, wage determination and trade unions",
  "Market failure and government intervention (regulation, privatisation, cost-benefit analysis)",
  "Economic growth, development and sustainability (Gini, HDI, Kuznets, Lorenz curve)",
  "Macro policy, money supply, quantity theory, Phillips curve, exchange rate systems",
];

const CONTRACT = `
Return ONLY one JSON object:
{ "questions": [
  {
    "stem": string,                  // the question exactly as a real paper would word it
    "options": { "A": string, "B": string, "C": string, "D": string },
    "answer": "A" | "B" | "C" | "D",
    "explanation": string,           // why the key is correct, in examiner voice, 2-3 sentences
    "distractor_notes": { "A": string, "B": string, "C": string, "D": string }, // the misconception each wrong option tests
    "topic": string,                 // short syllabus topic name
    "syllabus_ref": string,          // e.g. "2.2" if known, else ""
    "skill": "knowledge" | "application" | "analysis",
    "diagram_id": string             // an id from the diagram library, or "" for a text-only question
  }
] }
`.trim();

const HOUSE_STYLE = [
  "House style rules, taken from real 9708 multiple choice papers:",
  "- One idea per question. Stems are short and neutral; no 'which of the following' padding.",
  "- Use real Cambridge stem patterns: 'Which statement is a normative statement?',",
  "  'What must be true?', 'Which change would cause X?', 'Which combination is correct?',",
  "  data/table/diagram-described stems (describe the data in words, never reference an image).",
  "- Exactly one defensible answer. The other three must be plausible to a weak candidate",
  "  and each must encode a specific, nameable misconception.",
  "- All four options must be similar in length and grammatical form.",
  "- Never write 'all of the above', 'none of the above', or negated options with 'not both'.",
  "- Use realistic contexts and numbers (countries, firms, percentages) as the real paper does.",
  "- Mix difficulty: roughly 40% knowledge/recall, 40% application, 20% analysis.",
].join("\n");

const DIAGRAM_RULES = [
  "Diagram questions:",
  "- Roughly 6 to 9 of every 10 questions stay text-only ('diagram_id': '').",
  "- For the rest, set 'diagram_id' to one id from the diagram library below. The diagram is rendered",
  "  above the stem exactly as the library draws it, so the stem MUST be answerable from that diagram.",
  "- Word those stems the way the real paper does: 'The diagram shows ... Which area represents consumer surplus?',",
  "  'In the diagram, what does the movement from E1 to E2 show?', 'Which curve shift would cause the change shown?'",
  "- Never invent labels, curves, areas or numbers that the chosen diagram does not actually contain.",
  "  Only refer to labels listed in the diagram description.",
  "- Never write 'see the diagram below' for a text-only question, and never leave diagram_id set to an id you did not use.",
  "",
  "DIAGRAM LIBRARY (id — title (section, topic): what it shows):",
  DIAGRAM_INDEX_FOR_AI,
].join("\n");

export async function generateMcqBatchQuestions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  options: {
    level: "as" | "a2";
    topic?: string | null;
    count: number;
    batchIndex: number;
    existingStems: string[];
  },
) {
  const sections = options.level === "a2" ? A2_SECTIONS : AS_SECTIONS;
  const focus =
    options.topic && options.topic.trim().length > 1
      ? options.topic.trim()
      : sections[options.batchIndex % sections.length];

  let sources: Awaited<ReturnType<typeof retrieve>> = [];
  try {
    sources = await retrieve(supabase, {
      query: `${focus} — key definitions, mechanisms and worked examples`,
      matchCount: 8,
      docTypes: ["coursebook", "syllabus", "past_paper", "mark_scheme"],
    });
  } catch (error) {
    console.error("MCQ retrieval failed", error);
  }

  // Real past MCQ papers, uploaded separately in the knowledge base as
  // calibration reference only — never mined for question content, purely
  // for matching the pacing and stem length of a genuine 30-question paper.
  let calibrationSources: Awaited<ReturnType<typeof retrieve>> = [];
  try {
    calibrationSources = await retrieve(supabase, {
      query: `${focus} — realistic 9708 multiple choice paper stem length and pacing`,
      matchCount: 4,
      docTypes: ["mcq_calibration"],
    });
  } catch (error) {
    console.error("MCQ calibration retrieval failed", error);
  }

  const systemPrompt = [
    "You are a Cambridge International 9708 Economics assessment writer producing",
    options.level === "a2"
      ? "Paper 3 (A Level) multiple choice questions."
      : "Paper 1 (AS Level) multiple choice questions.",
    "",
    HOUSE_STYLE,
    "",
    DIAGRAM_RULES,
    "",
    "Every question must be answerable from the syllabus content below. Prefer the wording,",
    "definitions and examples in this source material so the paper matches the taught course.",
    sources.length > 0 ? `\n${renderContext(sources)}` : "",
    "",
    calibrationSources.length > 0
      ? [
          "CALIBRATION REFERENCE — real past 9708 multiple choice papers, uploaded separately from",
          "the coursebook purely to calibrate house style. Match their stem length, phrasing register",
          "and how much a candidate can realistically read and answer within the real paper's time per",
          "question (Paper 1 AS: 30 questions in 1 hour; Paper 3 A Level: 30 questions in 1 hour 15",
          "minutes) — do NOT copy or paraphrase their actual questions, only their pacing and style:",
          renderContext(calibrationSources),
        ].join("\n")
      : "",
    "",
    CONTRACT,
  ].join("\n");

  const userMessage = [
    `Write exactly ${options.count} questions.`,
    `Focus area for this set: ${focus}`,
    options.existingStems.length > 0
      ? `Do NOT repeat or paraphrase any of these stems already on the paper:\n- ${options.existingStems
          .slice(-24)
          .join("\n- ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await chat({
    model: MODEL_EXAMINER,
    temperature: 0.5,
    json: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const raw = extractFirstJsonObject(result.text);
  const list = raw && Array.isArray(raw.questions) ? raw.questions : [];

  const questions = list
    .map((item) => {
      const q = (item ?? {}) as Record<string, unknown>;
      const rawOptions = (q.options ?? {}) as Record<string, unknown>;
      const options_: Record<McqOption, string> = {
        A: String(rawOptions.A ?? "").trim(),
        B: String(rawOptions.B ?? "").trim(),
        C: String(rawOptions.C ?? "").trim(),
        D: String(rawOptions.D ?? "").trim(),
      };
      const answer = String(q.answer ?? "")
        .toUpperCase()
        .trim() as McqOption;
      const notesRaw = (q.distractor_notes ?? {}) as Record<string, unknown>;
      const distractorNotes: Partial<Record<McqOption, string>> = {};
      for (const key of ["A", "B", "C", "D"] as McqOption[]) {
        const note = notesRaw[key];
        if (typeof note === "string" && note.trim()) distractorNotes[key] = note.trim();
      }
      const skill = String(q.skill ?? "knowledge");
      const diagramId = String(q.diagram_id ?? "").trim();
      return {
        number: 0,
        stem: String(q.stem ?? "").trim(),
        options: options_,
        answer,
        explanation: String(q.explanation ?? "").trim(),
        distractorNotes,
        topic: String(q.topic ?? focus).trim(),
        syllabusRef: String(q.syllabus_ref ?? "").trim() || null,
        diagramId: DIAGRAM_IDS.includes(diagramId) ? diagramId : null,
        skill: (["knowledge", "application", "analysis"].includes(skill)
          ? skill
          : "knowledge") as McqQuestion["skill"],
      } satisfies McqQuestion;
    })
    .filter(
      (q) =>
        q.stem.length > 8 &&
        (["A", "B", "C", "D"] as string[]).includes(q.answer) &&
        Object.values(q.options).every((option) => option.length > 0),
    );

  return { questions, meta: result };
}
