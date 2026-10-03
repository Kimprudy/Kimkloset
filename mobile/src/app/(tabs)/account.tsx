import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthForm from '@/components/AuthForm';
import Button from '@/components/Button';
import StateView from '@/components/StateView';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';

export default function AccountScreen() {
  const { user, ready } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  if (!ready) {
    return (
      <SafeAreaView style={styles.safe}>
        <StateView kind="loading" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.heading}>Welcome</Text>
            <Text style={styles.sub}>Sign in to see the same cart and orders as on kimkloset.vercel.app.</Text>
            <AuthForm />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const name: string = user.user_metadata?.full_name || user.user_metadata?.name || '';
  const initials = (name || user.email || '?')
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

  function confirmSignOut() {
    Alert.alert('Sign out?', 'Your cart stays saved to your account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await supabase.auth.signOut();
          setSigningOut(false);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>My account</Text>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            {name ? <Text style={styles.name}>{name}</Text> : null}
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>

        <View style={styles.links}>
          <LinkRow icon="receipt-outline" label="My orders" onPress={() => router.push('/orders')} />
          <LinkRow icon="bag-handle-outline" label="My cart" onPress={() => router.push('/cart')} />
          <LinkRow icon="storefront-outline" label="Keep shopping" onPress={() => router.push('/')} />
        </View>

        <Button title="Sign out" variant="outline" onPress={confirmSignOut} loading={signingOut} />
        <Text style={styles.note}>Signed in with the same account as the website, so your cart and orders match.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function LinkRow({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.linkRow, pressed && { backgroundColor: colors.pinkSoft }]}>
      <Ionicons name={icon} size={20} color={colors.pinkDeep} />
      <Text style={styles.linkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  heading: { fontFamily: fonts.display, fontSize: 38, color: colors.ink, marginTop: 8 },
  sub: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkMuted, marginTop: -10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.pinkSoft, borderRadius: 20, padding: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.white },
  name: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.ink },
  email: { fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted },
  links: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, overflow: 'hidden' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  linkText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  note: { fontFamily: fonts.body, fontSize: 13, color: colors.inkFaint, textAlign: 'center' },
});
