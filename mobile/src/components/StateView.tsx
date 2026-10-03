import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

type Props = {
  /** loading shows a spinner; error/empty show an icon, a title and a message */
  kind: 'loading' | 'error' | 'empty';
  title?: string;
  message?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  actionLabel?: string;
  onAction?: () => void;
};

/** The loading / empty / error state every screen uses. */
export default function StateView({ kind, title, message, icon, actionLabel, onAction }: Props) {
  if (kind === 'loading') {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator size="large" color={colors.pinkDeep} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    );
  }

  const isError = kind === 'error';
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconCircle, isError && { backgroundColor: colors.dangerSoft }]}>
        <Ionicons
          name={icon ?? (isError ? 'cloud-offline-outline' : 'sparkles-outline')}
          size={26}
          color={isError ? colors.danger : colors.pinkDeep}
        />
      </View>
      <Text style={styles.title}>{title ?? (isError ? 'Something went wrong' : 'Nothing here yet')}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.pinkLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink, textAlign: 'center' },
  message: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkMuted, textAlign: 'center' },
  button: { marginTop: 10, backgroundColor: colors.ink, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 999 },
  buttonText: { fontFamily: fonts.bodyBold, color: colors.white, fontSize: 15 },
});
