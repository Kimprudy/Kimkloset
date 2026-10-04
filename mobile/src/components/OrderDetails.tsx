import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { formatNaira, imageUrl } from '@/lib/config';
import { colors, fonts } from '@/lib/theme';
import type { Order } from '@/lib/types';

/** Items, totals and delivery address of one order (used on Orders and after paying). */
export default function OrderDetails({ order }: { order: Order }) {
  return (
    <View style={styles.wrap}>
      {order.order_items.map((item) => (
        <View key={item.id} style={styles.item}>
          {item.product_image ? (
            <View style={styles.thumbWrap}>
              <Image source={imageUrl(item.product_image)} style={styles.thumb} contentFit="cover" contentPosition="top" />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.product_name}</Text>
            <Text style={styles.meta}>{[item.size && `Size ${item.size}`, item.color, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}</Text>
          </View>
          <Text style={styles.amount}>{formatNaira(item.line_total)}</Text>
        </View>
      ))}

      <View style={styles.totals}>
        <Line label="Subtotal" value={formatNaira(order.subtotal)} />
        <Line label="Delivery" value={formatNaira(order.shipping_fee)} />
        <Line label="Total" value={formatNaira(order.total)} bold />
      </View>

      <View style={styles.address}>
        <Text style={styles.addressLabel}>Delivering to</Text>
        <Text style={styles.addressText}>
          {order.customer_name} · {order.customer_phone}
          {'\n'}
          {order.shipping_address}, {order.city}, {order.state}
        </Text>
      </View>
    </View>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.lineValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbWrap: { width: 46, aspectRatio: 9 / 16, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.pinkSoft },
  thumb: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  name: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  meta: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted },
  amount: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  totals: { gap: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  line: { flexDirection: 'row', justifyContent: 'space-between' },
  lineLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.inkMuted },
  lineValue: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  bold: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  address: { backgroundColor: colors.pinkSoft, borderRadius: 14, padding: 14, gap: 4 },
  addressLabel: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.inkFaint },
  addressText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.ink },
});
