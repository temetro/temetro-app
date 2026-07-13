import { BottomSheet, Button, Surface, useThemeColor } from 'heroui-native';
import { Building2, Check, ShieldCheck, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { SheetHeader } from '@/components/sheet/sheet-parts';
import type { PendingUpdate } from '@/lib/pending-updates';
import { useWallet } from '@/lib/wallet-context';

// A globally-mounted inbox that surfaces clinic→wallet record updates. When a
// clinic pushes an update it lands here (already opened + signature-verified);
// the patient reviews what changed and approves or denies — only an approval
// replaces the on-device record. Mirrors the share-review bottom sheet.
export function UpdatesInbox() {
  const { t } = useTranslation();
  const { pendingUpdates, approveUpdate, denyUpdate } = useWallet();
  const [accent, muted] = useThemeColor(['accent', 'muted']);
  const [snoozed, setSnoozed] = useState(false);

  // Re-open whenever the queue changes (a new update arrives, or one resolves so
  // the next should show). "Later" snoozes until the next change.
  useEffect(() => setSnoozed(false), [pendingUpdates.length]);

  const update: PendingUpdate | undefined = pendingUpdates[0];
  const isOpen = !!update && !snoozed;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={(o) => !o && setSnoozed(true)}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          {update ? (
            <View className="gap-5">
              <SheetHeader
                title={t('updates.title')}
                subtitle={t('updates.subtitle', { clinic: update.clinicName })}
              />

              <Surface variant="secondary" className="gap-3 rounded-2xl">
                <View className="flex-row items-center gap-2">
                  <Building2 size={16} color={muted} />
                  <Text className="flex-1 text-sm font-medium text-foreground">
                    {update.clinicName}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <ShieldCheck size={16} color={muted} />
                  <Text className="flex-1 font-mono text-xs text-muted">
                    {update.fingerprint}
                  </Text>
                </View>
              </Surface>

              {update.keyChanged ? (
                <Surface variant="secondary" className="flex-row items-center gap-3 rounded-2xl">
                  <TriangleAlert size={18} color="#E0352B" />
                  <Text className="flex-1 text-sm font-medium text-foreground">
                    {t('updates.keyChangedWarning')}
                  </Text>
                </Surface>
              ) : null}

              {update.changes.length ? (
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground">
                    {t('updates.whatChanged')}
                  </Text>
                  <ScrollView className="max-h-40">
                    <View className="gap-1.5">
                      {update.changes.map((change, i) => (
                        <View key={`${change}-${i}`} className="flex-row items-start gap-2">
                          <Check size={15} color={accent} style={{ marginTop: 2 }} />
                          <Text className="flex-1 text-sm text-foreground">{change}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              ) : null}

              <Text className="text-center text-xs text-muted">
                {t('updates.replaceNote')}
              </Text>

              <View className="gap-2">
                <Button variant="primary" onPress={() => approveUpdate(update)}>
                  <Button.Label>{t('updates.approve')}</Button.Label>
                </Button>
                <Button variant="secondary" onPress={() => denyUpdate(update)}>
                  <Button.Label>{t('updates.decline')}</Button.Label>
                </Button>
                <Button variant="ghost" onPress={() => setSnoozed(true)}>
                  <Button.Label>{t('updates.later')}</Button.Label>
                </Button>
              </View>
            </View>
          ) : null}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
