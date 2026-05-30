// Service-role Supabase client. ONLY for trusted server-side flows that must
// bypass RLS — the public /q/[id] page and the /embed/* widgets, both of
// which authenticate via something other than a session cookie.
//
// Never import this from a Client Component, and never expose the
// service-role key to the browser.
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createAdminClient: missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
