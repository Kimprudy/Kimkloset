import { useCallback, useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StateView from '@/components/StateView';
import { api } from '@/lib/api';
import { API_URL, formatNaira } from '@/lib/config';
import { colors, fonts } from '@/lib/theme';
import type { Product } from '@/lib/types';

// Step 4: proves the app can reach the shared API. The real shop grid comes in Step 6.
export default function ShopScreen() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(() => {
    api<{ products: Product[] }>('/api/products')
      .then(({ products }) => setProducts(products))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load products.'));
  }, []);

  useEffect(fetchProducts, [fetchProducts]);

  const retry = () => {
    setError(null);
    setProducts(null);
    fetchProducts();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Image source={require('@/assets/images/wordmark.png')} style={styles.wordmark} contentFit="contain" />
        <Text style={styles.tagline}>Online Fashion Store</Text>
      </View>

      {error ? (
        <StateView kind="error" title="Couldn't reach the shop" message={error} actionLabel="Try again" onAction={retry} />
      ) : !products ? (
        <StateView kind="loading" message="Loading the collection…" />
      ) : products.length === 0 ? (
        <StateView kind="empty" title="No pieces yet" message="New arrivals are coming soon." />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <View style={styles.okBox}>
            <Text style={styles.okTitle}>✓ Connected</Text>
            <Text style={styles.okText}>
              {products.length} products loaded from {API_URL.replace('https://', '')}/api/products
            </Text>
          </View>
          {products.map((p) => (
            <View key={p.id} style={styles.row}>
              <Text style={styles.name} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.price}>{formatNaira(p.price)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  wordmark: { width: 170, height: 24 },
  tagline: { marginTop: 4, fontFamily: fonts.body, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.inkFaint },
  list: { padding: 16, gap: 8 },
  okBox: { backgroundColor: colors.successSoft, borderRadius: 16, padding: 14, marginBottom: 8 },
  okTitle: { fontFamily: fonts.bodyBold, color: colors.success, fontSize: 15 },
  okText: { fontFamily: fonts.body, color: colors.success, fontSize: 13, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  name: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  price: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
});
