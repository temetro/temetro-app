import {
  Button,
  Host,
  HStack,
  Spacer,
  Text,
  TextField,
  useNativeState,
  VStack,
} from '@expo/ui/swift-ui';
import {
  background,
  cornerRadius,
  font,
  foregroundColor,
  frame,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { useEffect } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/lib/theme';

// Bound the SwiftUI content width so Text wraps (Host matchContents otherwise
// sizes to intrinsic width and the hint overflows the sheet). Sheet padding 20×2.
const CONTENT_WIDTH = Dimensions.get('window').width - 40;

// Bottom-sheet to view/change the relay server URL. The sheet content is native
// @expo/ui (SwiftUI) — including the TextField — presented inside an RN Modal.
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
  const { palette } = useTheme();
  const text = useNativeState(current);

  useEffect(() => {
    if (visible) text.set(current);
  }, [visible, current, text]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        {/* Stop taps inside the sheet from dismissing it. */}
        <Pressable onPress={() => {}} style={[styles.sheet, { backgroundColor: palette.card }]}>
          <View style={styles.grabber} />
          <Host matchContents>
            <VStack alignment="leading" spacing={14} modifiers={[frame({ width: CONTENT_WIDTH })]}>
              <Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundColor(palette.text)]}>
                Relay server
              </Text>
              <Text modifiers={[font({ size: 13 }), foregroundColor(palette.textDim)]}>
                The clinic server your wallet connects to. Keep the default unless a clinic gives you a different address.
              </Text>
              <TextField
                autoFocus
                placeholder="http://…"
                text={text}
                modifiers={[
                  padding({ all: 13 }),
                  background(palette.cardAlt),
                  cornerRadius(12),
                  frame({ maxWidth: Infinity }),
                ]}
              />
              <HStack spacing={12} modifiers={[padding({ top: 2 }), frame({ maxWidth: Infinity })]}>
                <Button label="Cancel" role="cancel" onPress={onClose} />
                <Spacer />
                <Button label="Save" systemImage="checkmark" onPress={() => onSave(text.get())} />
              </HStack>
            </VStack>
          </Host>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    padding: 20,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(127,127,127,0.4)',
    marginBottom: 14,
  },
});
