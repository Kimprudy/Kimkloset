'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/format';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [checkEmail, setCheckEmail] = useState(false);

  const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success the browser leaves for Google, so no need to reset loading.
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && fullName.trim().length < 2) return setError('Please enter your full name.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success('Welcome back!');
        router.push(next);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: callbackUrl(),
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success('Your account is ready!');
          router.push(next);
          router.refresh();
        } else {
          setCheckEmail(true);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message === 'Invalid login credentials' ? 'Wrong email or password.' : message);
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <MailCheck className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-3xl font-semibold">Check your email</h2>
        <p className="mt-2 text-sm text-ink/60">
          We sent a confirmation link to <strong>{email}</strong>. Click it to finish creating your account.
        </p>
        <button onClick={() => { setCheckEmail(false); setMode('signin'); }} className="btn-outline mt-6">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 rounded-full bg-brand-50 p-1 text-sm font-semibold">
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); }}
            className={cn('rounded-full py-2.5 transition', mode === m ? 'bg-white shadow-sm' : 'text-ink/50')}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <button onClick={handleGoogle} disabled={googleLoading || loading} className="btn-outline mt-6 w-full !py-3.5">
        {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-ink/40">
        <span className="h-px flex-1 bg-ink/10" /> or <span className="h-px flex-1 bg-ink/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {mode === 'signup' && (
          <div>
            <label htmlFor="fullName" className="label">Full name</label>
            <input id="fullName" className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Adaeze Okafor" />
          </div>
        )}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="At least 6 characters"
          />
        </div>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

        <button type="submit" disabled={loading || googleLoading} className="btn-primary w-full !py-3.5">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
