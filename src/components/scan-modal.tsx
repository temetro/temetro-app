import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/lib/theme';

// Full-screen QR scanner (plain React Native + expo-camera, rendered outside any
// @expo/ui Host). Emits the scanned string once, then the caller closes it.
export function ScanModal({
  visible,
  onClose,
  onScanned,
}: {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
}) {
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
          <CameraView
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (handled.current) return;
              handled.current = true;
              onScanned(data);
            }}
            style={styles.fill}
          />
        ) : (
          <View style={[styles.fill, styles.center]}>
            <Text style={styles.permText}>
              Camera access is needed to scan a clinic QR code.
            </Text>
            <Pressable onPress={() => requestPermission()} style={styles.permBtn}>
              <Text style={styles.permBtnText}>Allow camera</Text>
            </Pressable>
          </View>
        )}

        <SafeAreaView style={styles.overlay} edges={['top']}>
          <Text style={styles.title}>Scan clinic QR</Text>
        </SafeAreaView>

        <SafeAreaView style={styles.footer} edges={['bottom']}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancel</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 12 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: 16 },
  closeBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.6)' },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  permText: { color: '#fff', textAlign: 'center', fontSize: 15 },
  permBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: palette.accent },
  permBtnText: { color: '#fff', fontWeight: '600' },
});
