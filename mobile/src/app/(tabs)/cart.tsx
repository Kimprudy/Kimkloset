import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import StateView from '@/components/StateView';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { formatNaira, imageUrl, MAX_QTY, SHIPPING_FEE } from '@/lib/config';
import { colors, fonts } from '@/lib/theme';
import type { CartItem } from '@/lib/types';

export default function CartScreen() {
  const { user, ready } = useAuth();
  const { items, error, count, subtotal, updateQuantity, remove, refresh } = useCart();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function change(key: string, action: () => Promise<void>) {
    setBusyKey(key);
    try {
      await action();
    } catch (err) {
      Alert.alert('Could not update your cart', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusyKey(null);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    void refresh().finally(() => setRefreshing(false));
  };

  let content: React.ReactNode;
  if (!ready) {
    content = <StateView kind="loading" />;
  } else if (!user) {
    content = (
      <StateView
        kind="empty"
        icon="bag-handle-outline"
        title="Sign in to see your cart"
        message="Your cart is saved to your account, so it's the same on the website and the app."
        actionLabel="Sign in"
        onAction={() => router.push('/sign-in')}
      />
    );
  } else if (!items && error) {
    content = <StateView kind="error" title="Couldn't load your cart" message={error} actionLabel="Try again" onAction={() => void refresh()} />;
  } else if (!items) {
    content = <StateView kind="loading" message="Loading your cart…" />;
  } else if (items.length === 0) {
    content = (
      <StateView
        kind="empty"
        icon="bag-handle-outline"
        title="Your cart is empty"
        message="Find something you love in the shop."
        actionLabel="Start shopping"
        onAction={() => router.navigate('/')}
      />
    );
  } else {
    content = (
      <>
        <FlatList
          data={items}
          keyExtractor={(i) => i.key}
          renderItem={({ item }) => (
            <CartRow
              item={item}
              busy={busyKey === item.key}
              onChange={(q) => change(item.key, () => updateQuantity(item.key, q))}
              onRemove={() => change(item.key, () => remove(item.key))}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pinkDeep} />}
        />
        <View style={styles.summary}>
          <Row label={`Subtotal (${count} ${count === 1 ? 'item' : 'items'})`} value={formatNaira(subtotal)} />
          <Row label="Delivery (flat, anywhere in Nigeria)" value={formatNaira(SHIPPING_FEE)} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatNaira(subtotal + SHIPPING_FEE)}</Text>
          </View>
          <Button
            title="Checkout"
            onPress={() => router.push('/checkout')}
            disabled={busyKey !== null}
            icon={<Ionicons name="lock-closed-outline" size={17} color={colors.white} />}
          />
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your cart</Text>
        {user && items && items.length > 0 ? <Text style={styles.sync}>Synced with kimkloset.vercel.app</Text> : null}
      </View>
      {content}
    </SafeAreaView>
  );
}

function CartRow({ item, busy, onChange, onRemove }: { item: CartItem; busy: boolean; onChange: (q: number) => void; onRemove: () => void }) {
  const max = Math.max(1, Math.min(MAX_QTY, item.stock ?? MAX_QTY));
  const details = [item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ');
  return (
    <View style={[styles.row, busy && { opacity: 0.5 }]}>
      <Link href={{ pathname: '/product/[slug]', params: { slug: item.slug } }} asChild>
        <Pressable style={styles.thumbWrap} accessibilityLabel={`Open ${item.name}`}>
          <Image source={imageUrl(item.image_url)} style={styles.thumb} contentFit="cover" contentPosition="top" />
        </Pressable>
      </Link>
      <View style={styles.info}>
        <View style={styles.topLine}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <Pressable onPress={onRemove} disabled={busy} hitSlop={10} accessibilityLabel={`Remove ${item.name}`}>
            <Ionicons name="trash-outline" size={19} color={colors.inkFaint} />
          </Pressable>
        </View>
        {details ? <Text style={styles.details}>{details}</Text> : null}
        <Text style={styles.unit}>{formatNaira(item.price)} each</Text>
        <View style={styles.bottomLine}>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => onChange(item.quantity - 1)}
              disabled={busy}
              hitSlop={6}
              style={styles.step}
              accessibilityLabel={item.quantity <= 1 ? `Remove ${item.name}` : 'Decrease quantity'}>
              <Ionicons name={item.quantity <= 1 ? 'trash-outline' : 'remove'} size={16} color={colors.ink} />
            </Pressable>
            <Text style={styles.qty}>{item.quantity}</Text>
            <Pressable
              onPress={() => onChange(item.quantity + 1)}
              disabled={busy || item.quantity >= max}
              hitSlop={6}
              style={[styles.step, item.quantity >= max && { opacity: 0.3 }]}
              accessibilityLabel="Increase quantity">
              <Ionicons name="add" size={16} color={colors.ink} />
            </Pressable>
          </View>
          <Text style={styles.lineTotal}>{formatNaira(item.price * item.quantity)}</Text>
        </View>
        {item.quantity >= max && item.stock !== undefined && item.stock < MAX_QTY ? (
          <Text style={styles.hint}>Only {item.stock} available</Text>
        ) : null}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sumRow}>
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={styles.sumValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: fonts.display, fontSize: 34, color: colors.ink },
  sync: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint },
  list: { padding: 20 },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  row: { flexDirection: 'row', gap: 14 },
  thumbWrap: { width: 84, aspectRatio: 9 / 16, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.pinkSoft },
  thumb: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  info: { flex: 1, gap: 4 },
  topLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 20, color: colors.ink },
  details: { fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted },
  unit: { fontFamily: fonts.body, fontSize: 13, color: colors.inkFaint },
  bottomLine: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(17,17,17,0.15)', borderRadius: 999 },
  step: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 24, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  lineTotal: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.pinkDeep },
  summary: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  sumLabel: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted },
  sumValue: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4, marginBottom: 8 },
  totalLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  totalValue: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
});
