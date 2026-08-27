// Self-hosted backend configuration.
// Reads from env vars (set these in .env / your host's dashboard) so the
// project can be pointed at a brand new Supabase project without touching
// code. The values below are only a fallback for local dev if .env is
// missing — replace or delete them once you have your own project.
// The URL and publishable key are public by design (safe to ship to the browser).
export const BACKEND_URL =
  import.meta.env["VITE_BACKEND_URL"] ||
  (typeof process !== "undefined" ? process.env["BACKEND_URL"] : undefined) ||
  "https://ccxphyddlztzhcvyuvuc.supabase.co";
export const BACKEND_PUBLISHABLE_KEY =
  import.meta.env["VITE_BACKEND_PUBLISHABLE_KEY"] ||
  (typeof process !== "undefined" ? process.env["BACKEND_PUBLISHABLE_KEY"] : undefined) ||
  "sb_publishable_P9JyihN9I1msyaJCGSRdXQ_Y6tQXNp3";

function isNewApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

/** New-format `sb_` keys are opaque strings, not bearer JWTs. */
export function createBackendFetch(apiKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (isNewApiKey(apiKey) && headers.get("Authorization") === `Bearer ${apiKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", apiKey);
    return fetch(input, { ...init, headers });
  };
}
