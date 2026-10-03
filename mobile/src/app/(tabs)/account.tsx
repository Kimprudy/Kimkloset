import { SafeAreaView } from 'react-native-safe-area-context';

import StateView from '@/components/StateView';
import { colors } from '@/lib/theme';

// Placeholder: built in Step 5.
export default function AccountScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <StateView kind="empty" icon="person-outline" title="Your account" message="Coming soon." />
    </SafeAreaView>
  );
}
