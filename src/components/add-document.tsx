import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { BottomSheet, Card, Typography, useThemeColor } from 'heroui-native';
import { Camera, ChevronRight, ImagePlus, ScanLine } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { saveDocBytes } from '@/lib/doc-store';
import type { WalletDocument } from '@/lib/types';
import { useWallet } from '@/lib/wallet-context';

// "Save a document" — the patient photographs their own paperwork (a referral, a
// paper result, an old scan) so it lives in the record with everything else.
// These stay on the device: nothing here is uploaded to a clinic.
export function AddDocumentCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const muted = useThemeColor('muted');
  const { record, identity, updateRecord } = useWallet();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const mine = (record?.documents ?? []).filter((d) => d.source === 'patient');

  const add = async (from: 'camera' | 'library') => {
    if (!identity || !record || busy) return;
    setBusy(true);
    try {
      const permission =
        from === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('addDocument.permissionTitle'), t(`addDocument.permission.${from}`));
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        base64: true,
        mediaTypes: ['images'],
        quality: 0.8,
      };
      const result =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset?.base64) return;

      const id = `pat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const extension = mimeType.split('/')[1] ?? 'jpg';
      const doc: WalletDocument = {
        id,
        filename:
          asset.fileName ?? `${t('addDocument.defaultName')} ${mine.length + 1}.${extension}`,
        mimeType,
        // The encoded size, so the list total matches what's on disk.
        sizeBytes: asset.fileSize ?? Math.round((asset.base64.length * 3) / 4),
        createdAt: new Date().toISOString(),
        source: 'patient',
      };

      // Bytes go in the encrypted store; only metadata rides on the record.
      saveDocBytes(identity.localKey, id, asset.base64);
      updateRecord({ ...record, documents: [doc, ...(record.documents ?? [])] });
      setOpen(false);
      router.push('/documents');
    } catch {
      Alert.alert(t('addDocument.failedTitle'), t('addDocument.failedBody'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable className="active:opacity-80" onPress={() => setOpen(true)}>
        <Card className="flex-row items-center gap-4">
          <View className="size-11 items-center justify-center rounded-2xl bg-sky-500/10">
            <ScanLine color="#0EA5E9" size={22} />
          </View>
          <View className="flex-1 gap-0.5">
            <Typography className="text-sm font-medium text-foreground">
              {t('addDocument.title')}
            </Typography>
            <Typography className="text-xs text-muted">
              {mine.length === 0
                ? t('addDocument.none')
                : t('addDocument.count', { count: mine.length })}
            </Typography>
          </View>
          <ChevronRight color={muted} size={18} />
        </Card>
      </Pressable>

      <BottomSheet isOpen={open} onOpenChange={setOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <View className="gap-5 pt-1">
              <View className="gap-1">
                <BottomSheet.Title>{t('addDocument.sheetTitle')}</BottomSheet.Title>
                <BottomSheet.Description>
                  {t('addDocument.sheetDescription')}
                </BottomSheet.Description>
              </View>
              <View className="gap-3">
                <SourceRow
                  disabled={busy}
                  icon={<Camera color="#0EA5E9" size={20} />}
                  label={t('addDocument.takePhoto')}
                  onPress={() => add('camera')}
                />
                <SourceRow
                  disabled={busy}
                  icon={<ImagePlus color="#0EA5E9" size={20} />}
                  label={t('addDocument.choosePhoto')}
                  onPress={() => add('library')}
                />
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  );
}

function SourceRow({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable className="active:opacity-80" disabled={disabled} onPress={onPress}>
      <Card
        className="flex-row items-center gap-3"
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <View className="size-9 items-center justify-center rounded-xl bg-sky-500/10">
          {icon}
        </View>
        <Typography className="flex-1 text-base font-medium text-foreground">
          {label}
        </Typography>
      </Card>
    </Pressable>
  );
}
