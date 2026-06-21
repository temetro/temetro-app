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

import { NetworkModal } from '@/components/network-modal';
import { shortWallet } from '@/lib/format';
import { identiconColors } from '@/lib/identicon';
import { palette } from '@/lib/theme';
import { useWallet } from '@/lib/wallet-context';

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <Card colors={{ containerColor: palette.card, contentColor: palette.text }} elevation={1} modifiers={[fillMaxWidth()]}>
      <Column verticalArrangement={{ spacedBy: 3 }} modifiers={[paddingAll(14)]}>
        <Text color={palette.textDim} style={{ typography: 'labelMedium' }}>
          {label}
        </Text>
        <Text color={palette.text} style={{ typography: 'bodyMedium' }}>
          {value}
        </Text>
      </Column>
    </Card>
  );
}

export default function IdentityScreenAndroid() {
  const { identity, record, relayUrl, setRelayUrl, reset } = useWallet();
  const [netOpen, setNetOpen] = useState(false);

  if (!identity) {
    return (
      <SafeAreaView style={styles.center}>
        <Host matchContents>
          <Text color={palette.textDim}>Loading…</Text>
        </Host>
      </SafeAreaView>
    );
  }

  const colors = identiconColors(identity.publicKeyHex);

  const confirmReset = () =>
    Alert.alert(
      'Reset wallet?',
      'This permanently deletes your keys and creates a new wallet number.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => void reset() },
      ],
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Host matchContents>
          <Column verticalArrangement={{ spacedBy: 14 }} modifiers={[fillMaxWidth()]}>
            <Row horizontalArrangement={{ spacedBy: 14 }} verticalAlignment="center">
              <Box
                contentAlignment="center"
                modifiers={[size(52, 52), background(colors.from), clip({ type: 'circle' })]}
              >
                <Text color="#ffffff" style={{ fontSize: 17, fontWeight: 'bold' }}>
                  {record?.initials ?? 'TM'}
                </Text>
              </Box>
              <Column verticalArrangement={{ spacedBy: 2 }}>
                <Text color={palette.text} style={{ typography: 'titleLarge', fontWeight: 'bold' }}>
                  {record?.name ?? 'My identity'}
                </Text>
                <Text color={palette.textDim} style={{ typography: 'labelMedium' }}>
                  Stored only on this device
                </Text>
              </Column>
            </Row>

            <DetailCard label="Wallet number" value={shortWallet(identity.walletNumber)} />
            <DetailCard label="Public key fingerprint" value={identity.fingerprint} />
            <DetailCard label="Algorithm" value="Ed25519" />

            <Card colors={{ containerColor: palette.card, contentColor: palette.text }} elevation={1} modifiers={[fillMaxWidth()]}>
              <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[paddingAll(14)]}>
                <Text color={palette.textDim} style={{ typography: 'labelMedium' }}>
                  Relay server
                </Text>
                <Text color={palette.text} style={{ typography: 'bodyMedium' }}>
                  {relayUrl}
                </Text>
                <Button
                  onClick={() => setNetOpen(true)}
                  colors={{ containerColor: palette.accent, contentColor: '#ffffff' }}
                >
                  <Text color="#ffffff">Change network</Text>
                </Button>
              </Column>
            </Card>

            <Button
              onClick={() => {
                void Clipboard.setStringAsync(identity.fingerprint);
                Alert.alert('Copied', 'Fingerprint copied.');
              }}
              colors={{ containerColor: palette.cardAlt, contentColor: palette.text }}
            >
              <Text color={palette.text}>Copy fingerprint</Text>
            </Button>
            <Button
              onClick={confirmReset}
              colors={{ containerColor: 'transparent', contentColor: palette.danger }}
            >
              <Text color={palette.danger}>Reset wallet</Text>
            </Button>
          </Column>
        </Host>
        <View style={styles.footer} />
      </ScrollView>

      <NetworkModal
        current={relayUrl}
        onClose={() => setNetOpen(false)}
        onSave={(url) => {
          setNetOpen(false);
          void setRelayUrl(url);
        }}
        visible={netOpen}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg },
  content: { padding: 16 },
  footer: { height: 72 },
});
