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
    // The outer View sets the card width (half the grid). Link's tap wrapper doesn't keep size styles,
    // and without a fixed width the photo would draw at its full 800px size.
    <View style={styles.card}>
      <Link href={{ pathname: '/product/[slug]', params: { slug: product.slug } }} asChild>
        <Pressable style={({ pressed }) => pressed && { opacity: 0.85 }} accessibilityLabel={`${product.name}, ${formatNaira(product.price)}`}>
          <View style={styles.imageWrap}>
            <Image
              source={imageUrl(product.image_url)}
              style={[styles.image, soldOut && { opacity: 0.5 }]}
              contentFit="cover"
              contentPosition="top"
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  // Product photos are tall (about 9:16), so the card matches them and shows the whole outfit
  imageWrap: { width: '100%', aspectRatio: 9 / 16, borderRadius: 14, overflow: 'hidden', backgroundColor: colors.pinkSoft },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
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
