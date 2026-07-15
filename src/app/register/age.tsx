import { Button, Label, Select, Spinner, Typography } from 'heroui-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StepHeader } from '@/components/step-header';
import { nextPaint } from '@/lib/paint';
import type { Sex } from '@/lib/types';
import { useWallet } from '@/lib/wallet-context';

import { REGISTER_STEPS, useRegisterDraft } from './_layout';

type Opt = { value: string; label: string };

const pad = (n: number) => String(n).padStart(2, '0');

// Localized month names, falling back to numbers if Intl is unavailable.
function monthOptions(locale: string): Opt[] {
  try {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long' });
    return Array.from({ length: 12 }, (_, i) => ({
      value: pad(i + 1),
      label: fmt.format(new Date(2000, i, 1)),
    }));
  } catch {
    return Array.from({ length: 12 }, (_, i) => ({
      value: pad(i + 1),
      label: String(i + 1),
    }));
  }
}

// Step 2 of wallet creation: date of birth, which the record stores as an age.
// The three parts are stacked full-width rather than squeezed onto one row —
// side by side, "Day" and "Year" wrapped mid-word inside their own triggers.
export default function RegisterAgeScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { register } = useWallet();
  const { draft, setDraft } = useRegisterDraft();
  const [submitting, setSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const months = useMemo(() => monthOptions(i18n.language), [i18n.language]);
  const years = useMemo<Opt[]>(
    () =>
      Array.from({ length: currentYear - 1900 + 1 }, (_, i) => {
        const y = String(currentYear - i);
        return { value: y, label: y };
      }),
    [currentYear],
  );
  // Clamp the day list to the days actually in the chosen month/year.
  const daysInMonth = useMemo(() => {
    const y = Number(draft.year) || 2000; // leap-safe default
    const m = Number(draft.month) || 1;
    return new Date(y, m, 0).getDate();
  }, [draft.year, draft.month]);
  const days = useMemo<Opt[]>(
    () =>
      Array.from({ length: daysInMonth }, (_, i) => ({
        value: pad(i + 1),
        label: String(i + 1),
      })),
    [daysInMonth],
  );

  const dobValid =
    !!draft.day &&
    !!draft.month &&
    !!draft.year &&
    Number(draft.day) <= daysInMonth;
  const canSubmit = dobValid && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    // Let the button's spinner paint before the record write — see nextPaint.
    await nextPaint();
    await register({
      name: draft.name,
      dob: `${draft.year}-${draft.month}-${draft.day}`,
      sex: draft.sex as Sex,
    });
    // The gate sends us on to /vault-setup once `registered` flips.
  };

  return (
    <View className="flex-1 bg-background px-6" style={{ paddingTop: insets.top + 4 }}>
      <StepHeader count={REGISTER_STEPS} index={1} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 pt-6"
        contentContainerStyle={{ paddingBottom: 24 }}
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

        <View className="gap-5">
          <DobSelect
            label={t('register.day')}
            onChange={(day) => setDraft({ day })}
            options={days}
            value={draft.day}
          />
          <DobSelect
            label={t('register.month')}
            onChange={(month) => setDraft({ month })}
            options={months}
            value={draft.month}
          />
          <DobSelect
            label={t('register.year')}
            onChange={(year) => setDraft({ year })}
            options={years}
            value={draft.year}
          />
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
  );
}

// One full-width date-part dropdown, opened as a bottom sheet.
function DobSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Opt[];
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = value ? options.find((o) => o.value === value) : undefined;
  return (
    <View className="gap-2">
      <Label>{label}</Label>
      <Select
        onValueChange={(v) => onChange((v as Opt).value)}
        presentation="bottom-sheet"
        value={selected}
      >
        <Select.Trigger>
          <Select.Value placeholder={label} />
          <Select.TriggerIndicator />
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay />
          <Select.Content presentation="bottom-sheet" snapPoints={['60%']}>
            <Select.ListLabel>{label}</Select.ListLabel>
            {options.map((o) => (
              <Select.Item key={o.value} label={o.label} value={o.value} />
            ))}
          </Select.Content>
        </Select.Portal>
      </Select>
    </View>
  );
}
