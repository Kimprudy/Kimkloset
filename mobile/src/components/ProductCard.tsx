import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import StockBadge from '@/components/StockBadge';
import { formatNaira, imageUrl } from '@/lib/config';
import { colors, fonts } from '@/lib/theme';
import type { Product } from '@/lib/types';

export default function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;
  return (
    <Link href={{ pathname: '/product/[slug]', params: { slug: product.slug } }} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} accessibilityLabel={`${product.name}, ${formatNaira(product.price)}`}>
        <View style={styles.imageWrap}>
          <Image
            source={imageUrl(product.image_url)}
            style={[styles.image, soldOut && { opacity: 0.5 }]}
            contentFit="cover"
            contentPosition={{ top: '30%', left: '50%' }}
            transition={200}
            recyclingKey={product.id}
          />
          <Text style={styles.category}>{product.category}</Text>
          <StockBadge stock={product.stock} style={styles.badge} />
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatNaira(product.price)}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  imageWrap: { aspectRatio: 3 / 4, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.pinkSoft },
  image: { width: '100%', height: '100%' },
  category: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  badge: { position: 'absolute', bottom: 8, left: 8 },
  name: { marginTop: 8, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 19, color: colors.ink },
  price: { marginTop: 2, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
});
