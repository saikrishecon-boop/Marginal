import { MACRO_DIAGRAMS } from "./macro";
import { MICRO_DIAGRAMS } from "./micro";
import type { DiagramEntry, DiagramSection } from "./types";

export const DIAGRAMS: DiagramEntry[] = [...MICRO_DIAGRAMS, ...MACRO_DIAGRAMS];

export const DIAGRAM_BY_ID: Record<string, DiagramEntry> = Object.fromEntries(
  DIAGRAMS.map((entry) => [entry.id, entry]),
);

export function getDiagram(id: string | null | undefined): DiagramEntry | null {
  if (!id) return null;
  return DIAGRAM_BY_ID[id] ?? null;
}

export const SECTIONS: DiagramSection[] = ["Microeconomics", "Macroeconomics"];

/** Topic groups in syllabus order, per section. */
export function topicsFor(section: DiagramSection): string[] {
  const seen: string[] = [];
  for (const entry of DIAGRAMS) {
    if (entry.section !== section) continue;
    if (!seen.includes(entry.topic)) seen.push(entry.topic);
  }
  return seen;
}

/** Compact index the AI can read when choosing a diagram for an MCQ or essay. */
export const DIAGRAM_INDEX_FOR_AI = DIAGRAMS.map(
  (entry) => `${entry.id} — ${entry.title} (${entry.section}, ${entry.topic}): ${entry.represents}`,
).join("\n");

export const DIAGRAM_IDS = DIAGRAMS.map((entry) => entry.id);
