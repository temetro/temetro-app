import { Button, Input, Label, Spinner, TextField, Typography } from 'heroui-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StepHeader } from '@/components/step-header';
import { nextPaint } from '@/lib/paint';
import type { Sex } from '@/lib/types';
import { useWallet } from '@/lib/wallet-context';

import { REGISTER_STEPS, useRegisterDraft } from './_layout';

const pad = (n: number) => String(n).padStart(2, '0');
const digitsOnly = (v: string) => v.replace(/\D/g, '');

// Step 2 of wallet creation: date of birth. Three plain number fields
// (DD / MM / YYYY) rather than pickers — quick to type, nothing to scroll.
export default function RegisterAgeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { register } = useWallet();
  const { draft, setDraft } = useRegisterDraft();
  const [submitting, setSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const day = Number(draft.day);
  const month = Number(draft.month);
  const year = Number(draft.year);

  // Days actually in the chosen month/year (leap-safe); guards e.g. Feb 31.
  const daysInMonth = useMemo(() => {
    const y = year || 2000;
    const m = month || 1;
    return new Date(y, m, 0).getDate();
  }, [year, month]);

  const dobValid =
    !!draft.day &&
    !!draft.month &&
    !!draft.year &&
    month >= 1 &&
    month <= 12 &&
    year >= 1900 &&
    year <= currentYear &&
    day >= 1 &&
    day <= daysInMonth;
  const canSubmit = dobValid && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    // Let the button's spinner paint before the record write — see nextPaint.
    await nextPaint();
    await register({
      name: draft.name,
      // Stored as a zero-padded ISO date, e.g. "1990-05-07".
      dob: `${draft.year}-${pad(month)}-${pad(day)}`,
      sex: draft.sex as Sex,
    });
    // The gate sends us on to /vault-setup once `registered` flips.
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 px-6" style={{ paddingTop: insets.top + 4 }}>
        <StepHeader count={REGISTER_STEPS} index={1} />

        <ScrollView
          automaticallyAdjustKeyboardInsets
          className="flex-1"
          contentContainerClassName="gap-8 pt-6"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-2">
            <Typography className="text-3xl font-bold text-foreground">
              {t('register.dobTitle')}
            </Typography>
            <Typography className="text-base leading-6 text-muted">
              {t('register.dobHelper')}
            </Typography>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <TextField>
                <Label>{t('register.day')}</Label>
                <Input
                  autoFocus
                  keyboardType="number-pad"
                  maxLength={2}
                  onChangeText={(v) => setDraft({ day: digitsOnly(v) })}
                  placeholder="DD"
                  returnKeyType="next"
                  value={draft.day}
                />
              </TextField>
            </View>
            <View className="flex-1">
              <TextField>
                <Label>{t('register.month')}</Label>
                <Input
                  keyboardType="number-pad"
                  maxLength={2}
                  onChangeText={(v) => setDraft({ month: digitsOnly(v) })}
                  placeholder="MM"
                  returnKeyType="next"
                  value={draft.month}
                />
              </TextField>
            </View>
            <View className="flex-[1.4]">
              <TextField>
                <Label>{t('register.year')}</Label>
                <Input
                  keyboardType="number-pad"
                  maxLength={4}
                  onChangeText={(v) => setDraft({ year: digitsOnly(v) })}
                  placeholder="YYYY"
                  returnKeyType="done"
                  value={draft.year}
                />
              </TextField>
            </View>
          </View>
        </ScrollView>

        <View className="pt-2" style={{ paddingBottom: insets.bottom + 12 }}>
          <Button
            className="rounded-full"
            isDisabled={!canSubmit}
            onPress={onSubmit}
            size="lg"
            variant="primary"
          >
            {submitting ? <Spinner /> : null}
            <Button.Label>
              {submitting ? t('register.creating') : t('register.create')}
            </Button.Label>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
