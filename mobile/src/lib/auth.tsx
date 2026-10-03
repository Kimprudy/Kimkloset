import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

type AuthValue = {
  session: Session | null;
  user: User | null;
  /** false until we've checked the phone for a saved login */
  ready: boolean;
};

const AuthContext = createContext<AuthValue>({ session: null, user: null, ready: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Fires once straight away with any saved session, then on every sign-in / sign-out / token refresh
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, user: session?.user ?? null, ready }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Readable messages for the errors people actually hit. */
export function friendlyAuthError(err: unknown) {
  const message = err instanceof Error ? err.message : 'Something went wrong.';
  if (message === 'Invalid login credentials') return 'Wrong email or password.';
  if (message === 'Email not confirmed') return 'Please confirm your email first (check your inbox), then sign in.';
  return message;
}

/**
 * Google sign-in for the app:
 * 1. Ask Supabase for the Google login page, saying "come back to this app" (redirectTo)
 * 2. Open it in the secure in-app browser sheet
 * 3. When Google sends us back with a one-time code, swap it for a login session
 * Returns false if the person closed the sheet.
 */
export async function signInWithGoogle(): Promise<boolean> {
  const redirectTo = Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('Could not start Google sign-in.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return false;

  // The code comes back as ?code=...; errors can come back in the query or after #
  const { queryParams } = Linking.parse(result.url);
  const hash = new URLSearchParams(result.url.split('#')[1] ?? '');
  const errorDescription = queryParams?.error_description ?? hash.get('error_description');
  if (errorDescription) throw new Error(String(errorDescription));

  const code = queryParams?.code;
  if (typeof code !== 'string') throw new Error('Google sign-in did not finish. Please try again.');

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
  return true;
}
