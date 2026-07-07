import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { BottomSheet, Button, Separator, Surface, useThemeColor } from 'heroui-native';
import { Building2, CheckCircle2, QrCode, ShieldCheck, XCircle } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shareModeLabel } from '@/lib/format';
import { parsePortalUri } from '@/lib/portal';
import { parsePairingUri, type Pairing } from '@/lib/relay';
import { useWallet } from '@/lib/wallet-context';

type Phase = 'review' | 'sending' | 'done' | 'error';

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const accent = useThemeColor('accent');
  const { record, respondToPairing } = useWallet();
  const [permission, requestPermission] = useCameraPermissions();

  const [focused, setFocused] = useState(false);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [phase, setPhase] = useState<Phase>('review');
  const handled = useRef(false);

  // Only run the camera while this tab is focused. Reset the one-shot guard on
  // re-focus so a returning user can scan again.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      handled.current = false;
      return () => setFocused(false);
    }, []),
  );

  const onBarcodeScanned = (data: string) => {
    if (handled.current) return;

    // A clinic portal QR opens the native Patient Portal (browse doctors + book).
    const portal = parsePortalUri(data);
    if (portal) {
      handled.current = true;
      router.push({ pathname: '/portal', params: { api: portal.api, slug: portal.slug } });
      return;
    }

    // A wallet-pairing QR opens the encrypted share sheet.
    const parsed = parsePairingUri(data);
    if (!parsed) return; // ignore non-temetro QRs
    handled.current = true;
    setPairing(parsed);
    setPhase('review');
  };

  const closeSheet = () => {
    setPairing(null);
    handled.current = false;
  };

  const approve = async () => {
    if (!pairing) return;
    setPhase('sending');
    const ok = await respondToPairing(pairing);
    setPhase(ok ? 'done' : 'error');
    if (ok) setTimeout(closeSheet, 1600);
  };

  // Permission gate — native HeroUI prompt.
  if (!permission?.granted) {
    return (
      <View
        className="flex-1 items-center justify-center gap-5 bg-background px-8"
        style={{ paddingTop: insets.top }}>
        <View className="size-20 items-center justify-center rounded-3xl bg-accent/15">
          <QrCode size={40} color={accent} />
        </View>
        <View className="gap-2">
          <Text className="text-center text-2xl font-bold text-foreground">
            Camera access needed
          </Text>
          <Text className="text-center text-base leading-6 text-muted">
            temetro uses the camera to scan a clinic&apos;s QR code so you can share your record.
          </Text>
        </View>
        <Button variant="primary" size="lg" onPress={() => requestPermission()}>
          <Button.Label>Allow camera</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {focused && !pairing ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => onBarcodeScanned(data)}
        />
      ) : null}

      {/* Reticle + header chrome */}
      <View
        className="flex-1 items-center justify-between"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
        pointerEvents="none">
        <View className="items-center gap-1.5 px-10">
          <Text className="text-xl font-bold text-white">Scan clinic QR</Text>
          <Text className="text-center text-sm text-white/80">
            Point your camera at the QR shown on the clinic screen.
          </Text>
        </View>

        <View className="size-64 rounded-[28px] border-2 border-white/30">
          <View style={[styles.corner, styles.tl, { borderColor: accent }]} />
          <View style={[styles.corner, styles.tr, { borderColor: accent }]} />
          <View style={[styles.corner, styles.bl, { borderColor: accent }]} />
          <View style={[styles.corner, styles.br, { borderColor: accent }]} />
        </View>

        <View />
      </View>

      {/* Share review sheet */}
      <BottomSheet isOpen={!!pairing} onOpenChange={(open) => !open && closeSheet()}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <ShareSheet
              phase={phase}
              pairing={pairing}
              patientName={record?.name ?? 'your record'}
              counts={{
                medications: record?.medications.length ?? 0,
                problems: record?.problems.length ?? 0,
                allergies: record?.allergies.length ?? 0,
                encounters: record?.encounters.length ?? 0,
              }}
              accent={accent}
              onApprove={approve}
              onCancel={closeSheet}
            />
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
}

