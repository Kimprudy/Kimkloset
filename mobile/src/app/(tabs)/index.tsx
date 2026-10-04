import { useCallback, useEffect, useMemo, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ProductCard from '@/components/ProductCard';
import StateView from '@/components/StateView';
import { CATEGORIES } from '@/lib/config';
import { cachedProducts, fetchProducts } from '@/lib/products';
import { colors, fonts } from '@/lib/theme';
import type { Product } from '@/lib/types';

export default function ShopScreen() {
  const [products, setProducts] = useState<Product[] | null>(cachedProducts);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');

  const load = useCallback(
    () =>
      fetchProducts()
        .then((p) => {
          setProducts(p);
          setError(null);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Could not load products.')),
    []
  );

  useEffect(() => {
    void load();
  }, [load]);

  const retry = () => {
    setError(null);
    setProducts(null);
    void load();
  };

  const onRefresh = () => {
    setRefreshing(true);
    void load().finally(() => setRefreshing(false));
  };

  // Known categories first (only if they have products), then any new category added in Supabase
  const tabs = useMemo(() => {
    const list = products ?? [];
    return ['All', ...new Set([...CATEGORIES.filter((c) => list.some((p) => p.category === c)), ...list.map((p) => p.category)])];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter(
      (p) =>
        (category === 'All' || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    );
  }, [products, category, query]);

  // Odd number of pieces: add an empty cell so the last card stays half width
  const grid: (Product | null)[] = filtered.length % 2 ? [...filtered, null] : filtered;

  const header = (
    <View style={styles.controls}>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.inkFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search dresses, sets, tops…"
          placeholderTextColor={colors.inkFaint}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {tabs.map((t) => (
          <Pressable
            key={t}
            onPress={() => setCategory(t)}
            accessibilityRole="button"
            accessibilityState={{ selected: category === t }}
            style={[styles.chip, category === t && styles.chipActive]}>
            <Text style={[styles.chipText, category === t && { color: colors.white }]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.count}>
        {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Image source={require('@/assets/images/wordmark.png')} style={styles.wordmark} contentFit="contain" />
        <Text style={styles.tagline}>Online Fashion Store</Text>
      </View>

      {error && !products ? (
        <StateView kind="error" title="Couldn't reach the shop" message={error} actionLabel="Try again" onAction={retry} />
      ) : !products ? (
        <StateView kind="loading" message="Loading the collection…" />
      ) : (
        <FlatList
          data={grid}
          keyExtractor={(p) => p?.id ?? 'spacer'}
          numColumns={2}
          renderItem={({ item }) => (item ? <ProductCard product={item} /> : <View style={{ flex: 1 }} />)}
          ListHeaderComponent={header}
          ListEmptyComponent={
            products.length === 0 ? (
              <StateView kind="empty" title="No pieces yet" message="New arrivals are coming soon." />
            ) : (
              <StateView
                kind="empty"
                icon="search-outline"
                title="No matches"
                message="Try a different word or category."
                actionLabel="Clear filters"
                onAction={() => {
                  setQuery('');
                  setCategory('All');
                }}
              />
            )
          }
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pinkDeep} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  wordmark: { width: 170, height: 24 },
  tagline: { marginTop: 4, fontFamily: fonts.body, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.inkFaint },
  controls: { gap: 12, paddingTop: 14, paddingBottom: 4 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
  chips: { gap: 8, paddingRight: 16 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  chipActive: { backgroundColor: colors.pinkDeep, borderColor: colors.pinkDeep },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  count: { fontFamily: fonts.body, fontSize: 12, color: colors.inkFaint },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 20, flexGrow: 1 },
  row: { gap: 12 },
});
