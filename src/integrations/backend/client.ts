import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { BACKEND_PUBLISHABLE_KEY, BACKEND_URL, createBackendFetch } from "./config";

function createBackendClient() {
  return createClient<Database>(BACKEND_URL, BACKEND_PUBLISHABLE_KEY, {
    global: { fetch: createBackendFetch(BACKEND_PUBLISHABLE_KEY) },
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _client: ReturnType<typeof createBackendClient> | undefined;

// import { supabase } from "@/integrations/backend/client";
export const supabase = new Proxy({} as ReturnType<typeof createBackendClient>, {
  get(_, prop, receiver) {
    if (!_client) _client = createBackendClient();
    return Reflect.get(_client, prop, receiver);
  },
});