function ShareSheet({
  phase,
  pairing,
  patientName,
  counts,
  accent,
  onApprove,
  onCancel,
}: {
  phase: Phase;
  pairing: Pairing | null;
  patientName: string;
  counts: { medications: number; problems: number; allergies: number; encounters: number };
  accent: string;
  onApprove: () => void;
  onCancel: () => void;
}) {
  if (phase === 'done') {
    return (
      <View className="items-center gap-3 py-4">
        <CheckCircle2 size={48} color={accent} />
        <BottomSheet.Title>Record shared</BottomSheet.Title>
        <BottomSheet.Description className="text-center">
          The clinic has received your encrypted record.
        </BottomSheet.Description>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View className="gap-4 py-2">
        <View className="items-center gap-3">
          <XCircle size={48} color="#E0352B" />
          <BottomSheet.Title>Couldn&apos;t share</BottomSheet.Title>
          <BottomSheet.Description className="text-center">
            We couldn&apos;t reach the clinic relay. Check your connection and try again.
          </BottomSheet.Description>
        </View>
        <Button variant="secondary" onPress={onCancel}>
          <Button.Label>Close</Button.Label>
        </Button>
      </View>
    );
  }

  const mode = (pairing?.mode === 'temporary' ? 'temporary' : 'permanent') as
    | 'temporary'
    | 'permanent';
  const dur = pairing?.dur ? Number(pairing.dur) : null;

  const lines = [
    `${counts.encounters} clinical visit${counts.encounters === 1 ? '' : 's'}`,
    `${counts.medications} medication${counts.medications === 1 ? '' : 's'}`,
    `${counts.problems} problem${counts.problems === 1 ? '' : 's'}`,
    `${counts.allergies} allerg${counts.allergies === 1 ? 'y' : 'ies'}`,
  ];

  return (
    <View className="gap-5">
      <View className="items-center gap-3">
        <View className="size-16 items-center justify-center rounded-full bg-accent/15">
          <ShieldCheck size={32} color={accent} />
        </View>
        <BottomSheet.Title className="text-center">Share your record?</BottomSheet.Title>
        <BottomSheet.Description className="text-center">
          A clinic is requesting {patientName}. Your record is encrypted to them and signed by your
          wallet — nothing is shared until you approve.
        </BottomSheet.Description>
      </View>

      <Surface variant="secondary" className="gap-3 rounded-2xl">
        <View className="flex-row items-center gap-2">
          <Building2 size={16} color={accent} />
          <Text className="text-sm font-medium text-foreground">
            {shareModeLabel(mode, dur)} access
          </Text>
        </View>
        <Separator />
        <Text className="text-xs font-medium uppercase tracking-wide text-muted">
          What will be shared
        </Text>
        <View className="gap-1">
          {lines.map((l) => (
            <Text key={l} className="text-sm text-foreground">
              • {l}
            </Text>
          ))}
        </View>
      </Surface>

      <View className="gap-3">
        <Button variant="primary" size="lg" isDisabled={phase === 'sending'} onPress={onApprove}>
          <Button.Label>{phase === 'sending' ? 'Sharing…' : 'Approve & share'}</Button.Label>
        </Button>
        <Button variant="tertiary" isDisabled={phase === 'sending'} onPress={onCancel}>
          <Button.Label>Cancel</Button.Label>
        </Button>
      </View>
    </View>
  );
}

const C = 36;
const W = 4;
const styles = StyleSheet.create({
  corner: { position: 'absolute', width: C, height: C },
  tl: { top: -2, left: -2, borderTopWidth: W, borderLeftWidth: W, borderTopLeftRadius: 18 },
  tr: { top: -2, right: -2, borderTopWidth: W, borderRightWidth: W, borderTopRightRadius: 18 },
  bl: { bottom: -2, left: -2, borderBottomWidth: W, borderLeftWidth: W, borderBottomLeftRadius: 18 },
  br: { bottom: -2, right: -2, borderBottomWidth: W, borderRightWidth: W, borderBottomRightRadius: 18 },
});
