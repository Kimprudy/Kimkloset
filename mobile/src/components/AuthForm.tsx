import { useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Button from '@/components/Button';
import Field from '@/components/Field';
import { friendlyAuthError, signInWithGoogle } from '@/lib/auth';
import { API_URL } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

/** Sign in / Create account — same rules as the website's LoginForm. */
export default function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    try {
      if (await signInWithGoogle()) onSuccess?.();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    if (mode === 'signup' && fullName.trim().length < 2) return setError('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onSuccess?.();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim() },
            // The confirmation link opens the website; then they come back and sign in here
            emailRedirectTo: `${API_URL}/auth/callback`,
          },
        });
        if (error) throw error;
        if (data.session) onSuccess?.();
        else setCheckEmail(true);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <View style={styles.center}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-open-outline" size={26} color={colors.pinkDeep} />
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.muted}>
          We sent a confirmation link to <Text style={styles.bold}>{email.trim()}</Text>. Tap it, then come back here and sign in.
        </Text>
        <Button
          title="Back to sign in"
          variant="outline"
          style={{ alignSelf: 'stretch', marginTop: 8 }}
          onPress={() => {
            setCheckEmail(false);
            setMode('signin');
          }}
        />
      </View>
    );
  }

  const busy = loading || googleLoading;

  return (
    <View style={styles.form}>
      <View style={styles.toggle}>
        {(['signin', 'signup'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => {
              setMode(m);
              setError(null);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === m }}
            style={[styles.toggleItem, mode === m && styles.toggleActive]}>
            <Text style={[styles.toggleText, mode !== m && { color: colors.inkFaint }]}>
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        title="Continue with Google"
        variant="outline"
        onPress={handleGoogle}
        loading={googleLoading}
        disabled={busy}
        icon={<Ionicons name="logo-google" size={18} color="#4285F4" />}
      />

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.or}>OR</Text>
        <View style={styles.line} />
      </View>

      {mode === 'signup' && (
        <Field
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Adaeze Okafor"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
      )}
      <Field
        ref={emailRef}
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <Field
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        secureTextEntry
        autoCapitalize="none"
        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
        textContentType={mode === 'signin' ? 'password' : 'newPassword'}
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <Button title={mode === 'signin' ? 'Sign in' : 'Create account'} onPress={handleSubmit} loading={loading} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  toggle: { flexDirection: 'row', backgroundColor: colors.pinkSoft, borderRadius: 999, padding: 4 },
  toggleItem: { flex: 1, paddingVertical: 11, borderRadius: 999, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  toggleText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 2, color: colors.inkFaint },
  error: { fontFamily: fonts.body, fontSize: 14, color: '#B91C1C', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12 },
  center: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.pinkLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  muted: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkMuted, textAlign: 'center' },
  bold: { fontFamily: fonts.bodyBold, color: colors.ink },
});
