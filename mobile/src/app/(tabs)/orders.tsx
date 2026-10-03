import { SafeAreaView } from 'react-native-safe-area-context';

import StateView from '@/components/StateView';
import { colors } from '@/lib/theme';

// Placeholder: built in Step 8.
export default function OrdersScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <StateView kind="empty" icon="receipt-outline" title="Your orders" message="Coming soon." />
    </SafeAreaView>
  );
}
