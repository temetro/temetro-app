import { Box, Button, Card, Column, Host, Row, Text } from '@expo/ui/jetpack-compose';
import {
  background,
  clip,
  fillMaxWidth,
  paddingAll,
  size,
} from '@expo/ui/jetpack-compose/modifiers';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScanModal } from '@/components/scan-modal';
import { shareModeLabel, shortWallet } from '@/lib/format';
import { identiconColors } from '@/lib/identicon';
import { parsePairingUri } from '@/lib/relay';
import { palette } from '@/lib/theme';
import { useWallet } from '@/lib/wallet-context';

const STATUS = {
  connecting: 'Connecting…',
  connected: 'Connecting…',
  authenticated: 'Online',
  'auth-failed': 'Auth failed',
  disconnected: 'Offline',
} as const;

export default function WalletScreenAndroid() {
  const { identity, record, status, pendingRequest, approve, deny, respondToPairing } =
    useWallet();
  const [scanOpen, setScanOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!identity || !record) {
    return (
      <SafeAreaView style={styles.center}>
        <Host matchContents>
          <Text color={palette.textDim}>Setting up your wallet…</Text>
        </Host>
      </SafeAreaView>
    );
  }

  const colors = identiconColors(identity.publicKeyHex);

  const copy = async () => {
    await Clipboard.setStringAsync(identity.walletNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const onScanned = async (data: string) => {
    setScanOpen(false);
    const pairing = parsePairingUri(data);
    if (!pairing) {
      Alert.alert('Invalid code', "That QR isn't a temetro pairing code.");
      return;
    }
    const ok = await respondToPairing(pairing);
    Alert.alert(
      ok ? 'Record shared' : "Couldn't share",
      ok
        ? 'Your record was shared with the clinic.'
        : 'The clinic could not be reached. Try again.',
    );
  };

  const rows = [
    { label: 'Allergies', value: record.allergies.map((a) => a.substance).join(', ') || 'None' },
    { label: 'Medications', value: record.medications.map((m) => m.name).join(', ') || 'None' },
    { label: 'Problems', value: record.problems.map((p) => p.label).join(', ') || 'None' },
    { label: 'Labs', value: record.labs.map((l) => l.name).join(', ') || 'None' },
    { label: 'Last visit', value: record.encounters[0]?.summary ?? '—' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Host matchContents>
          <Column verticalArrangement={{ spacedBy: 16 }} modifiers={[fillMaxWidth()]}>
            {/* Account header */}
            <Card
              colors={{ containerColor: palette.accent, contentColor: '#ffffff' }}
              elevation={3}
              modifiers={[fillMaxWidth()]}
            >
              <Column verticalArrangement={{ spacedBy: 14 }} modifiers={[paddingAll(20)]}>
                <Row horizontalArrangement={{ spacedBy: 12 }} verticalAlignment="center">
                  <Box
                    contentAlignment="center"
                    modifiers={[size(42, 42), background(colors.from), clip({ type: 'circle' })]}
                  >
                    <Text color="#ffffff" style={{ fontSize: 15, fontWeight: 'bold' }}>
                      {record.initials}
                    </Text>
                  </Box>
                  <Column verticalArrangement={{ spacedBy: 2 }}>
                    <Text color="#ffffff" style={{ typography: 'titleMedium', fontWeight: 'bold' }}>
                      My wallet
                    </Text>
                    <Text color="#dceaff" style={{ typography: 'labelMedium' }}>
                      {STATUS[status]}
                    </Text>
                  </Column>
                </Row>
                <Text color="#eaf3ff" style={{ typography: 'bodySmall' }}>
                  {shortWallet(identity.walletNumber)}
                </Text>
                <Row horizontalArrangement={{ spacedBy: 10 }}>
                  <Button onClick={copy} colors={{ containerColor: '#ffffff', contentColor: palette.accent }}>
                    <Text color={palette.accent}>{copied ? 'Copied' : 'Copy'}</Text>
                  </Button>
                  <Button
                    onClick={() => setScanOpen(true)}
                    colors={{ containerColor: 'rgba(255,255,255,0.18)', contentColor: '#ffffff' }}
                  >
                    <Text color="#ffffff">Scan to connect</Text>
                  </Button>
                </Row>
              </Column>
            </Card>

            {/* Share request */}
            {pendingRequest ? (
              <Card
                colors={{ containerColor: palette.cardAlt, contentColor: palette.text }}
                elevation={1}
                modifiers={[fillMaxWidth()]}
              >
                <Column verticalArrangement={{ spacedBy: 10 }} modifiers={[paddingAll(18)]}>
                  <Text color={palette.text} style={{ typography: 'titleMedium', fontWeight: 'bold' }}>
                    Share request
                  </Text>
                  <Text color={palette.text} style={{ typography: 'bodyMedium' }}>
                    {`${pendingRequest.clinicName} wants to import your record.`}
                  </Text>
                  <Text color={palette.textDim} style={{ typography: 'labelMedium' }}>
                    {shareModeLabel(pendingRequest.mode, pendingRequest.durationHours)}
                  </Text>
                  <Row horizontalArrangement={{ spacedBy: 10 }}>
                    <Button
                      onClick={() => approve(pendingRequest)}
                      colors={{ containerColor: palette.accent, contentColor: '#ffffff' }}
                    >
                      <Text color="#ffffff">Approve</Text>
                    </Button>
                    <Button
                      onClick={() => deny(pendingRequest)}
                      colors={{ containerColor: 'transparent', contentColor: palette.danger }}
                    >
                      <Text color={palette.danger}>Deny</Text>
                    </Button>
                  </Row>
                </Column>
              </Card>
            ) : null}

            {/* Record */}
            <Text color={palette.text} style={{ typography: 'titleLarge', fontWeight: 'bold' }}>
              {record.name}
            </Text>
            <Card
              colors={{ containerColor: palette.card, contentColor: palette.text }}
              elevation={1}
              modifiers={[fillMaxWidth()]}
            >
              <Column modifiers={[paddingAll(6)]}>
                {rows.map((row) => (
                  <Column key={row.label} verticalArrangement={{ spacedBy: 2 }} modifiers={[paddingAll(12)]}>
                    <Text color={palette.accent} style={{ typography: 'labelMedium' }}>
                      {row.label}
                    </Text>
                    <Text color={palette.text} style={{ typography: 'bodyLarge' }}>
                      {row.value}
                    </Text>
                  </Column>
                ))}
              </Column>
            </Card>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg },
  content: { padding: 16 },
  footer: { height: 72 },
});
