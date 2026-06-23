import {
  Button,
  Grid,
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
  lineLimit,
  padding,
  shapes,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScanModal } from '@/components/scan-modal';
import { cardSurface, Chip, SectionLabel } from '@/components/swift-card';
import { formatDate, shareModeLabel, shortWallet } from '@/lib/format';
import { identiconColors } from '@/lib/identicon';
import { parsePairingUri } from '@/lib/relay';
import { CATEGORY_ICON, type CategoryKey, type Palette, useTheme } from '@/lib/theme';
import { useWallet } from '@/lib/wallet-context';

function CategoryCard({
  ck,
  label,
  value,
  palette,
}: {
  ck: CategoryKey;
  label: string;
  value: string;
  palette: Palette;
}) {
  const c = palette.category[ck];
  return (
    <VStack
      alignment="leading"
      spacing={12}
      modifiers={[
        padding({ all: 14 }),
        frame({ maxWidth: Infinity, minHeight: 104, alignment: 'topLeading' }),
        ...cardSurface(palette, 18),
      ]}
    >
      <Chip color={c.color} soft={c.soft} icon={CATEGORY_ICON[ck]} size={36} />
      <VStack alignment="leading" spacing={3}>
        <Text modifiers={[font({ size: 12 }), foregroundColor(palette.textDim)]}>{label}</Text>
        <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundColor(palette.text), lineLimit(1)]}>
          {value}
        </Text>
      </VStack>
    </VStack>
  );
}

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
            <Text modifiers={[foregroundColor(palette.textDim)]}>Setting up your wallet…</Text>
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

  const cats: { ck: CategoryKey; label: string; value: string }[] = [
    {
      ck: 'allergy',
      label: 'Allergies',
      value: record.allergies.map((a) => a.substance).join(', ') || 'None recorded',
    },
    {
      ck: 'medication',
      label: 'Medications',
      value: record.medications.map((m) => m.name).join(', ') || 'None recorded',
    },
    {
      ck: 'problem',
      label: 'Problems',
      value: record.problems.map((p) => p.label).join(', ') || 'None recorded',
    },
    {
      ck: 'lab',
      label: 'Labs',
      value: record.labs.map((l) => l.name).join(', ') || 'None recorded',
    },
  ];

  const history = [...record.encounters].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: palette.bg }]}
      edges={['top', 'left', 'right']}
    >
      <Host style={styles.fill}>
        <ScrollView>
          <VStack spacing={18} modifiers={[padding({ horizontal: 16, top: 4, bottom: 32 })]}>
            {/* Large title */}
            <VStack alignment="leading" spacing={2} modifiers={[padding({ leading: 4 })]}>
              <Text modifiers={[font({ size: 32, weight: 'bold' }), foregroundColor(palette.text)]}>
                Wallet
              </Text>
              <Text modifiers={[font({ size: 14 }), foregroundColor(palette.textDim)]}>
                Your record lives on this device
              </Text>
            </VStack>

            {/* Hero identity card */}
            <VStack
              alignment="leading"
              spacing={16}
              modifiers={[padding({ all: 20 }), ...cardSurface(palette)]}
            >
              <HStack spacing={13}>
                <VStack
                  modifiers={[
                    frame({ width: 52, height: 52 }),
                    background(idColor, shapes.roundedRectangle({ cornerRadius: 26 })),
                  ]}
                >
                  <Text modifiers={[font({ size: 19, weight: 'bold' }), foregroundColor('#ffffff')]}>
                    {record.initials}
                  </Text>
                </VStack>
                <VStack alignment="leading" spacing={4}>
                  <Text modifiers={[font({ size: 19, weight: 'semibold' }), foregroundColor(palette.text)]}>
                    {record.name}
                  </Text>
                  <HStack spacing={6}>
                    <Image systemName="circle.fill" size={8} color={stat.color} />
                    <Text modifiers={[font({ size: 13, weight: 'medium' }), foregroundColor(palette.textDim)]}>
                      {stat.label}
                    </Text>
                  </HStack>
                </VStack>
                <Spacer />
              </HStack>

              {/* Wallet number — the app's hero detail */}
              <VStack
                alignment="leading"
                spacing={7}
                modifiers={[
                  padding({ all: 14 }),
                  background(palette.cardAlt, shapes.roundedRectangle({ cornerRadius: 14 })),
                  frame({ maxWidth: Infinity, alignment: 'leading' }),
                ]}
              >
                <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundColor(palette.textFaint)]}>
                  WALLET NUMBER
                </Text>
                <HStack>
                  <Text modifiers={[font({ size: 15, design: 'monospaced', weight: 'medium' }), foregroundColor(palette.text)]}>
                    {shortWallet(identity.walletNumber)}
                  </Text>
                  <Spacer />
                  <Button
                    label={copied ? 'Copied' : 'Copy'}
                    systemImage={copied ? 'checkmark' : 'doc.on.doc'}
                    onPress={copy}
                    modifiers={[buttonStyle('borderless'), controlSize('small'), tint(palette.accent)]}
                  />
                </HStack>
              </VStack>

              {/* Primary action */}
              <Button
                label="Scan to connect"
                systemImage="qrcode.viewfinder"
                onPress={() => setScanOpen(true)}
                modifiers={[
                  buttonStyle('borderedProminent'),
                  controlSize('large'),
                  tint(palette.accent),
                  frame({ maxWidth: Infinity }),
                ]}
              />
            </VStack>

            {/* Incoming share request */}
            {pendingRequest ? (
              <VStack
                alignment="leading"
                spacing={12}
                modifiers={[
                  padding({ all: 18 }),
                  background(palette.accentSoft, shapes.roundedRectangle({ cornerRadius: 20 })),
                ]}
              >
                <HStack spacing={9}>
                  <Chip color={palette.accent} soft={palette.card} icon="bell.badge.fill" size={34} />
                  <VStack alignment="leading" spacing={2}>
                    <Text modifiers={[font({ size: 16, weight: 'semibold' }), foregroundColor(palette.text)]}>
                      Share request
                    </Text>
                    <Text modifiers={[font({ size: 13 }), foregroundColor(palette.textDim)]}>
                      {shareModeLabel(pendingRequest.mode, pendingRequest.durationHours)}
                    </Text>
                  </VStack>
                  <Spacer />
                </HStack>
                <Text modifiers={[font({ size: 14 }), foregroundColor(palette.text)]}>
                  {`${pendingRequest.clinicName} wants to import your record.`}
                </Text>
                <HStack spacing={10}>
                  <Button
                    label="Approve"
                    systemImage="checkmark"
                    onPress={() => approve(pendingRequest)}
                    modifiers={[buttonStyle('borderedProminent'), controlSize('regular'), tint(palette.accent)]}
                  />
                  <Button
                    label="Deny"
                    role="destructive"
                    onPress={() => deny(pendingRequest)}
                    modifiers={[buttonStyle('bordered'), controlSize('regular')]}
                  />
                  <Spacer />
                </HStack>
              </VStack>
            ) : null}

            {/* Health record — even 2×2 grid (native SwiftUI Grid keeps columns equal) */}
            <SectionLabel text="HEALTH RECORD" palette={palette} />
            <Grid horizontalSpacing={12} verticalSpacing={12} modifiers={[frame({ maxWidth: Infinity })]}>
              <Grid.Row>
                <CategoryCard {...cats[0]} palette={palette} />
                <CategoryCard {...cats[1]} palette={palette} />
              </Grid.Row>
              <Grid.Row>
                <CategoryCard {...cats[2]} palette={palette} />
                <CategoryCard {...cats[3]} palette={palette} />
              </Grid.Row>
            </Grid>

            {/* History timeline */}
            {history.length ? (
              <>
                <SectionLabel text="HISTORY" palette={palette} />
                <VStack spacing={0} modifiers={[padding({ horizontal: 18, vertical: 6 }), ...cardSurface(palette, 20)]}>
                  {history.map((e, i) => (
                    <HStack key={`${e.date}-${i}`} alignment="top" spacing={13} modifiers={[padding({ vertical: 12 })]}>
                      <VStack spacing={0} modifiers={[frame({ width: 12, alignment: 'top' })]}>
                        <Image systemName="circle.fill" size={11} color={palette.accent} />
                        {i < history.length - 1 ? (
                          <VStack
                            modifiers={[
                              frame({ width: 2, maxHeight: Infinity }),
                              background(palette.separator),
                              padding({ top: 4 }),
                            ]}
                          >
                            <Spacer />
                          </VStack>
                        ) : null}
                      </VStack>
                      <VStack alignment="leading" spacing={3}>
                        <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundColor(palette.accent)]}>
                          {formatDate(e.date)}
                        </Text>
                        <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundColor(palette.text)]}>
                          {`${e.type} · ${e.provider}`}
                        </Text>
                        <Text modifiers={[font({ size: 14 }), foregroundColor(palette.textDim)]}>
                          {e.summary}
                        </Text>
                      </VStack>
                      <Spacer />
                    </HStack>
                  ))}
                </VStack>
              </>
            ) : null}
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
