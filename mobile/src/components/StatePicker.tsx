import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NIGERIAN_STATES } from '@/lib/config';
import { colors, fonts } from '@/lib/theme';

/** Looks like a form field; opens a full list of the 36 states + FCT. */
export default function StatePicker({ value, onChange }: { value: string; onChange: (state: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>State</Text>
      <Pressable onPress={() => setOpen(true)} style={styles.field} accessibilityRole="button" accessibilityLabel={`State: ${value || 'not chosen'}`}>
        <Text style={[styles.value, !value && { color: colors.inkFaint }]}>{value || 'Choose your state'}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.inkMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.sheetTop}>
            <Text style={styles.sheetTitle}>Choose your state</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close" size={26} color={colors.ink} />
            </Pressable>
          </View>
          <FlatList
            data={NIGERIAN_STATES}
            keyExtractor={(s) => s}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                }}
                style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.pinkSoft }]}
                accessibilityRole="radio"
                accessibilityState={{ checked: item === value }}>
                <Text style={[styles.optionText, item === value && { fontFamily: fonts.bodyBold }]}>{item}</Text>
                {item === value ? <Ionicons name="checkmark" size={20} color={colors.pinkDeep} /> : null}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.inkMuted },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.15)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  value: { fontFamily: fonts.body, fontSize: 16, color: colors.ink },
  sheet: { flex: 1, backgroundColor: colors.white },
  sheetTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  optionText: { fontFamily: fonts.body, fontSize: 16, color: colors.ink },
});
