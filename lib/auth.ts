import 'server-only';
import { createClient as createSupabaseClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { createClient as createCookieClient } from '@/lib/supabase/server';

/**
 * Works out who is calling an API route.
 * - Mobile app: sends `Authorization: Bearer <supabase access_token>`
 * - Website: sends the normal Supabase login cookie
 * Either way, the returned `supabase` client acts AS that user, so Row Level Security still applies.
 */
export async function getRequestUser(request: Request): Promise<{ user: User | null; supabase: SupabaseClient }> {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (token) {
    const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data } = await supabase.auth.getUser(token);
    return { user: data.user ?? null, supabase };
  }

  const supabase = await createCookieClient();
  const { data } = await supabase.auth.getUser();
  return { user: data.user ?? null, supabase: supabase as unknown as SupabaseClient };
}
