import {
  Button,
  Host,
  HStack,
  Image,
  ScrollView,
  Spacer,
  Text,
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
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NetworkModal } from '@/components/network-modal';
import { shortWallet } from '@/lib/format';
import { identiconColors } from '@/lib/identicon';
import { type Palette, useTheme } from '@/lib/theme';
import { useWallet } from '@/lib/wallet-context';

function Section({ title, palette, children }: { title: string; palette: Palette; children: React.ReactNode }) {
  return (
    <VStack alignment="leading" spacing={8}>
      <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundColor(palette.textDim), padding({ leading: 4 })]}>
        {title}
      </Text>
      <VStack spacing={1} modifiers={[background(palette.separator), cornerRadius(16)]}>
        {children}
      </VStack>
    </VStack>
  );
}

function Row({ label, value, palette }: { label: string; value: string; palette: Palette }) {
  return (
    <HStack spacing={12} modifiers={[padding({ all: 14 }), background(palette.card), frame({ maxWidth: Infinity })]}>
      <Text modifiers={[font({ size: 15 }), foregroundColor(palette.text)]}>{label}</Text>
      <Spacer />
      <Text modifiers={[font({ size: 14, design: 'monospaced' }), foregroundColor(palette.textDim)]}>
        {value}
      </Text>
    </HStack>
  );
}

export default function IdentityScreenIOS() {
  const { identity, record, relayUrl, setRelayUrl, reset } = useWallet();
  const { palette } = useTheme();
  const [netOpen, setNetOpen] = useState(false);

  if (!identity) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
        <Host style={styles.fill}>
          <VStack modifiers={[padding({ all: 24 })]}>
            <Text modifiers={[foregroundColor(palette.textDim)]}>Loading…</Text>
          </VStack>
        </Host>
      </SafeAreaView>
    );
  }

  const idColor = identiconColors(identity.publicKeyHex).from;

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
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top', 'left', 'right']}>
      <Host style={styles.fill}>
        <ScrollView>
          <VStack spacing={20} modifiers={[padding({ horizontal: 16, top: 4, bottom: 28 })]}>
            <Text modifiers={[font({ size: 30, weight: 'bold' }), foregroundColor(palette.text), padding({ leading: 4 })]}>
              Identity
            </Text>

            {/* Identity header card */}
            <HStack spacing={14} modifiers={[padding({ all: 16 }), background(palette.card), cornerRadius(20)]}>
              <VStack modifiers={[frame({ width: 52, height: 52 }), background(idColor), cornerRadius(26)]}>
                <Text modifiers={[font({ size: 18, weight: 'bold' }), foregroundColor('#ffffff')]}>
                  {record?.initials ?? 'TM'}
                </Text>
              </VStack>
              <VStack alignment="leading" spacing={3}>
                <Text modifiers={[font({ size: 19, weight: 'semibold' }), foregroundColor(palette.text)]}>
                  {record?.name ?? 'My identity'}
                </Text>
                <HStack spacing={5}>
                  <Image systemName="lock.fill" size={11} color={palette.success} />
                  <Text modifiers={[font({ size: 13 }), foregroundColor(palette.textDim)]}>
                    Stored only on this device
                  </Text>
                </HStack>
              </VStack>
              <Spacer />
            </HStack>

            <Section title="WALLET" palette={palette}>
              <Row label="Wallet number" value={shortWallet(identity.walletNumber)} palette={palette} />
              <Row label="Fingerprint" value={identity.fingerprint} palette={palette} />
              <Row label="Algorithm" value="Ed25519" palette={palette} />
            </Section>

            <Section title="NETWORK" palette={palette}>
              <Row label="Relay server" value={relayUrl} palette={palette} />
              <HStack spacing={12} modifiers={[padding({ all: 14 }), background(palette.card), frame({ maxWidth: Infinity })]}>
                <Button label="Change network" systemImage="network" onPress={() => setNetOpen(true)} />
                <Spacer />
              </HStack>
            </Section>

            <VStack spacing={1} modifiers={[background(palette.separator), cornerRadius(16)]}>
              <HStack spacing={12} modifiers={[padding({ all: 14 }), background(palette.card), frame({ maxWidth: Infinity })]}>
                <Button
                  label="Copy fingerprint"
                  systemImage="doc.on.doc"
                  onPress={() => {
                    void Clipboard.setStringAsync(identity.fingerprint);
                    Alert.alert('Copied', 'Fingerprint copied.');
                  }}
                />
                <Spacer />
              </HStack>
              <HStack spacing={12} modifiers={[padding({ all: 14 }), background(palette.card), frame({ maxWidth: Infinity })]}>
                <Button label="Reset wallet" systemImage="trash" role="destructive" onPress={confirmReset} />
                <Spacer />
              </HStack>
            </VStack>
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
  safe: { flex: 1 },
  fill: { flex: 1 },
});
