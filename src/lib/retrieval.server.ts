// Retrieval used to ground every AI response. Nothing calls a model without
// first pulling the relevant syllabus / mark scheme / textbook material.
import type { SupabaseClient } from "@supabase/supabase-js";

import { embedOne } from "./ai.server";
import { MODEL_EMBEDDING } from "./examiner/config";
import type { GroundingSource } from "./examiner/types";

export type DocType =
  | "coursebook"
  | "syllabus"
  | "mark_scheme"
  | "past_paper"
  | "mcq_calibration"
  | "examiner_report"
  | "notes"
  | "other";

type MatchRow = {
  chunk_id: string;
  document_id: string;
  document_title: string;
  doc_type: DocType;
  heading: string | null;
  content: string;
  similarity: number;
};

export type RetrieveOptions = {
  query: string;
  matchCount?: number;
  docTypes?: DocType[];
  topicId?: string | null;
  /** Chunks below this cosine similarity are dropped as irrelevant noise. */
  minSimilarity?: number;
};

export async function retrieve(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  options: RetrieveOptions,
): Promise<GroundingSource[]> {
  const queryEmbedding = await embedOne(options.query, MODEL_EMBEDDING);

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: options.matchCount ?? 8,
    filter_doc_types: options.docTypes ?? null,
    filter_topic_id: options.topicId ?? null,
  });

  if (error) throw new Error(`Knowledge search failed: ${error.message}`);

  const minSimilarity = options.minSimilarity ?? 0.25;

  return ((data ?? []) as MatchRow[])
    .filter((row) => row.similarity >= minSimilarity)
    .map((row) => ({
      documentId: row.document_id,
      documentTitle: row.document_title,
      docType: row.doc_type,
      heading: row.heading,
      snippet: row.content,
      similarity: Number(row.similarity.toFixed(4)),
    }));
}

/**
 * Render retrieved chunks as a numbered, citable context block. The [S1]-style
 * markers let the model cite instead of inventing.
 */
export function renderContext(sources: GroundingSource[]): string {
  if (sources.length === 0) return "";

  const blocks = sources.map((source, index) => {
    const label = source.heading
      ? `${source.documentTitle} — ${source.heading}`
      : source.documentTitle;
    return `[S${index + 1}] (${source.docType.replace("_", " ")}) ${label}\n${source.snippet}`;
  });

  return [
    "RETRIEVED CAMBRIDGE SOURCE MATERIAL — this is the only material you may treat as authoritative.",
    "Cite the sources you use with their [S#] markers. If the material below does not cover something,",
    "say so plainly rather than inventing syllabus content, mark scheme wording, or examiner report claims.",
    "",
    blocks.join("\n\n"),
  ].join("\n");
}
