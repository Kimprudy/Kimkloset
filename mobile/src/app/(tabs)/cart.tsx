import { SafeAreaView } from 'react-native-safe-area-context';

import StateView from '@/components/StateView';
import { colors } from '@/lib/theme';

// Placeholder: built in Step 7.
export default function CartScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <StateView kind="empty" icon="bag-handle-outline" title="Your cart" message="Coming soon." />
    </SafeAreaView>
  );
}
