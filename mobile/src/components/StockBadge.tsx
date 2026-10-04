import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { LOW_STOCK } from '@/lib/config';
import { colors, fonts } from '@/lib/theme';

/** "Sold out" / "Only X left" label, same rule as the website. Shows nothing when plenty is left. */
export default function StockBadge({ stock, style }: { stock: number; style?: StyleProp<TextStyle> }) {
  if (stock <= 0) return <Text style={[styles.badge, styles.soldOut, style]}>Sold out</Text>;
  if (stock <= LOW_STOCK) return <Text style={[styles.badge, styles.low, style]}>Only {stock} left</Text>;
  return null;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    overflow: 'hidden',
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  soldOut: { backgroundColor: colors.ink, color: colors.white },
  low: { backgroundColor: colors.pink, color: colors.ink },
});
