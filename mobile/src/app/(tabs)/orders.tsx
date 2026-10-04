import { useCallback, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OrderDetails from '@/components/OrderDetails';
import OrderStatusBadge from '@/components/OrderStatusBadge';
import StateView from '@/components/StateView';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatNaira } from '@/lib/config';
import { colors, fonts } from '@/lib/theme';
import type { Order } from '@/lib/types';

type Loaded = { userId: string; orders: Order[] | null; error: string | null };

export default function OrdersScreen() {
  const { user, ready } = useAuth();
  const userId = user?.id;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(
    (uid: string) =>
      api<{ orders: Order[] }>('/api/orders')
        .then(({ orders }) => setLoaded({ userId: uid, orders, error: null }))
        .catch((err) =>
          setLoaded((l) => ({
            userId: uid,
            orders: l?.userId === uid ? l.orders : null,
            error: err instanceof Error ? err.message : 'Could not load your orders.',
          }))
        ),
    []
  );

  // Reload every time the tab is opened, so orders placed on the website (or just now) show up
  useFocusEffect(
    useCallback(() => {
      if (userId) void load(userId);
    }, [userId, load])
  );

  const onRefresh = () => {
    if (!userId) return;
    setRefreshing(true);
    void load(userId).finally(() => setRefreshing(false));
  };

  const mine = loaded && loaded.userId === userId ? loaded : null;

  let content: React.ReactNode;
  if (!ready) {
    content = <StateView kind="loading" />;
  } else if (!userId) {
    content = (
      <StateView
        kind="empty"
        icon="receipt-outline"
        title="Sign in to see your orders"
        message="Orders from the website and the app appear here."
        actionLabel="Sign in"
        onAction={() => router.push('/sign-in')}
      />
    );
  } else if (!mine?.orders && mine?.error) {
    content = <StateView kind="error" title="Couldn't load your orders" message={mine.error} actionLabel="Try again" onAction={() => void load(userId)} />;
  } else if (!mine?.orders) {
    content = <StateView kind="loading" message="Loading your orders…" />;
  } else if (mine.orders.length === 0) {
    content = (
      <StateView
        kind="empty"
        icon="receipt-outline"
        title="No orders yet"
        message="When you place an order, it will show up here."
        actionLabel="Start shopping"
        onAction={() => router.navigate('/')}
      />
    );
  } else {
    content = (
      <FlatList
        data={mine.orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pinkDeep} />}
        renderItem={({ item: order }) => {
          const expanded = open === order.id;
          const pieces = order.order_items.reduce((n, i) => n + i.quantity, 0);
          return (
            <View style={styles.card}>
              <Pressable
                onPress={() => setOpen(expanded ? null : order.id)}
                style={styles.cardTop}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel={`Order ${order.order_number}`}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.number}>{order.order_number}</Text>
                  <Text style={styles.meta}>
                    {formatDate(order.created_at)} · {pieces} {pieces === 1 ? 'piece' : 'pieces'}
                  </Text>
                  <OrderStatusBadge status={order.status} />
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.total}>{formatNaira(order.total)}</Text>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.inkMuted} />
                </View>
              </Pressable>
              {expanded ? (
                <View style={styles.details}>
                  <OrderDetails order={order} />
                </View>
              ) : null}
            </View>
          );
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My orders</Text>
        {userId ? <Text style={styles.sub}>Orders from the website and the app</Text> : null}
      </View>
      {content}
    </SafeAreaView>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontFamily: fonts.display, fontSize: 34, color: colors.ink },
  sub: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint },
  list: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', gap: 12, padding: 16 },
  number: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted },
  total: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  details: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border },
});
