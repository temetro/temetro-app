import {
  Button,
  Chart,
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
  monospacedDigit,
  padding,
  shadow,
  shapes,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScanModal } from '@/components/scan-modal';
import { cardSurface, Chip, Pill, SectionLabel } from '@/components/swift-card';
import { formatDate, shareModeLabel, shortWallet } from '@/lib/format';
import { parsePairingUri } from '@/lib/relay';
import { CATEGORY_ICON, type CategoryKey, type Palette, useTheme } from '@/lib/theme';
import type { AllergySeverity, LabFlag } from '@/lib/types';
import { useWallet } from '@/lib/wallet-context';

// White tints used on the teal "wallet pass" surface.
const W = { full: '#ffffff', t85: 'rgba(255,255,255,0.85)', t70: 'rgba(255,255,255,0.70)', t18: 'rgba(255,255,255,0.18)', t12: 'rgba(255,255,255,0.12)' };

type Status = { text: string; color: string; soft: string };

function severityStyle(p: Palette, s: AllergySeverity): Status {
  if (s === 'severe') return { text: 'severe', color: p.danger, soft: p.dangerSoft };
  if (s === 'moderate') return { text: 'moderate', color: p.warning, soft: p.warningSoft };
  return { text: 'mild', color: p.success, soft: p.successSoft };
}

function flagStyle(p: Palette, f: LabFlag): Status {
  if (f === 'critical') return { text: 'critical', color: p.danger, soft: p.dangerSoft };
  if (f === 'high' || f === 'low') return { text: f, color: p.warning, soft: p.warningSoft };
  return { text: 'normal', color: p.success, soft: p.successSoft };
}

type Cat = {
  ck: CategoryKey;
  label: string;
  value: string;
  detail?: string;
  pill?: Status;
};

function CategoryCard({ cat, palette }: { cat: Cat; palette: Palette }) {
  const c = palette.category[cat.ck];
  return (
    <VStack
      alignment="leading"
      spacing={10}
      modifiers={[
        padding({ all: 14 }),
        frame({ maxWidth: Infinity, minHeight: 128, alignment: 'topLeading' }),
        ...cardSurface(palette, 18),
      ]}
    >
      <Chip color={c.color} soft={c.soft} icon={CATEGORY_ICON[cat.ck]} size={36} />
      <VStack alignment="leading" spacing={4}>
        <Text modifiers={[font({ size: 12 }), foregroundColor(palette.textDim)]}>{cat.label}</Text>
        <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundColor(palette.text), lineLimit(1)]}>
          {cat.value}
        </Text>
        {cat.detail ? (
          <Text modifiers={[font({ size: 12 }), foregroundColor(palette.textDim), lineLimit(1)]}>
            {cat.detail}
          </Text>
        ) : null}
        {cat.pill ? <Pill text={cat.pill.text} color={cat.pill.color} soft={cat.pill.soft} /> : null}
      </VStack>
    </VStack>
  );
}

function VitalTile({
  icon,
  color,
  value,
  unit,
  palette,
}: {
  icon: string;
  color: string;
  value: string;
  unit: string;
  palette: Palette;
}) {
  return (
    <VStack spacing={5} modifiers={[frame({ maxWidth: Infinity })]}>
      <Image systemName={icon as never} size={16} color={color} />
      <Text modifiers={[font({ size: 21, weight: 'bold' }), monospacedDigit(), foregroundColor(palette.text)]}>
        {value}
      </Text>
      <Text modifiers={[font({ size: 11 }), foregroundColor(palette.textDim)]}>{unit}</Text>
    </VStack>
  );
}

