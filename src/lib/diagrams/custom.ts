import { DIAGRAMS } from "./catalog";
import type { DiagramSpec } from "./spec";
import type { DiagramEntry, DiagramSection } from "./types";

/** Shape returned by the admin/list server functions for a stored diagram. */
export type CustomDiagramRow = {
  id: string;
  slug: string;
  title: string;
  section: string;
  topic: string;
  level: string;
  represents: string;
  whyUsed: string;
  whenToDraw: string;
  howToRead: string[];
  labels: { symbol: string; meaning: string }[];
  mistakes: string[];
  tips: string[];
  realWorld: string[];
  related: string[];
  examQuestions: string[];
  spec: DiagramSpec;
};

/** Geometry an admin can start from, reusing the library's exam conventions. */
export const SPEC_TEMPLATES = DIAGRAMS.map((entry) => ({
  id: entry.id,
  title: `${entry.title} (${entry.section})`,
  spec: entry.spec,
}));

export function templateSpec(id: string): DiagramSpec | null {
  return SPEC_TEMPLATES.find((item) => item.id === id)?.spec ?? null;
}

/** Turn a stored row into the same entry shape the library renders. */
export function toDiagramEntry(row: CustomDiagramRow): DiagramEntry {
  const section: DiagramSection =
    row.section === "Macroeconomics" ? "Macroeconomics" : "Microeconomics";
  return {
    id: `custom:${row.slug}`,
    title: row.title,
    section,
    topic: row.topic || "Added by your school",
    level: (row.level as DiagramEntry["level"]) ?? "AS & A Level",
    spec: row.spec,
    represents: row.represents,
    whyUsed: row.whyUsed,
    whenToDraw: row.whenToDraw,
    howToRead: row.howToRead ?? [],
    labels: row.labels ?? [],
    mistakes: row.mistakes ?? [],
    tips: row.tips ?? [],
    realWorld: row.realWorld ?? [],
    related: row.related ?? [],
    examQuestions: row.examQuestions ?? [],
  };
}

export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "diagram"
  );
}
