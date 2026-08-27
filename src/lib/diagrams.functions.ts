import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import type { CustomDiagramRow } from "@/lib/diagrams/custom";

const lines = z.array(z.string().trim().min(1)).max(30).default([]);

const DiagramInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3, "Give the diagram a title.").max(140),
  section: z.enum(["Microeconomics", "Macroeconomics"]),
  topic: z.string().trim().min(2).max(90),
  level: z.enum(["AS", "A Level", "AS & A Level"]).default("AS & A Level"),
  represents: z.string().trim().max(1200).default(""),
  whyUsed: z.string().trim().max(1200).default(""),
  whenToDraw: z.string().trim().max(1200).default(""),
  howToRead: lines,
  labels: z
    .array(
      z.object({ symbol: z.string().trim().min(1).max(24), meaning: z.string().trim().max(300) }),
    )
    .max(40)
    .default([]),
  mistakes: lines,
  tips: lines,
  realWorld: lines,
  related: lines,
  examQuestions: lines,
  spec: z.record(z.string(), z.unknown()),
});

function mapRow(row: Record<string, any>): CustomDiagramRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    section: row.section,
    topic: row.topic,
    level: row.level,
    represents: row.represents ?? "",
    whyUsed: row.why_used ?? "",
    whenToDraw: row.when_to_draw ?? "",
    howToRead: row.how_to_read ?? [],
    labels: row.labels ?? [],
    mistakes: row.mistakes ?? [],
    tips: row.tips ?? [],
    realWorld: row.real_world ?? [],
    related: row.related ?? [],
    examQuestions: row.exam_questions ?? [],
    spec: row.spec,
  };
}

/** Every signed-in student sees admin-added diagrams inside the library. */
export const listCustomDiagrams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("custom_diagrams")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRow);
  });

export const saveCustomDiagram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DiagramInput.parse(input))
  .handler(async ({ data, context }) => {
    const { slugify } = await import("@/lib/diagrams/custom");
    const payload = {
      slug: `${slugify(data.title)}-${Date.now().toString(36)}`,
      title: data.title,
      section: data.section,
      topic: data.topic,
      level: data.level,
      represents: data.represents,
      why_used: data.whyUsed,
      when_to_draw: data.whenToDraw,
      how_to_read: data.howToRead,
      labels: data.labels as unknown as never,
      mistakes: data.mistakes,
      tips: data.tips,
      real_world: data.realWorld,
      related: data.related,
      exam_questions: data.examQuestions,
      spec: data.spec as unknown as never,
      created_by: context.userId,
    };

    if (data.id) {
      const { slug: _slug, created_by: _by, ...update } = payload;
      const { error } = await context.supabase
        .from("custom_diagrams")
        .update(update)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }

    const { data: inserted, error } = await context.supabase
      .from("custom_diagrams")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id as string };
  });

/** Light list (no geometry) for the "reference a diagram" picker on the grader. */
export const listDiagramLibrary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { DIAGRAMS } = await import("@/lib/diagrams/catalog");
    return DIAGRAMS.map((entry) => ({
      id: entry.id,
      title: entry.title,
      section: entry.section,
      topic: entry.topic,
      xLabel: entry.spec.xLabel,
      yLabel: entry.spec.yLabel,
      curveLabels: entry.spec.curves.map((curve) => curve.label).filter(Boolean),
    }));
  });

const DiagramUrlInput = z.object({ url: z.string().trim().url("Paste a valid image URL.") });

/** Describes a diagram image (URL) into the same [DIAGRAM: ...] tag the handwriting OCR uses. */
export const describeDiagramUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DiagramUrlInput.parse(input))
  .handler(async ({ data, context }) => {
    const { describeDiagramFromUrl } = await import("./diagrams/describe.server");
    try {
      const tag = await describeDiagramFromUrl(data.url);
      await context.supabase.from("ai_usage_log").insert({
        user_id: context.userId,
        feature: "describe_diagram_url",
        model: "diagram-url-describe",
        ok: true,
      });
      return { tag };
    } catch (error) {
      await context.supabase.from("ai_usage_log").insert({
        user_id: context.userId,
        feature: "describe_diagram_url",
        model: "diagram-url-describe",
        ok: false,
        error_message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  });

export const deleteCustomDiagram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("custom_diagrams").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
