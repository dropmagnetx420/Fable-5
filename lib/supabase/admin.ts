import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
import { SUPABASE_URL } from "./env";

// SERVER ONLY. These read non-public env vars and must never be imported from
// a client component — the service-role key would then land in the browser
// bundle. Only the /foisal server component and its server actions use this.

export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE ?? "";

/** True only when the /foisal panel is fully configured (secret + service key). */
export const isAdminConfigured: boolean =
  ADMIN_PASSCODE.length > 0 && SERVICE_ROLE_KEY.length > 20;

/** Service-role Supabase client — bypasses RLS. Server-side use only. */
export function createAdminClient() {
  return createSupabaseClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
