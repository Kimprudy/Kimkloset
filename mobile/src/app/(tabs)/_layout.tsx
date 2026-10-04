import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useCart } from '@/lib/cart';
import { colors, fonts } from '@/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color, size }: { name: IconName; color: ColorValue; size: number }) {
  return <Ionicons name={name} size={size} color={color as string} />;
}

export default function TabLayout() {
  const { count } = useCart();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.pinkDeep,
        tabBarInactiveTintColor: colors.inkFaint,
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Shop', tabBarIcon: (p) => <TabIcon name="storefront-outline" {...p} /> }} />
      <Tabs.Screen name="cart" options={{
          title: 'Cart',
          tabBarIcon: (p) => <TabIcon name="bag-handle-outline" {...p} />,
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.pinkDeep, fontFamily: fonts.bodyBold, fontSize: 11 },
        }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: (p) => <TabIcon name="receipt-outline" {...p} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: (p) => <TabIcon name="person-outline" {...p} /> }} />
    </Tabs>
  );
}
