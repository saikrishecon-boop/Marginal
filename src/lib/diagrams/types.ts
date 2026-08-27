import type { DiagramLabel, DiagramSpec } from "./spec";

export type DiagramSection = "Microeconomics" | "Macroeconomics";

export type DiagramEntry = {
  id: string;
  title: string;
  section: DiagramSection;
  topic: string;
  level: "AS" | "A Level" | "AS & A Level";
  spec: DiagramSpec;
  /** What the diagram represents. */
  represents: string;
  /** Why Cambridge uses it. */
  whyUsed: string;
  /** When candidates are expected to draw it. */
  whenToDraw: string;
  /** How to interpret it, step by step. */
  howToRead: string[];
  labels: DiagramLabel[];
  mistakes: string[];
  tips: string[];
  realWorld: string[];
  related: string[];
  examQuestions: string[];
};