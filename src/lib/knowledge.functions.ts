import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

const IngestInput = z.object({
  title: z.string().trim().min(1).max(200),
  docType: z.enum([
    "coursebook",
    "syllabus",
    "mark_scheme",
    "past_paper",
    "mcq_calibration",
    "examiner_report",
    "notes",
    "other",
  ]),
  sourceName: z.string().trim().max(200).optional(),
  examSeries: z.string().trim().max(60).optional(),
  storagePath: z.string().trim().max(400).optional(),
  text: z.string().min(1).max(6_000_000),
});

/**
 * Stage a document: chunk it and store the chunks unembedded. Embedding runs
 * afterwards in small batches so a 600-page coursebook can never blow the
 * request budget, and the UI gets a real progress signal.
 */
export const ingestDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => IngestInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { chunkText, contentHash } = await import("./chunking.server");

    const chunks = chunkText(data.text);
    if (chunks.length === 0) {
      throw new Error(
        "No readable text was found in this file. If it is a scanned PDF, it needs to be OCR'd first.",
      );
    }

    const hash = await contentHash(data.text);

    const { data: existing } = await supabase
      .from("knowledge_documents")
      .select("id, title")
      .eq("content_hash", hash)
      .maybeSingle();

    if (existing) {
      return {
        documentId: existing.id,
        chunkCount: 0,
        duplicateOf: existing.title,
      };
    }

    const { data: doc, error: docError } = await supabase
      .from("knowledge_documents")
      .insert({
        title: data.title,
        doc_type: data.docType,
        source_name: data.sourceName ?? null,
        exam_series: data.examSeries ?? null,
        storage_path: data.storagePath ?? null,
        content_hash: hash,
        char_count: data.text.length,
        chunk_count: chunks.length,
        status: "processing",
        uploaded_by: userId,
      })
      .select("id")
      .single();

    if (docError || !doc) {
      throw new Error(
        docError?.message.includes("row-level security")
          ? "Only teachers and admins can add material to the knowledge library."
          : (docError?.message ?? "Could not save the document."),
      );
    }

    const rows = chunks.map((chunk) => ({
      document_id: doc.id,
      chunk_index: chunk.index,
      content: chunk.content,
      heading: chunk.heading,
      token_estimate: chunk.tokenEstimate,
    }));

    for (let offset = 0; offset < rows.length; offset += 200) {
      const { error } = await supabase
        .from("document_chunks")
        .insert(rows.slice(offset, offset + 200));
      if (error) {
        await supabase
          .from("knowledge_documents")
          .update({ status: "failed", error_message: error.message })
          .eq("id", doc.id);
        throw new Error(`Saving the document text failed: ${error.message}`);
      }
    }

    return { documentId: doc.id, chunkCount: chunks.length, duplicateOf: null as string | null };
  });

const EMBED_BATCH = 40;

/** Embed the next slice of a document's chunks. Call until `done` is true. */
export const embedNextBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ documentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { embed } = await import("./ai.server");
    const { MODEL_EMBEDDING } = await import("./examiner/config");

    const { data: pending, error } = await supabase
      .from("document_chunks")
      .select("id, content")
      .eq("document_id", data.documentId)
      .is("embedding", null)
      .order("chunk_index", { ascending: true })
      .limit(EMBED_BATCH);

    if (error) throw new Error(error.message);

    if (!pending || pending.length === 0) {
      await supabase
        .from("knowledge_documents")
        .update({ status: "ready", error_message: null })
        .eq("id", data.documentId);
      return { done: true, embedded: 0, remaining: 0 };
    }

    try {
      const vectors = await embed(
        pending.map((chunk) => chunk.content),
        MODEL_EMBEDDING,
      );

      for (let index = 0; index < pending.length; index++) {
        const vector = vectors[index];
        if (!vector) continue;
        const { error: updateError } = await supabase
          .from("document_chunks")
          .update({ embedding: JSON.stringify(vector) })
          .eq("id", pending[index].id);
        if (updateError) throw new Error(updateError.message);
      }
    } catch (embedError) {
      const message = embedError instanceof Error ? embedError.message : "Embedding failed.";
      await supabase
        .from("knowledge_documents")
        .update({ status: "failed", error_message: message })
        .eq("id", data.documentId);
      throw new Error(message);
    }

    const { count } = await supabase
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("document_id", data.documentId)
      .is("embedding", null);

    const remaining = count ?? 0;
    if (remaining === 0) {
      await supabase
        .from("knowledge_documents")
        .update({ status: "ready", error_message: null })
        .eq("id", data.documentId);
    }

    return { done: remaining === 0, embedded: pending.length, remaining };
  });

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("knowledge_documents")
      .select(
        "id, title, doc_type, source_name, exam_series, char_count, chunk_count, status, error_message, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("knowledge_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const searchKnowledge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ query: z.string().trim().min(2).max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { retrieve } = await import("./retrieval.server");
    return retrieve(context.supabase, { query: data.query, matchCount: 10 });
  });
