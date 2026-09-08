import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Per-request Supabase client carrying the Clerk session via the native
 * third-party auth integration (ADR-002) — no JWT template involved.
 * RLS policies read the user id from `auth.jwt()` claims this supplies.
 */
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    },
  );
}
