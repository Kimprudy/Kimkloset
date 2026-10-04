import { StyleSheet, Text } from 'react-native';

import { colors, fonts } from '@/lib/theme';
import type { OrderStatus } from '@/lib/types';

// Same labels as the website's orders page
const STATUS: Record<OrderStatus, { label: string; color: string; background: string }> = {
  paid: { label: 'Paid', color: colors.success, background: colors.successSoft },
  pending: { label: 'Awaiting payment', color: colors.warning, background: colors.warningSoft },
  failed: { label: 'Payment failed', color: colors.danger, background: colors.dangerSoft },
  cancelled: { label: 'Cancelled', color: colors.inkMuted, background: 'rgba(17,17,17,0.08)' },
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS[status] ?? STATUS.pending;
  return <Text style={[styles.badge, { color: s.color, backgroundColor: s.background }]}>{s.label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
