import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Public client (safe for the browser).
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Server-only client with the secret key. Bypasses row-level security, so it
// must NEVER be imported into client components, only API routes. Used for
// storage uploads and DB writes so the public key can't be abused.
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}

export function isSupabaseAdminConfigured(): boolean {
  return !!supabaseUrl && !!supabaseServiceKey;
}

export function getSupabaseServerConfigStatus() {
  return {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    hasSupabaseServiceRoleKey: Boolean(supabaseServiceKey),
  };
}
