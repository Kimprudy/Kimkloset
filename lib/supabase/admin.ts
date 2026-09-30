import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// SERVER ONLY. Uses the service role key, which bypasses Row Level Security.
// Only used to create/update orders after we've checked who the user is.
// The 'server-only' import makes the build fail if this is ever used in the browser.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
