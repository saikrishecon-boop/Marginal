import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

/** Throws unless the caller holds the admin role. */
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admin access is required for this action.");
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

/** One-time bootstrap: become the platform admin while no admin exists. */
export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_first_admin");
    if (error) throw new Error(error.message);
    return { claimed: data === true };
  });

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/backend/client.server");

    const count = async (table: string) => {
      const { count } = await supabaseAdmin
        .from(table as never)
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    };

    const [users, essays, documents, chunks, attempts, anchors] = await Promise.all([
      count("profiles"),
      count("essays"),
      count("knowledge_documents"),
      count("document_chunks"),
      count("mcq_attempts"),
      count("calibration_anchors"),
    ]);

    const { data: usage } = await supabaseAdmin
      .from("ai_usage_log")
      .select("id, feature, model, ok, error_message, latency_ms, created_at")
      .order("created_at", { ascending: false })
      .limit(25);

    const { data: failures } = await supabaseAdmin
      .from("ai_usage_log")
      .select("id", { count: "exact", head: false })
      .eq("ok", false)
      .limit(1);

    return {
      counts: { users, essays, documents, chunks, attempts, anchors },
      usage: usage ?? [],
      hasFailures: (failures ?? []).length > 0,
    };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/backend/client.server");

    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, school, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    const roleMap = new Map<string, string[]>();
    for (const row of roles ?? []) {
      roleMap.set(row.user_id, [...(roleMap.get(row.user_id) ?? []), row.role as string]);
    }

    return (profiles ?? []).map((profile) => {
      const list = roleMap.get(profile.id) ?? [];
      return {
        id: profile.id,
        fullName: profile.full_name,
        school: profile.school,
        createdAt: profile.created_at,
        role: list.includes("admin") ? "admin" : list.includes("teacher") ? "teacher" : "student",
      };
    });
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["student", "teacher", "admin"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/backend/client.server");

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    if (data.role !== "student") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const listProviderKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("ai_provider_keys")
      .select("id, provider, label, api_key, base_url, model, is_active, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (data ?? []).map((row: Record<string, any>) => ({
      id: row.id as string,
      provider: row.provider as string,
      label: row.label as string,
      maskedKey: maskKey(row.api_key as string),
      baseUrl: (row.base_url as string | null) ?? null,
      model: row.model as string,
      isActive: row.is_active as boolean,
      createdAt: row.created_at as string,
    }));
  });

const KeyInput = z.object({
  id: z.string().uuid().optional(),
  provider: z.enum([
    "lovable",
    "openai",
    "anthropic",
    "google",
    "xai",
    "groq",
    "openrouter",
    "mistral",
    "deepseek",
    "custom",
  ]),
  label: z.string().trim().min(2, "Give this key a name.").max(80),
  apiKey: z.string().trim().min(8, "Paste the full API key.").max(400),
  baseUrl: z.string().trim().max(300).optional().or(z.literal("")),
  model: z.string().trim().min(2, "Set the model id.").max(120),
  activate: z.boolean().default(false),
});

export const saveProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => KeyInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload = {
      provider: data.provider,
      label: data.label,
      api_key: data.apiKey,
      base_url: data.baseUrl ? data.baseUrl : null,
      model: data.model,
      created_by: context.userId,
      updated_at: new Date().toISOString(),
    };

    if (data.id) {
      const { error } = await context.supabase
        .from("ai_provider_keys")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { data: inserted, error } = await context.supabase
        .from("ai_provider_keys")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      data.id = inserted.id as string;
    }

    if (data.activate && data.id) {
      await activate(context.supabase, data.id);
    }
    const { clearActiveProviderCache } = await import("./ai/active.server");
    clearActiveProviderCache();
    return { ok: true, id: data.id };
  });

async function activate(supabase: any, id: string) {
  await supabase.from("ai_provider_keys").update({ is_active: false }).eq("is_active", true);
  const { error } = await supabase.from("ai_provider_keys").update({ is_active: true }).eq("id", id);
  if (error) throw new Error(error.message);
}

export const activateProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid().nullable() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id) {
      await activate(context.supabase, data.id);
    } else {
      // null = fall back to built-in Lovable AI.
      await context.supabase
        .from("ai_provider_keys")
        .update({ is_active: false })
        .eq("is_active", true);
    }
    const { clearActiveProviderCache } = await import("./ai/active.server");
    clearActiveProviderCache();
    return { ok: true };
  });

export const deleteProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("ai_provider_keys").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    const { clearActiveProviderCache } = await import("./ai/active.server");
    clearActiveProviderCache();
    return { ok: true };
  });

/**
 * Replace the secret on an existing key in place — the provider, model and
 * active state are kept, so rotating a leaked key never interrupts marking.
 */
export const rotateProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        apiKey: z.string().trim().min(8, "Paste the new API key.").max(400),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("ai_provider_keys")
      .update({ api_key: data.apiKey, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    const { clearActiveProviderCache } = await import("./ai/active.server");
    clearActiveProviderCache();
    return { ok: true };
  });

/** Sends a one-line prompt through a stored key so admins can verify it works. */
export const testProviderKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("ai_provider_keys")
      .select("provider, api_key, base_url, model, label")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("That key no longer exists.");

    const { chat } = await import("./ai.server");
    const { normaliseConfig } = await import("./ai/active.server");
    const config = row.provider === "lovable" ? null : normaliseConfig(row as never);

    try {
      const result = await chat({
        model: (row as { model: string }).model,
        overrideProvider: config,
        messages: [{ role: "user", content: "Reply with exactly: OK" }],
        maxCompletionTokens: 20,
      });
      return { ok: true, reply: result.text.trim().slice(0, 80), model: result.model };
    } catch (err) {
      return { ok: false, reply: err instanceof Error ? err.message : "Unknown error", model: null };
    }
  });