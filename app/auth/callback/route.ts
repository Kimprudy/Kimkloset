import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Google sign-in (and email confirmation links) land here.
// We swap the one-time code for a login session, then send the user on.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/';
  if (!next.startsWith('/') || next.startsWith('//')) next = '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    console.error('[auth/callback]', error.message);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
