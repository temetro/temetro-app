import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { BottomSheet, Button, Separator, Surface, useThemeColor } from 'heroui-native';
import { Building2, CheckCircle2, QrCode, ShieldCheck, XCircle } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { parsePortalPairing } from '@/lib/portal';
import { parsePairingUri, type Pairing } from '@/lib/relay';
import { useWallet } from '@/lib/wallet-context';

type Phase = 'review' | 'sending' | 'done' | 'error';

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
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

    // A clinic portal QR opens the native Patient Portal over the relay (link,
    // book, results) — see lib/portal.ts.
    const portal = parsePortalPairing(data);
    if (portal) {
      handled.current = true;
      router.push({
        pathname: '/portal',
        params: { relay: portal.relay, clinic: portal.clinic, slug: portal.slug },
      });
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
            {t('camera.accessNeeded')}
          </Text>
          <Text className="text-center text-base leading-6 text-muted">
            {t('camera.accessBody')}
          </Text>
        </View>
        <Button variant="primary" size="lg" onPress={() => requestPermission()}>
          <Button.Label>{t('camera.allow')}</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {focused && !pairing ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'datamatrix', 'pdf417'] }}
          onBarcodeScanned={({ data }) => onBarcodeScanned(data)}
        />
      ) : null}

      {/* Reticle + header chrome */}
      <View
        className="flex-1 items-center justify-between"
        style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 }}
        pointerEvents="none">
        <View className="items-center gap-1.5 px-10">
          <Text className="text-xl font-bold text-white">{t('camera.scanTitle')}</Text>
          <Text className="text-center text-sm text-white/80">{t('camera.scanHint')}</Text>
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
              patientName={record?.name ?? t('camera.recordFallback')}
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
  const { t } = useTranslation();

  if (phase === 'done') {
    return (
      <View className="items-center gap-3 py-4">
        <CheckCircle2 size={48} color={accent} />
        <BottomSheet.Title>{t('camera.shared')}</BottomSheet.Title>
        <BottomSheet.Description className="text-center">
          {t('camera.sharedBody')}
        </BottomSheet.Description>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View className="gap-4 py-2">
        <View className="items-center gap-3">
          <XCircle size={48} color="#E0352B" />
          <BottomSheet.Title>{t('camera.failedTitle')}</BottomSheet.Title>
          <BottomSheet.Description className="text-center">
            {t('camera.failedBody')}
          </BottomSheet.Description>
        </View>
        <Button variant="secondary" onPress={onCancel}>
          <Button.Label>{t('common.close')}</Button.Label>
        </Button>
      </View>
    );
  }

  const isTemporary = pairing?.mode === 'temporary';
  const dur = pairing?.dur ? Number(pairing.dur) : null;
  const modeLabel = isTemporary
    ? dur
      ? t('camera.modeTemporaryHours', { hours: dur })
      : t('camera.modeTemporary')
    : t('camera.modePermanent');

  const lines = [
    t('camera.lineVisits', { count: counts.encounters }),
    t('camera.lineMedications', { count: counts.medications }),
    t('camera.lineProblems', { count: counts.problems }),
    t('camera.lineAllergies', { count: counts.allergies }),
  ];

  return (
    <View className="gap-5">
      <View className="items-center gap-3">
        <View className="size-16 items-center justify-center rounded-full bg-accent/15">
          <ShieldCheck size={32} color={accent} />
        </View>
        <BottomSheet.Title className="text-center">{t('camera.shareTitle')}</BottomSheet.Title>
        <BottomSheet.Description className="text-center">
          {t('camera.shareBody', { name: patientName })}
        </BottomSheet.Description>
      </View>

      <Surface variant="secondary" className="gap-3 rounded-2xl">
        <View className="flex-row items-center gap-2">
          <Building2 size={16} color={accent} />
          <Text className="text-sm font-medium text-foreground">
            {modeLabel} {t('camera.accessSuffix')}
          </Text>
        </View>
        <Separator />
        <Text className="text-xs font-medium uppercase tracking-wide text-muted">
          {t('camera.whatShared')}
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
          <Button.Label>{phase === 'sending' ? t('camera.sharing') : t('camera.approve')}</Button.Label>
        </Button>
        <Button variant="tertiary" isDisabled={phase === 'sending'} onPress={onCancel}>
          <Button.Label>{t('camera.cancel')}</Button.Label>
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
