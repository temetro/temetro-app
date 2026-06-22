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

import { ScanModal } from '@/components/scan-modal';
import { shareModeLabel, shortWallet } from '@/lib/format';
import { identiconColors } from '@/lib/identicon';
import { parsePairingUri } from '@/lib/relay';
import { useTheme } from '@/lib/theme';
import { useWallet } from '@/lib/wallet-context';

type Row = { icon: string; label: string; value: string };

export default function WalletScreenIOS() {
  const { identity, record, status, pendingRequest, approve, deny, respondToPairing } =
    useWallet();
  const { palette } = useTheme();
  const [scanOpen, setScanOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);

  if (!identity || !record) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
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

  const idColor = identiconColors(identity.publicKeyHex).from;
  const stat = connecting
    ? { label: 'Connecting to clinic…', color: palette.warning }
    : status === 'authenticated'
      ? { label: 'Online', color: palette.success }
      : status === 'auth-failed'
        ? { label: 'Auth failed', color: palette.danger }
        : status === 'disconnected'
          ? { label: 'Offline', color: palette.danger }
          : { label: 'Connecting…', color: palette.warning };

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
    setConnecting(true);
    const ok = await respondToPairing(pairing);
    setConnecting(false);
    Alert.alert(
      ok ? 'Record shared' : "Couldn't share",
      ok
        ? 'Your record was securely shared with the clinic.'
        : "The clinic couldn't be reached. Make sure you're on the same network and try again.",
    );
  };

  const rows: Row[] = [
    {
      icon: 'exclamationmark.triangle.fill',
      label: 'Allergies',
      value: record.allergies.map((a) => a.substance).join(', ') || 'None recorded',
    },
    {
      icon: 'pills.fill',
      label: 'Medications',
      value: record.medications.map((m) => m.name).join(', ') || 'None recorded',
    },
    {
      icon: 'heart.text.square.fill',
      label: 'Problems',
      value: record.problems.map((p) => p.label).join(', ') || 'None recorded',
    },
    {
      icon: 'testtube.2',
      label: 'Labs',
      value: record.labs.map((l) => l.name).join(', ') || 'None recorded',
    },
    {
      icon: 'calendar',
      label: 'Last visit',
      value: record.encounters[0]?.summary ?? '—',
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top', 'left', 'right']}>
      <Host style={styles.fill}>
        <ScrollView>
          <VStack spacing={20} modifiers={[padding({ horizontal: 16, top: 4, bottom: 28 })]}>
            {/* Large title */}
            <VStack alignment="leading" spacing={2} modifiers={[padding({ leading: 4 })]}>
              <Text modifiers={[font({ size: 30, weight: 'bold' }), foregroundColor(palette.text)]}>
                Wallet
              </Text>
              <Text modifiers={[font({ size: 14 }), foregroundColor(palette.textDim)]}>
                Your record lives on this device
              </Text>
            </VStack>

            {/* Identity card */}
            <VStack
              alignment="leading"
              spacing={14}
              modifiers={[padding({ all: 18 }), background(palette.card), cornerRadius(20)]}
            >
              <HStack spacing={13}>
                <VStack
                  modifiers={[frame({ width: 46, height: 46 }), background(idColor), cornerRadius(23)]}
                >
                  <Text modifiers={[font({ size: 16, weight: 'bold' }), foregroundColor('#ffffff')]}>
                    {record.initials}
                  </Text>
                </VStack>
                <VStack alignment="leading" spacing={3}>
                  <Text modifiers={[font({ size: 18, weight: 'semibold' }), foregroundColor(palette.text)]}>
                    {record.name}
                  </Text>
                  <Text modifiers={[font({ size: 13, design: 'monospaced' }), foregroundColor(palette.textDim)]}>
                    {shortWallet(identity.walletNumber)}
                  </Text>
                </VStack>
                <Spacer />
              </HStack>

              {/* Status pill */}
              <HStack spacing={6} modifiers={[padding({ horizontal: 11, vertical: 6 }), background(palette.cardAlt), cornerRadius(20)]}>
                <Image systemName="circle.fill" size={8} color={stat.color} />
                <Text modifiers={[font({ size: 12, weight: 'medium' }), foregroundColor(palette.textDim)]}>
                  {stat.label}
                </Text>
              </HStack>

              <HStack spacing={18}>
                <Button label="Scan to connect" systemImage="qrcode.viewfinder" onPress={() => setScanOpen(true)} />
                <Button label={copied ? 'Copied' : 'Copy number'} systemImage="doc.on.doc" onPress={copy} />
                <Spacer />
              </HStack>
            </VStack>

            {/* Incoming share request */}
            {pendingRequest ? (
              <VStack
                alignment="leading"
                spacing={10}
                modifiers={[padding({ all: 16 }), background(palette.accentSoft), cornerRadius(18)]}
              >
                <HStack spacing={8}>
                  <Image systemName="bell.badge.fill" size={16} color={palette.accent} />
                  <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundColor(palette.text)]}>
                    Share request
                  </Text>
                </HStack>
                <Text modifiers={[font({ size: 14 }), foregroundColor(palette.text)]}>
                  {`${pendingRequest.clinicName} wants to import your record.`}
                </Text>
                <Text modifiers={[font({ size: 13 }), foregroundColor(palette.textDim)]}>
                  {shareModeLabel(pendingRequest.mode, pendingRequest.durationHours)}
                </Text>
                <HStack spacing={18}>
                  <Button label="Approve" systemImage="checkmark" onPress={() => approve(pendingRequest)} />
                  <Button label="Deny" role="destructive" onPress={() => deny(pendingRequest)} />
                  <Spacer />
                </HStack>
              </VStack>
            ) : null}

            {/* Health record */}
            <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundColor(palette.textDim), padding({ leading: 4, top: 2 })]}>
              HEALTH RECORD
            </Text>
            <VStack spacing={1} modifiers={[background(palette.separator), cornerRadius(18)]}>
              {rows.map((row) => (
                <HStack
                  key={row.label}
                  spacing={13}
                  modifiers={[padding({ all: 14 }), background(palette.card), frame({ maxWidth: Infinity })]}
                >
                  <VStack modifiers={[frame({ width: 30, height: 30 }), background(palette.accentSoft), cornerRadius(8)]}>
                    <Image systemName={row.icon as never} size={15} color={palette.accent} modifiers={[padding({ all: 7 })]} />
                  </VStack>
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
  safe: { flex: 1 },
  fill: { flex: 1 },
});
