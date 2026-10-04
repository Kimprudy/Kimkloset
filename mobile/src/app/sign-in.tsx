import { router } from 'expo-router';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import AuthForm from '@/components/AuthForm';
import { useCart } from '@/lib/cart';
import { setPendingAdd, takePendingAdd } from '@/lib/pending-add';
import { colors, fonts } from '@/lib/theme';

/**
 * Slides up when a signed-out shopper taps "Add to cart".
 * After they sign in, the item they tapped is added to their cart.
 */
export default function SignInModal() {
  const { add } = useCart();
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  // Closed without signing in: forget the item
  const cancel = () => {
    setPendingAdd(null);
    close();
  };

  async function handleSignedIn() {
    const item = takePendingAdd();
    close();
    if (!item) return;
    try {
      await add(item);
      Alert.alert('Added to your cart', `${item.name} is in your cart.`, [
        { text: 'Keep shopping', style: 'cancel' },
        { text: 'View cart', onPress: () => router.navigate('/cart') },
      ]);
    } catch (err) {
      Alert.alert('Could not add to cart', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.top}>
        <Text style={styles.heading}>Sign in to continue</Text>
        <Pressable onPress={cancel} hitSlop={12} accessibilityLabel="Close">
          <Ionicons name="close" size={26} color={colors.ink} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sub}>Your cart is saved to your account, so it&apos;s the same on the website and the app.</Text>
        <AuthForm onSuccess={handleSignedIn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.white },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 6 },
  heading: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  sub: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkMuted, marginTop: -8 },
});
