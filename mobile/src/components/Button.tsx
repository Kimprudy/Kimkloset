import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from '@/lib/theme';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'pink';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function Button({ title, onPress, variant = 'primary', loading, disabled, icon, style }: Props) {
  const isOff = disabled || loading;
  const dark = variant !== 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={isOff}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isOff, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && { backgroundColor: colors.ink },
        variant === 'pink' && { backgroundColor: colors.pinkDeep },
        variant === 'outline' && styles.outline,
        (pressed || isOff) && { opacity: isOff ? 0.5 : 0.85 },
        style,
      ]}>
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={dark ? colors.white : colors.ink} /> : icon}
        <Text style={[styles.text, { color: dark ? colors.white : colors.ink }]}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 999, paddingVertical: 15, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  outline: { borderWidth: 1, borderColor: 'rgba(17,17,17,0.15)', backgroundColor: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { fontFamily: fonts.bodyBold, fontSize: 15 },
});
