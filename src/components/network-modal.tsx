import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette } from '@/lib/theme';

// Small RN sheet to view/change the relay server URL (MetaMask-style "network").
export function NetworkModal({
  visible,
  current,
  onClose,
  onSave,
}: {
  visible: boolean;
  current: string;
  onClose: () => void;
  onSave: (url: string) => void;
}) {
  const [url, setUrl] = useState(current);
  useEffect(() => {
    if (visible) setUrl(current);
  }, [visible, current]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Relay server</Text>
          <Text style={styles.hint}>
            The clinic server your wallet connects to. Keep the default unless a clinic gives you a
            different address.
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={setUrl}
            placeholder="http://…"
            placeholderTextColor={palette.textDim}
            style={styles.input}
            value={url}
          />
          <View style={styles.row}>
            <Pressable onPress={onClose} style={[styles.btn, styles.cancel]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={() => onSave(url)} style={[styles.btn, styles.save]}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: palette.card, padding: 20, paddingBottom: 36, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 },
  title: { color: palette.text, fontSize: 18, fontWeight: '700' },
  hint: { color: palette.textDim, fontSize: 13 },
  input: { backgroundColor: palette.cardAlt, color: palette.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  row: { flexDirection: 'row', gap: 12, marginTop: 4 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  cancel: { backgroundColor: palette.cardAlt },
  cancelText: { color: palette.text, fontWeight: '600' },
  save: { backgroundColor: palette.accent },
  saveText: { color: '#fff', fontWeight: '700' },
});
