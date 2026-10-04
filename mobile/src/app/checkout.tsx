import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import StateView from '@/components/StateView';
import { colors } from '@/lib/theme';

// Placeholder: the delivery form and Paystack payment are built in Step 8.
export default function CheckoutScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <StateView
        kind="empty"
        icon="card-outline"
        title="Checkout"
        message="Coming in the next step."
        actionLabel="Back to cart"
        onAction={() => (router.canGoBack() ? router.back() : router.replace('/cart'))}
      />
    </SafeAreaView>
  );
}
