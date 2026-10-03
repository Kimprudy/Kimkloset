import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts } from '@/lib/theme';

type Props = TextInputProps & { label: string };

/** A labelled text input that matches the website's form style. */
const Field = forwardRef<TextInput, Props>(function Field({ label, style, ...props }, ref) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput ref={ref} placeholderTextColor={colors.inkFaint} style={[styles.input, style]} {...props} />
    </View>
  );
});

export default Field;

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkMuted },
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.15)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
});
