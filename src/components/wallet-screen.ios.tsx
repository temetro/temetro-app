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
  clipShape,
  cornerRadius,
  font,
  foregroundColor,
  frame,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScanModal } from '@/components/scan-modal';
import { shareModeLabel, shortWallet } from '@/lib/format';
import { identiconColors } from '@/lib/identicon';
import { parsePairingUri } from '@/lib/relay';
import { palette } from '@/lib/theme';
import { useWallet } from '@/lib/wallet-context';

const STATUS = {
  connecting: { label: 'Connecting…', color: palette.warning },
  connected: { label: 'Connecting…', color: palette.warning },
  authenticated: { label: 'Online', color: palette.success },
  'auth-failed': { label: 'Auth failed', color: palette.danger },
  disconnected: { label: 'Offline', color: palette.danger },
} as const;

type Row = { icon: string; label: string; value: string };

export default function WalletScreenIOS() {
  const { identity, record, status, pendingRequest, approve, deny, respondToPairing } =
    useWallet();
  const [scanOpen, setScanOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!identity || !record) {
    return (
      <SafeAreaView style={styles.safe}>
        <Host style={styles.fill}>
          <VStack modifiers={[padding({ all: 24 })]}>
            <Text modifiers={[foregroundColor(palette.textDim)]}>
              Setting up your wallet…
            </Text>
          </VStack>
        </Host>
      </SafeAreaView>
    );
  }

  const colors = identiconColors(identity.publicKeyHex);
  const stat = STATUS[status];

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

  const rows: Row[] = [
    {
      icon: 'exclamationmark.triangle.fill',
      label: 'Allergies',
      value: record.allergies.map((a) => a.substance).join(', ') || 'None',
    },
    {
      icon: 'pills.fill',
      label: 'Medications',
      value: record.medications.map((m) => m.name).join(', ') || 'None',
    },
    {
      icon: 'heart.text.square.fill',
      label: 'Problems',
      value: record.problems.map((p) => p.label).join(', ') || 'None',
    },
    {
      icon: 'testtube.2',
      label: 'Labs',
      value: record.labs.map((l) => l.name).join(', ') || 'None',
    },
    {
      icon: 'calendar',
      label: 'Last visit',
      value: record.encounters[0]?.summary ?? '—',
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Host style={styles.fill}>
        <ScrollView>
          <VStack spacing={16} modifiers={[padding({ all: 16 })]}>
            {/* Account header card */}
            <VStack
              alignment="leading"
              spacing={14}
              modifiers={[padding({ all: 20 }), background(palette.accent), cornerRadius(24)]}
            >
              <HStack spacing={12}>
                <ZStack>
                  <Image systemName="circle.fill" size={42} color={colors.from} />
                  <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundColor('#ffffff')]}>
                    {record.initials}
                  </Text>
                </ZStack>
                <VStack alignment="leading" spacing={2}>
                  <Text modifiers={[font({ size: 18, weight: 'bold' }), foregroundColor('#ffffff')]}>
                    My wallet
                  </Text>
                  <HStack spacing={5}>
                    <Image systemName="circle.fill" size={8} color={stat.color} />
                    <Text modifiers={[font({ size: 12 }), foregroundColor('#dceaff')]}>
                      {stat.label}
                    </Text>
                  </HStack>
                </VStack>
                <Spacer />
              </HStack>

              <Text modifiers={[font({ size: 13, design: 'monospaced' }), foregroundColor('#eaf3ff')]}>
                {shortWallet(identity.walletNumber)}
              </Text>

              <HStack spacing={10}>
                <Button label={copied ? 'Copied' : 'Copy'} systemImage="doc.on.doc" onPress={copy} />
                <Button
                  label="Scan to connect"
                  systemImage="qrcode.viewfinder"
                  onPress={() => setScanOpen(true)}
                />
              </HStack>
            </VStack>

            {/* Incoming share request */}
            {pendingRequest ? (
              <VStack
                alignment="leading"
                spacing={10}
                modifiers={[padding({ all: 18 }), background(palette.cardAlt), cornerRadius(20)]}
              >
                <HStack spacing={8}>
                  <Image systemName="bell.badge.fill" size={18} color={palette.accent} />
                  <Text modifiers={[font({ size: 16, weight: 'semibold' }), foregroundColor(palette.text)]}>
                    Share request
                  </Text>
                </HStack>
                <Text modifiers={[font({ size: 14 }), foregroundColor(palette.text)]}>
                  {`${pendingRequest.clinicName} wants to import your record.`}
                </Text>
                <Text modifiers={[font({ size: 13 }), foregroundColor(palette.textDim)]}>
                  {shareModeLabel(pendingRequest.mode, pendingRequest.durationHours)}
                </Text>
                <HStack spacing={10}>
                  <Button label="Approve" systemImage="checkmark" onPress={() => approve(pendingRequest)} />
                  <Button label="Deny" role="destructive" onPress={() => deny(pendingRequest)} />
                </HStack>
              </VStack>
            ) : null}

            {/* Record */}
            <Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundColor(palette.text), padding({ top: 4, leading: 4 })]}>
              {record.name}
            </Text>
            <VStack spacing={1} modifiers={[background(palette.border), cornerRadius(18), clipShape('roundedRectangle', 18)]}>
              {rows.map((row) => (
                <HStack
                  key={row.label}
                  spacing={12}
                  modifiers={[padding({ all: 14 }), background(palette.card), frame({ maxWidth: Infinity })]}
                >
                  <Image systemName={row.icon as never} size={18} color={palette.accent} />
                  <VStack alignment="leading" spacing={2}>
                    <Text modifiers={[font({ size: 12 }), foregroundColor(palette.textDim)]}>
                      {row.label}
                    </Text>
                    <Text modifiers={[font({ size: 15 }), foregroundColor(palette.text)]}>
                      {row.value}
                    </Text>
                  </VStack>
                  <Spacer />
                </HStack>
              ))}
            </VStack>
          </VStack>
        </ScrollView>
      </Host>

      <ScanModal onClose={() => setScanOpen(false)} onScanned={onScanned} visible={scanOpen} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  fill: { flex: 1 },
});
