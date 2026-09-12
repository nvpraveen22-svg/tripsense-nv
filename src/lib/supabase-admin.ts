import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client using the service-role key. Never import this from a
// "use client" component — it bypasses RLS entirely. Left untyped (rather
// than the generated Database generic) because supabase-js's insert/update
// overload resolution breaks down on our hand-written Database type; callers
// validate the shapes they send instead.
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
