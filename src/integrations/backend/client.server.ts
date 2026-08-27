// Server-only admin client for the self-hosted backend. Bypasses RLS.
// Load it inside handlers: await import("@/integrations/backend/client.server")
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { BACKEND_URL, createBackendFetch } from "./config";

function createAdminClient() {
  const key = process.env["BACKEND_SERVICE_ROLE_KEY"];
  if (!key) {
    throw new Error(
      "Missing BACKEND_SERVICE_ROLE_KEY. Add the service role key of the backend project in secrets.",
    );
  }

  return createClient<Database>(BACKEND_URL, key, {
    global: { fetch: createBackendFetch(key) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

let _admin: ReturnType<typeof createAdminClient> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createAdminClient>, {
  get(_, prop, receiver) {
    if (!_admin) _admin = createAdminClient();
    return Reflect.get(_admin, prop, receiver);
  },
});