function VDivider({ palette }: { palette: Palette }) {
  return (
    <VStack modifiers={[frame({ width: 1, height: 30 }), background(palette.separator)]}>
      <Spacer />
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

  const allergy = record.allergies[0];
  const med = record.medications[0];
  const problem = record.problems[0];
  const lab = record.labs[0];

  const cats: Cat[] = [
    {
      ck: 'allergy',
      label: 'Allergies',
      value: allergy?.substance ?? 'None recorded',
      pill: allergy ? severityStyle(palette, allergy.severity) : undefined,
    },
    {
      ck: 'medication',
      label: 'Medications',
      value: med?.name ?? 'None recorded',
      detail: med ? `${med.dose} · ${med.frequency}` : undefined,
    },
    {
      ck: 'problem',
      label: 'Problems',
      value: problem?.label ?? 'None recorded',
      detail: problem ? `since ${problem.since}` : undefined,
    },
    {
      ck: 'lab',
      label: 'Labs',
      value: lab ? `${lab.name} ${lab.value}` : 'None recorded',
      pill: lab ? flagStyle(palette, lab.flag) : undefined,
    },
  ];

  const trend = record.vitalsTrend;
  const trendData = trend.points.map((y, i) => ({ x: i, y }));
  const trendLatest = trend.points.length ? String(trend.points[trend.points.length - 1]) : '—';

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

            {/* Wallet pass — branded teal hero */}
            <VStack
              alignment="leading"
              spacing={16}
              modifiers={[
                padding({ all: 20 }),
                background(palette.heroFrom, shapes.roundedRectangle({ cornerRadius: 24 })),
                shadow({ radius: 18, y: 10, color: palette.shadow }),
              ]}
            >
              <HStack spacing={7}>
                <Image systemName="shield.lefthalf.filled" size={15} color={W.full} />
                <Text modifiers={[font({ size: 14, weight: 'semibold' }), foregroundColor(W.full)]}>
                  temetro
                </Text>
                <Spacer />
                <Image systemName="checkmark.seal.fill" size={12} color={W.t85} />
                <Text modifiers={[font({ size: 12 }), foregroundColor(W.t85)]}>Verified</Text>
              </HStack>

              <HStack spacing={13}>
                <VStack
                  modifiers={[
                    frame({ width: 48, height: 48 }),
                    background(W.t18, shapes.roundedRectangle({ cornerRadius: 24 })),
                  ]}
                >
                  <Text modifiers={[font({ size: 18, weight: 'bold' }), foregroundColor(W.full)]}>
                    {record.initials}
                  </Text>
                </VStack>
                <VStack alignment="leading" spacing={3}>
                  <Text modifiers={[font({ size: 19, weight: 'semibold' }), foregroundColor(W.full)]}>
                    {record.name}
                  </Text>
                  <HStack spacing={6}>
                    <Image systemName="circle.fill" size={8} color={stat.color} />
                    <Text modifiers={[font({ size: 13, weight: 'medium' }), foregroundColor(W.t85)]}>
                      {stat.label}
                    </Text>
                  </HStack>
                </VStack>
                <Spacer />
              </HStack>

              <VStack
                alignment="leading"
                spacing={6}
                modifiers={[
                  padding({ all: 14 }),
                  background(W.t12, shapes.roundedRectangle({ cornerRadius: 14 })),
                  frame({ maxWidth: Infinity, alignment: 'leading' }),
                ]}
              >
                <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundColor(W.t70)]}>
                  WALLET NUMBER
                </Text>
                <HStack>
                  <Text
                    modifiers={[font({ size: 15, design: 'monospaced', weight: 'medium' }), monospacedDigit(), foregroundColor(W.full)]}
                  >
                    {shortWallet(identity.walletNumber)}
                  </Text>
                  <Spacer />
                  <Button
                    label={copied ? 'Copied' : 'Copy'}
                    systemImage={copied ? 'checkmark' : 'doc.on.doc'}
                    onPress={copy}
                    modifiers={[buttonStyle('borderless'), controlSize('small'), tint(W.full)]}
                  />
                </HStack>
              </VStack>
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

            {/* Vitals at-a-glance */}
            <SectionLabel text="VITALS" palette={palette} />
            <HStack spacing={0} modifiers={[padding({ vertical: 16, horizontal: 6 }), ...cardSurface(palette, 18)]}>
              <VitalTile icon="heart.fill" color={palette.category.allergy.color} value={record.vitals.hr} unit="bpm" palette={palette} />
              <VDivider palette={palette} />
              <VitalTile icon="waveform.path.ecg" color={palette.category.medication.color} value={record.vitals.bp} unit="mmHg" palette={palette} />
              <VDivider palette={palette} />
              <VitalTile icon="lungs.fill" color={palette.category.lab.color} value={record.vitals.spo2} unit="SpO₂ %" palette={palette} />
              <VDivider palette={palette} />
              <VitalTile icon="thermometer.medium" color={palette.warning} value={record.vitals.temp} unit="°C" palette={palette} />
            </HStack>

            {/* Trend */}
            <SectionLabel text="TRENDS" palette={palette} />
            <VStack alignment="leading" spacing={12} modifiers={[padding({ all: 16 }), ...cardSurface(palette, 18)]}>
              <HStack>
                <VStack alignment="leading" spacing={2}>
                  <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundColor(palette.textDim)]}>
                    {trend.label}
                  </Text>
                  <HStack spacing={4}>
                    <Text modifiers={[font({ size: 24, weight: 'bold' }), monospacedDigit(), foregroundColor(palette.text)]}>
                      {trendLatest}
                    </Text>
                    <Text modifiers={[font({ size: 13 }), foregroundColor(palette.textDim)]}>{trend.unit}</Text>
                  </HStack>
                </VStack>
                <Spacer />
              </HStack>
              <Chart
                type="line"
                data={trendData}
                lineStyle={{ color: palette.accent, width: 3, pointStyle: 'circle', pointSize: 7 }}
                showGrid={false}
                animate
                modifiers={[frame({ height: 92, maxWidth: Infinity })]}
              />
            </VStack>

            {/* Health record — even 2×2 grid (native SwiftUI Grid keeps columns equal) */}
            <SectionLabel text="HEALTH RECORD" palette={palette} />
            <Grid horizontalSpacing={12} verticalSpacing={12} modifiers={[frame({ maxWidth: Infinity })]}>
              <Grid.Row>
                <CategoryCard cat={cats[0]} palette={palette} />
                <CategoryCard cat={cats[1]} palette={palette} />
              </Grid.Row>
              <Grid.Row>
                <CategoryCard cat={cats[2]} palette={palette} />
                <CategoryCard cat={cats[3]} palette={palette} />
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
