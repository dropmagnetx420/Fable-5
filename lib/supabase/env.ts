// Central Supabase env access + a guard so the app runs cleanly with
// placeholder credentials (no hanging network calls in middleware).

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * True only when real-looking Supabase credentials are present.
 * Lets pages render a friendly "connect Supabase" state instead of
 * throwing when the project ships with placeholder env values.
 */
export const isSupabaseConfigured: boolean =
  /^https:\/\/.+\.supabase\.(co|in)$/.test(SUPABASE_URL) &&
  SUPABASE_ANON_KEY.length > 20 &&
  !SUPABASE_URL.includes("your-project-ref") &&
  !SUPABASE_ANON_KEY.toLowerCase().includes("placeholder");
