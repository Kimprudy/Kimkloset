import { createBrowserClient } from '@supabase/ssr';

// Used in the browser. Only the PUBLIC anon key is used here — safe to expose.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
