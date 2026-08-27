import { providerMeta } from "./providers";

export type ProviderConfig = {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  label: string;
};

let cache: { value: ProviderConfig | null; at: number } | null = null;
const TTL_MS = 20_000;

export function normaliseConfig(row: {
  provider: string;
  api_key: string;
  base_url: string | null;
  model: string;
  label: string;
}): ProviderConfig {
  const meta = providerMeta(row.provider);
  return {
    provider: row.provider,
    apiKey: row.api_key,
    baseUrl: (row.base_url?.trim() || meta.baseUrl).replace(/\/+$/, ""),
    model: row.model,
    label: row.label,
  };
}

/** The admin-selected provider override, or null to use built-in Lovable AI. */
export async function getActiveProvider(): Promise<ProviderConfig | null> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  let value: ProviderConfig | null = null;
  try {
    const { supabaseAdmin } = await import("@/integrations/backend/client.server");
    const { data } = await supabaseAdmin
      .from("ai_provider_keys")
      .select("provider, api_key, base_url, model, label")
      .eq("is_active", true)
      .maybeSingle();
    if (data && data.provider !== "lovable" && data.api_key) {
      value = normaliseConfig(data);
    }
  } catch {
    value = null; // Never block AI because the override lookup failed.
  }

  cache = { value, at: Date.now() };
  return value;
}

export function clearActiveProviderCache() {
  cache = null;
}