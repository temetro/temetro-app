import {
  Button,
  Host,
  HStack,
  Image,
  ScrollView,
  Spacer,
  Text,
  VStack,
  ZStack,
} from '@expo/ui/swift-ui';
import {
  background,
  cornerRadius,
  font,
  foregroundColor,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NetworkModal } from '@/components/network-modal';
import { shortWallet } from '@/lib/format';
import { identiconColors } from '@/lib/identicon';
import { palette } from '@/lib/theme';
import { useWallet } from '@/lib/wallet-context';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <VStack
      alignment="leading"
      spacing={3}
      modifiers={[padding({ all: 14 }), background(palette.card), cornerRadius(14)]}
    >
      <Text modifiers={[font({ size: 12 }), foregroundColor(palette.textDim)]}>{label}</Text>
      <Text modifiers={[font({ size: 14, design: 'monospaced' }), foregroundColor(palette.text)]}>
        {value}
      </Text>
    </VStack>
  );
}

export default function IdentityScreenIOS() {
  const { identity, record, relayUrl, setRelayUrl, reset } = useWallet();
  const [netOpen, setNetOpen] = useState(false);

  if (!identity) {
    return (
      <SafeAreaView style={styles.safe}>
        <Host style={styles.fill}>
          <VStack modifiers={[padding({ all: 24 })]}>
            <Text modifiers={[foregroundColor(palette.textDim)]}>Loading…</Text>
          </VStack>
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
      <Host style={styles.fill}>
        <ScrollView>
          <VStack spacing={14} modifiers={[padding({ all: 16 })]}>
            <HStack spacing={14}>
              <ZStack>
                <Image systemName="circle.fill" size={52} color={colors.from} />
                <Text modifiers={[font({ size: 17, weight: 'bold' }), foregroundColor('#ffffff')]}>
                  {record?.initials ?? 'TM'}
                </Text>
              </ZStack>
              <VStack alignment="leading" spacing={2}>
                <Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundColor(palette.text)]}>
                  {record?.name ?? 'My identity'}
                </Text>
                <Text modifiers={[font({ size: 13 }), foregroundColor(palette.textDim)]}>
                  Stored only on this device
                </Text>
              </VStack>
              <Spacer />
            </HStack>

            <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundColor(palette.textDim), padding({ top: 6, leading: 4 })]}>
              ACCOUNT DETAILS
            </Text>
            <DetailRow label="Wallet number" value={shortWallet(identity.walletNumber)} />
            <DetailRow label="Public key fingerprint" value={identity.fingerprint} />
            <DetailRow label="Algorithm" value="Ed25519" />

            <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundColor(palette.textDim), padding({ top: 6, leading: 4 })]}>
              NETWORK
            </Text>
            <VStack
              alignment="leading"
              spacing={8}
              modifiers={[padding({ all: 14 }), background(palette.card), cornerRadius(14)]}
            >
              <Text modifiers={[font({ size: 12 }), foregroundColor(palette.textDim)]}>Relay server</Text>
              <Text modifiers={[font({ size: 14 }), foregroundColor(palette.text)]}>{relayUrl}</Text>
              <Button label="Change network" systemImage="network" onPress={() => setNetOpen(true)} />
            </VStack>

            <Button
              label="Copy fingerprint"
              systemImage="doc.on.doc"
              onPress={() => {
                void Clipboard.setStringAsync(identity.fingerprint);
                Alert.alert('Copied', 'Fingerprint copied.');
              }}
            />
            <Button label="Reset wallet" role="destructive" onPress={confirmReset} />
          </VStack>
        </ScrollView>
      </Host>

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
  fill: { flex: 1 },
});
