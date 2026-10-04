import { useEffect, useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Field from '@/components/Field';
import OrderDetails from '@/components/OrderDetails';
import StatePicker from '@/components/StatePicker';
import StateView from '@/components/StateView';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { formatNaira, SHIPPING_FEE } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import type { Order } from '@/lib/types';

type VerifyResult = { state: 'paid' | 'pending' | 'failed'; order: Order; reason?: string };
type Phase =
  | { kind: 'form' }
  | { kind: 'verifying'; reference: string }
  | { kind: 'result'; reference: string; result: VerifyResult }
  | { kind: 'verifyError'; reference: string; message: string };

type Form = { fullName: string; phone: string; address: string; city: string; state: string };

export default function CheckoutScreen() {
  const { user } = useAuth();
  const { items, count, subtotal, refresh } = useCart();
  const [form, setForm] = useState<Form>({ fullName: '', phone: '', address: '', city: '', state: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'form' });
  const phoneRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);

  // Pre-fill name and phone from the profile (saved by the last checkout, on web or mobile)
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setForm((f) => ({ ...f, fullName: f.fullName || data.full_name || '', phone: f.phone || data.phone || '' }));
      });
  }, [userId]);

  const set = (key: keyof Form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/cart'));

  async function verify(reference: string) {
    setPhase({ kind: 'verifying', reference });
    try {
      const result = await api<VerifyResult>(`/api/orders/verify?reference=${encodeURIComponent(reference)}`);
      setPhase({ kind: 'result', reference, result });
      if (result.state === 'paid') void refresh(); // the server emptied the cart
    } catch (err) {
      setPhase({ kind: 'verifyError', reference, message: err instanceof Error ? err.message : 'Could not check your payment.' });
    }
  }

  async function pay() {
    // Same rules as the website's checkout form
    const e: typeof errors = {};
    if (form.fullName.trim().length < 2) e.fullName = 'Enter your full name';
    if (!/^\+?[0-9\s-]{7,20}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number';
    if (form.address.trim().length < 5) e.address = 'Enter your delivery address';
    if (form.city.trim().length < 2) e.city = 'Enter your city';
    if (!form.state) e.state = 'Choose your state';
    setErrors(e);
    setPayError(null);
    if (Object.keys(e).length > 0) return;

    setPaying(true);
    try {
      // Paystack sends the customer to our website, which confirms the order and then opens this link
      const returnUrl = Linking.createURL('payment-return');
      const { authorizationUrl, orderNumber } = await api<{ authorizationUrl: string; orderNumber: string }>('/api/checkout', {
        method: 'POST',
        body: { ...form, returnUrl },
      });
      // Paystack opens in the secure browser sheet; it closes when the payment finishes or they tap Cancel
      await WebBrowser.openAuthSessionAsync(authorizationUrl, returnUrl);
      await verify(orderNumber);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Could not start payment. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  let body: React.ReactNode;

  if (phase.kind === 'verifying') {
    body = <StateView kind="loading" message="Confirming your payment…" />;
  } else if (phase.kind === 'verifyError') {
    body = (
      <StateView
        kind="error"
        title="Couldn't confirm your payment"
        message={`${phase.message} If you paid, your order will still appear under Orders.`}
        actionLabel="Check again"
        onAction={() => void verify(phase.reference)}
      />
    );
  } else if (phase.kind === 'result') {
    const { result } = phase;
    if (result.state === 'paid') {
      const firstName = result.order.customer_name.split(' ')[0];
      body = (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={34} color={colors.success} />
          </View>
          <Text style={styles.thanks}>Thank you, {firstName}!</Text>
          <Text style={styles.centerText}>
            Your payment was successful and order <Text style={styles.bold}>{result.order.order_number}</Text> is confirmed.
          </Text>
          <Text style={styles.emailNote}>A confirmation email is on its way to {result.order.customer_email}</Text>
          <View style={styles.card}>
            <OrderDetails order={result.order} />
          </View>
          <Button title="View my orders" onPress={() => router.replace('/orders')} />
          <Button title="Keep shopping" variant="outline" onPress={() => router.replace('/')} />
        </ScrollView>
      );
    } else {
      const failed = result.state === 'failed';
      body = (
        <StateView
          kind={failed ? 'error' : 'empty'}
          icon={failed ? 'close-circle-outline' : 'time-outline'}
          title={failed ? 'Payment not completed' : 'Payment not confirmed yet'}
          message={
            failed
              ? `${result.reason ?? 'Your payment was declined.'} Your cart has been kept, so you can try again.`
              : `We haven't received a payment for order ${result.order.order_number}. If you closed the payment page, your cart is still saved. Just pay again. If you were charged, check again in a minute.`
          }
          actionLabel={failed ? 'Try again' : 'Check again'}
          onAction={() => (failed ? setPhase({ kind: 'form' }) : void verify(phase.reference))}
        />
      );
    }
  } else if (!user) {
    body = <StateView kind="empty" icon="lock-closed-outline" title="Please sign in" message="Sign in to check out." actionLabel="Sign in" onAction={() => router.push('/sign-in')} />;
  } else if (!items) {
    body = <StateView kind="loading" />;
  } else if (items.length === 0) {
    body = <StateView kind="empty" icon="bag-handle-outline" title="Your cart is empty" message="Add something before checking out." actionLabel="Start shopping" onAction={() => router.replace('/')} />;
  } else {
    body = (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.section}>Delivery details</Text>
          <Field label="Full name" value={form.fullName} onChangeText={set('fullName')} autoComplete="name" textContentType="name" returnKeyType="next" onSubmitEditing={() => phoneRef.current?.focus()} />
          {errors.fullName ? <Text style={styles.fieldError}>{errors.fullName}</Text> : null}
          <Field
            ref={phoneRef}
            label="Phone number"
            value={form.phone}
            onChangeText={set('phone')}
            placeholder="0801 234 5678"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
          {errors.phone ? <Text style={styles.fieldError}>{errors.phone}</Text> : null}
          <Field
            ref={addressRef}
            label="Delivery address"
            value={form.address}
            onChangeText={set('address')}
            placeholder="House number, street, area"
            autoComplete="street-address"
            textContentType="fullStreetAddress"
            returnKeyType="next"
            onSubmitEditing={() => cityRef.current?.focus()}
          />
          {errors.address ? <Text style={styles.fieldError}>{errors.address}</Text> : null}
          <Field ref={cityRef} label="City" value={form.city} onChangeText={set('city')} placeholder="Lekki" textContentType="addressCity" returnKeyType="done" />
          {errors.city ? <Text style={styles.fieldError}>{errors.city}</Text> : null}
          <StatePicker value={form.state} onChange={set('state')} />
          {errors.state ? <Text style={styles.fieldError}>{errors.state}</Text> : null}

          <View style={styles.card}>
            <Text style={styles.section}>Order summary</Text>
            {items.map((i) => (
              <View key={i.key} style={styles.sumRow}>
                <Text style={styles.sumName} numberOfLines={1}>
                  {i.quantity} × {i.name}
                </Text>
                <Text style={styles.sumValue}>{formatNaira(i.price * i.quantity)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Subtotal ({count})</Text>
              <Text style={styles.sumValue}>{formatNaira(subtotal)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Delivery</Text>
              <Text style={styles.sumValue}>{formatNaira(SHIPPING_FEE)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.total}>Total</Text>
              <Text style={styles.total}>{formatNaira(subtotal + SHIPPING_FEE)}</Text>
            </View>
          </View>

          {payError ? (
            <Text style={styles.payError} accessibilityRole="alert">
              {payError}
            </Text>
          ) : null}
          <Button
            title={`Pay ${formatNaira(subtotal + SHIPPING_FEE)} with Paystack`}
            onPress={pay}
            loading={paying}
            icon={<Ionicons name="lock-closed" size={16} color={colors.white} />}
          />
          <Text style={styles.secure}>Payments are processed securely by Paystack. Prices are checked again on our server.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" disabled={paying}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>{phase.kind === 'result' && phase.result.state === 'paid' ? 'Order confirmed' : 'Checkout'}</Text>
        <View style={{ width: 26 }} />
      </View>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  section: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: 2 },
  fieldError: { marginTop: -6, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger },
  card: { marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16, gap: 8 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  sumName: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  sumLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted },
  sumValue: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  total: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  payError: { fontFamily: fonts.bodyMedium, fontSize: 14, color: '#B91C1C', backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, overflow: 'hidden' },
  secure: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.inkFaint, textAlign: 'center' },
  successIcon: { alignSelf: 'center', width: 68, height: 68, borderRadius: 34, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  thanks: { fontFamily: fonts.display, fontSize: 36, color: colors.ink, textAlign: 'center' },
  centerText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkMuted, textAlign: 'center' },
  bold: { fontFamily: fonts.bodyBold, color: colors.ink },
  emailNote: { alignSelf: 'center', fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, backgroundColor: colors.pinkSoft, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, overflow: 'hidden', textAlign: 'center' },
});
