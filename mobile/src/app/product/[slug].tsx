import { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import StateView from '@/components/StateView';
import StockBadge from '@/components/StockBadge';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { formatNaira, imageUrl, MAX_QTY } from '@/lib/config';
import { setPendingAdd } from '@/lib/pending-add';
import { cachedProduct, fetchProducts } from '@/lib/products';
import { colors, fonts } from '@/lib/theme';
import type { Product } from '@/lib/types';

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { items, add } = useCart();

  const [product, setProduct] = useState<Product | null>(() => cachedProduct(slug));
  const [status, setStatus] = useState<'ready' | 'missing' | 'error'>('ready');
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  // Always fetch fresh so the stock shown is up to date
  useEffect(() => {
    fetchProducts()
      .then((list) => {
        const found = list.find((p) => p.slug === slug) ?? null;
        setProduct(found);
        setStatus(found ? 'ready' : 'missing');
      })
      .catch(() => setStatus((s) => (cachedProduct(slug) ? s : 'error')));
  }, [slug]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <BackButton onPress={back} />
        {status === 'missing' ? (
          <StateView kind="empty" icon="shirt-outline" title="Piece not found" message="It may have sold out or been removed." actionLabel="Back to shop" onAction={back} />
        ) : status === 'error' ? (
          <StateView kind="error" title="Couldn't load this piece" message="Check your connection and try again." actionLabel="Back to shop" onAction={back} />
        ) : (
          <StateView kind="loading" />
        )}
      </SafeAreaView>
    );
  }

  const soldOut = product.stock <= 0;
  const maxQty = Math.max(1, Math.min(MAX_QTY, product.stock));
  const quantity = Math.min(qty, maxQty);
  const chosenSize = product.sizes.length === 1 ? product.sizes[0] : size;
  const chosenColor = color ?? product.colors[0] ?? '';
  const inCart = (items ?? []).filter((i) => i.product_id === product.id).reduce((n, i) => n + i.quantity, 0);

  async function handleAdd() {
    if (!product) return;
    setMessage(null);
    if (product.sizes.length > 0 && !chosenSize) {
      setMessage({ kind: 'error', text: 'Please choose a size.' });
      return;
    }
    const item = { productId: product.id, size: chosenSize ?? '', color: chosenColor, quantity };

    if (!user) {
      // Guests can browse; adding needs an account. The sign-in screen adds this item afterwards.
      setPendingAdd({ ...item, name: product.name });
      router.push('/sign-in');
      return;
    }

    setAdding(true);
    try {
      await add(item);
      setMessage({ kind: 'success', text: `Added ${quantity} to your cart.` });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Could not add to cart. Please try again.' });
    } finally {
      setAdding(false);
    }
  }

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}>
        <View style={styles.imageWrap}>
          <Image
            source={imageUrl(product.image_url)}
            style={[styles.image, soldOut && { opacity: 0.5 }]}
            contentFit="cover"
            contentPosition={{ top: '30%', left: '50%' }}
            transition={200}
          />
          <View style={[styles.backFloat, { top: insets.top + 8 }]}>
            <BackButton onPress={back} floating />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatNaira(product.price)}</Text>
          <StockBadge stock={product.stock} style={{ marginTop: 10 }} />

          {product.description ? <Text style={styles.description}>{product.description}</Text> : null}

          {product.colors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>
                Colour: <Text style={styles.labelValue}>{chosenColor}</Text>
              </Text>
              {product.colors.length > 1 && (
                <View style={styles.chips}>
                  {product.colors.map((c) => (
                    <Chip key={c} label={c} selected={chosenColor === c} onPress={() => setColor(c)} />
                  ))}
                </View>
              )}
            </View>
          )}

          {product.sizes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>
                Size{chosenSize ? ': ' : ''}
                <Text style={styles.labelValue}>{chosenSize ?? ''}</Text>
              </Text>
              <View style={styles.chips}>
                {product.sizes.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    selected={chosenSize === s}
                    onPress={() => {
                      setSize(s);
                      setMessage(null);
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          {!soldOut && (
            <View style={styles.section}>
              <Text style={styles.label}>Quantity</Text>
              <View style={styles.stepper}>
                <StepButton icon="remove" disabled={quantity <= 1} onPress={() => setQty(quantity - 1)} label="Decrease quantity" />
                <Text style={styles.qty} accessibilityLabel={`Quantity ${quantity}`}>
                  {quantity}
                </Text>
                <StepButton icon="add" disabled={quantity >= maxQty} onPress={() => setQty(quantity + 1)} label="Increase quantity" />
              </View>
              {quantity >= maxQty && (
                <Text style={styles.hint}>
                  {product.stock < MAX_QTY ? `Only ${product.stock} available.` : `Up to ${MAX_QTY} per order.`}
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 12 + insets.bottom }]}>
        {message ? (
          <Text style={[styles.message, message.kind === 'error' ? styles.messageError : styles.messageOk]} accessibilityRole="alert">
            {message.text}
          </Text>
        ) : null}
        {inCart > 0 && (
          <Pressable onPress={() => router.navigate('/cart')} style={styles.inCart} accessibilityRole="link">
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.inCartText}>
              {inCart} in your cart · <Text style={styles.inCartLink}>View cart</Text>
            </Text>
          </Pressable>
        )}
        <Button
          title={soldOut ? 'Sold out' : `Add to Cart · ${formatNaira(product.price * quantity)}`}
          onPress={handleAdd}
          loading={adding}
          disabled={soldOut}
          icon={soldOut ? undefined : <Ionicons name="bag-add-outline" size={18} color={colors.white} />}
        />
      </View>
    </View>
  );
}

function BackButton({ onPress, floating }: { onPress: () => void; floating?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back" style={[styles.back, floating && styles.backFloating]}>
      <Ionicons name="chevron-back" size={22} color={colors.ink} />
    </Pressable>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={[styles.chip, selected && styles.chipActive]}>
      <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

function StepButton({ icon, onPress, disabled, label }: { icon: 'add' | 'remove'; onPress: () => void; disabled: boolean; label: string }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityLabel={label} hitSlop={6} style={[styles.step, disabled && { opacity: 0.3 }]}>
      <Ionicons name={icon} size={18} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  imageWrap: { aspectRatio: 3 / 4, backgroundColor: colors.pinkSoft },
  image: { width: '100%', height: '100%' },
  backFloat: { position: 'absolute', left: 16 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 12, marginTop: 4 },
  backFloating: { marginLeft: 0, marginTop: 0, backgroundColor: 'rgba(255,255,255,0.92)' },
  body: { padding: 20 },
  category: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.pinkDeep },
  name: { marginTop: 6, fontFamily: fonts.display, fontSize: 32, lineHeight: 36, color: colors.ink },
  price: { marginTop: 6, fontFamily: fonts.bodyBold, fontSize: 20, color: colors.ink },
  description: { marginTop: 16, fontFamily: fonts.body, fontSize: 15, lineHeight: 23, color: colors.inkMuted },
  section: { marginTop: 22, gap: 10 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.inkMuted },
  labelValue: { fontFamily: fonts.bodyBold, color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minWidth: 48, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(17,17,17,0.15)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  stepper: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(17,17,17,0.15)', borderRadius: 999 },
  step: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 32, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.inkFaint },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  message: { fontFamily: fonts.bodyMedium, fontSize: 14, borderRadius: 12, padding: 10, overflow: 'hidden' },
  messageError: { color: '#B91C1C', backgroundColor: '#FEF2F2' },
  messageOk: { color: colors.success, backgroundColor: colors.successSoft },
  inCart: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  inCartText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  inCartLink: { fontFamily: fonts.bodyBold, color: colors.pinkDeep, textDecorationLine: 'underline' },
});
