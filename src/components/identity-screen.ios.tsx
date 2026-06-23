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
  buttonStyle,
  controlSize,
  font,
  foregroundColor,
  frame,
  padding,
  shapes,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NetworkModal } from '@/components/network-modal';
import { cardSurface, Chip, SectionLabel } from '@/components/swift-card';
import { shortWallet } from '@/lib/format';
import { identiconColors } from '@/lib/identicon';
import { type Palette, useTheme } from '@/lib/theme';
import { useWallet } from '@/lib/wallet-context';

function InfoRow({
  icon,
  color,
  soft,
  label,
  value,
  palette,
}: {
  icon: string;
  color: string;
  soft: string;
  label: string;
  value: string;
  palette: Palette;
}) {
  return (
    <HStack
      spacing={12}
      modifiers={[
        padding({ vertical: 12 }),
        frame({ maxWidth: Infinity }),
      ]}
    >
      <Chip color={color} soft={soft} icon={icon} size={30} />
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
  const cat = palette.category;

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
    <SafeAreaView
      style={[styles.safe, { backgroundColor: palette.bg }]}
      edges={['top', 'left', 'right']}
    >
      <Host style={styles.fill}>
        <ScrollView>
          <VStack spacing={18} modifiers={[padding({ horizontal: 16, top: 4, bottom: 32 })]}>
            <Text
              modifiers={[font({ size: 32, weight: 'bold' }), foregroundColor(palette.text), padding({ leading: 4 })]}
            >
              Identity
            </Text>

            {/* Hero identity card */}
            <HStack spacing={14} modifiers={[padding({ all: 20 }), ...cardSurface(palette)]}>
              <VStack
                modifiers={[
                  frame({ width: 56, height: 56 }),
                  background(idColor, shapes.roundedRectangle({ cornerRadius: 28 })),
                ]}
              >
                <Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundColor('#ffffff')]}>
                  {record?.initials ?? 'TM'}
                </Text>
              </VStack>
              <VStack alignment="leading" spacing={4}>
                <Text modifiers={[font({ size: 20, weight: 'semibold' }), foregroundColor(palette.text)]}>
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

            {/* Wallet */}
            <SectionLabel text="WALLET" palette={palette} />
            <VStack spacing={0} modifiers={[padding({ horizontal: 16, vertical: 2 }), ...cardSurface(palette, 18)]}>
              <InfoRow icon="number" color={cat.medication.color} soft={cat.medication.soft} label="Wallet number" value={shortWallet(identity.walletNumber)} palette={palette} />
              <InfoRow icon="lock.fill" color={cat.problem.color} soft={cat.problem.soft} label="Fingerprint" value={identity.fingerprint} palette={palette} />
              <InfoRow icon="function" color={cat.lab.color} soft={cat.lab.soft} label="Algorithm" value="Ed25519" palette={palette} />
            </VStack>

            {/* Network */}
            <SectionLabel text="NETWORK" palette={palette} />
            <VStack spacing={6} modifiers={[padding({ horizontal: 16, vertical: 12 }), ...cardSurface(palette, 18)]}>
              <HStack spacing={12} modifiers={[frame({ maxWidth: Infinity })]}>
                <Chip color={cat.visit.color} soft={cat.visit.soft} icon="network" size={30} />
                <Text modifiers={[font({ size: 15 }), foregroundColor(palette.text)]}>Relay server</Text>
                <Spacer />
                <Text modifiers={[font({ size: 13, design: 'monospaced' }), foregroundColor(palette.textDim), frame({ maxWidth: 170 })]}>
                  {relayUrl}
                </Text>
              </HStack>
              <Button
                label="Change network"
                systemImage="antenna.radiowaves.left.and.right"
                onPress={() => setNetOpen(true)}
                modifiers={[buttonStyle('bordered'), controlSize('regular'), tint(palette.accent), frame({ maxWidth: Infinity })]}
              />
            </VStack>

            {/* Actions */}
            <VStack spacing={10} modifiers={[padding({ horizontal: 16, vertical: 14 }), ...cardSurface(palette, 18)]}>
              <Button
                label="Copy fingerprint"
                systemImage="doc.on.doc"
                onPress={() => {
                  void Clipboard.setStringAsync(identity.fingerprint);
                  Alert.alert('Copied', 'Fingerprint copied.');
                }}
                modifiers={[buttonStyle('bordered'), controlSize('regular'), tint(palette.accent), frame({ maxWidth: Infinity })]}
              />
              <Button
                label="Reset wallet"
                systemImage="trash"
                role="destructive"
                onPress={confirmReset}
                modifiers={[buttonStyle('bordered'), controlSize('regular'), frame({ maxWidth: Infinity })]}
              />
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
