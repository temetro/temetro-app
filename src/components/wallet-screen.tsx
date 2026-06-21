import { Button, Column, Host, List, ListItem, Row, Spacer, Text } from '@expo/ui';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScanModal } from '@/components/scan-modal';
import { shareModeLabel, shortWallet } from '@/lib/format';
import { parsePairingUri } from '@/lib/relay';
import { palette } from '@/lib/theme';
import { useWallet } from '@/lib/wallet-context';

// Universal fallback (web / unsupported platforms). iOS and Android use the
// platform-specific SwiftUI / Jetpack Compose trees (wallet-screen.ios/android).
const STATUS: Record<string, string> = {
  connecting: 'Connecting…',
  connected: 'Connecting…',
  authenticated: 'Online',
  'auth-failed': 'Auth failed',
  disconnected: 'Offline',
};

export default function WalletScreen() {
  const { identity, record, status, pendingRequest, approve, deny, respondToPairing } =
    useWallet();
  const [scanOpen, setScanOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!identity || !record) {
    return (
      <SafeAreaView style={styles.center}>
        <Host matchContents>
          <Text>Setting up your wallet…</Text>
        </Host>
      </SafeAreaView>
    );
  }

  const onScanned = async (data: string) => {
    setScanOpen(false);
    const pairing = parsePairingUri(data);
    if (!pairing) return;
    const ok = await respondToPairing(pairing);
    Alert.alert(ok ? 'Record shared' : "Couldn't share", '');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Host matchContents>
          <Column spacing={16}>
            <Text textStyle={{ fontSize: 26, fontWeight: '700' }}>My wallet</Text>
            <Column
              spacing={8}
              style={{ backgroundColor: palette.accent, borderRadius: 20, padding: 16 }}
            >
              <Text textStyle={{ fontSize: 12, color: '#dceaff' }}>
                {`Wallet · ${STATUS[status] ?? status}`}
              </Text>
              <Text textStyle={{ fontSize: 14, color: '#ffffff' }}>
                {shortWallet(identity.walletNumber)}
              </Text>
              <Row spacing={10}>
                <Button
                  variant="outlined"
                  label={copied ? 'Copied' : 'Copy'}
                  onPress={async () => {
                    await Clipboard.setStringAsync(identity.walletNumber);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                />
                <Button variant="outlined" label="Scan to connect" onPress={() => setScanOpen(true)} />
              </Row>
            </Column>

            {pendingRequest ? (
              <Column
                spacing={8}
                style={{ backgroundColor: palette.cardAlt, borderRadius: 16, padding: 16 }}
              >
                <Text textStyle={{ fontSize: 16, fontWeight: '600' }}>Share request</Text>
                <Text>{`${pendingRequest.clinicName} wants to import your record.`}</Text>
                <Text textStyle={{ fontSize: 13, color: palette.textDim }}>
                  {shareModeLabel(pendingRequest.mode, pendingRequest.durationHours)}
                </Text>
                <Row spacing={10}>
                  <Button variant="filled" label="Approve" onPress={() => approve(pendingRequest)} />
                  <Button variant="outlined" label="Deny" onPress={() => deny(pendingRequest)} />
                </Row>
              </Column>
            ) : null}

            <Text textStyle={{ fontSize: 20, fontWeight: '700' }}>{record.name}</Text>
            <List>
              <ListItem supportingText={record.allergies.map((a) => a.substance).join(', ') || 'None'}>
                Allergies
              </ListItem>
              <ListItem supportingText={record.medications.map((m) => m.name).join(', ') || 'None'}>
                Medications
              </ListItem>
              <ListItem supportingText={record.problems.map((p) => p.label).join(', ') || 'None'}>
                Problems
              </ListItem>
              <ListItem supportingText={record.encounters[0]?.summary ?? '—'}>Last visit</ListItem>
            </List>
            <Spacer />
          </Column>
        </Host>
        <View style={styles.footer} />
      </ScrollView>
      <ScanModal onClose={() => setScanOpen(false)} onScanned={onScanned} visible={scanOpen} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  footer: { height: 72 },
});
