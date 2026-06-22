import { Button, Host, Image, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundColor, frame, padding } from '@expo/ui/swift-ui/modifiers';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

// Full-screen QR scanner. The live camera is expo-camera's `CameraView` (a native
// RN view); the no-permission state is native @expo/ui, and a clean reticle +
// cancel overlay sits over the camera. Emits the scanned string once.
export function ScanModal({
  visible,
  onClose,
  onScanned,
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
}) {
  const { palette } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  useEffect(() => {
    if (visible) {
      handled.current = false;
      if (permission && !permission.granted) requestPermission();
    }
  }, [visible, permission, requestPermission]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={styles.fill}>
        {permission?.granted ? (
          <>
            <CameraView
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => {
                if (handled.current) return;
                handled.current = true;
                onScanned(data);
              }}
              style={styles.fill}
            />

            {/* Reticle + chrome over the live camera */}
            <SafeAreaView style={styles.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
              <RNText style={styles.title}>Scan clinic QR</RNText>
              <RNText style={styles.subtitle}>
                Point your camera at the QR shown on the clinic screen.
              </RNText>

              <View style={styles.reticleWrap} pointerEvents="none">
                <View style={styles.reticle} />
              </View>

              <Pressable onPress={onClose} style={styles.cancelBtn}>
                <RNText style={styles.cancelText}>Cancel</RNText>
              </Pressable>
            </SafeAreaView>
          </>
        ) : (
          <SafeAreaView style={[styles.fill, styles.permFill, { backgroundColor: palette.bg }]}>
            <Host style={styles.fill}>
              <VStack spacing={16} modifiers={[padding({ all: 32 }), frame({ maxWidth: Infinity, maxHeight: Infinity })]}>
                <Image systemName="qrcode.viewfinder" size={56} color={palette.accent} />
                <Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundColor(palette.text)]}>
                  Camera access needed
                </Text>
                <Text modifiers={[font({ size: 15 }), foregroundColor(palette.textDim)]}>
                  temetro uses the camera to scan a clinic's QR code so you can share your record.
                </Text>
                <Button label="Allow camera" systemImage="camera.fill" onPress={() => requestPermission()} />
                <Button label="Cancel" role="cancel" onPress={onClose} />
              </VStack>
            </Host>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

const RETICLE = 232;

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  permFill: { alignItems: 'stretch', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', paddingTop: 24, paddingBottom: 24 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 6,
  },
  reticleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  reticle: {
    width: RETICLE,
    height: RETICLE,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cancelBtn: {
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  cancelText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
