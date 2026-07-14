import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Button,
  Input,
  Label,
  Select,
  Spinner,
  Surface,
  TextField,
  Typography,
  useThemeColor,
} from 'heroui-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { shortWallet } from '@/lib/format';
import type { Sex } from '@/lib/types';
import { useWallet } from '@/lib/wallet-context';

const GLOW = require('@/assets/images/logo-glow.png');

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
    return Array.from({ length: 12 }, (_, i) => ({ value: pad(i + 1), label: String(i + 1) }));
  }
}

// First-run profile capture. The Ed25519 wallet is already minted (on app load);
// here the patient enters who they are, and we seed their on-device record.
export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { identity, register } = useWallet();
  const [accent, muted, foreground] = useThemeColor(['accent', 'muted', 'foreground']);

  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
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
    const y = Number(year) || 2000; // leap-safe default
    const m = Number(month) || 1;
    return new Date(y, m, 0).getDate();
  }, [year, month]);
  const days = useMemo<Opt[]>(
    () => Array.from({ length: daysInMonth }, (_, i) => ({ value: pad(i + 1), label: String(i + 1) })),
    [daysInMonth],
  );

  const dobValid = !!day && !!month && !!year && Number(day) <= daysInMonth;
  const dob = dobValid ? `${year}-${month}-${day}` : '';
  const canSubmit = name.trim().length > 1 && dobValid && sex !== '' && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await register({ name, dob, sex: sex as Sex });
    router.replace('/');
  };

  const SEX_OPTIONS: { value: Sex; label: string }[] = [
    { value: 'F', label: t('register.female') },
    { value: 'M', label: t('register.male') },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 40 }}
        contentContainerClassName="px-6 gap-8"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {/* Hero */}
        <View className="items-center gap-5">
          <View className="h-28 w-28 items-center justify-center">
            <Image source={GLOW} style={{ position: 'absolute', width: 168, height: 168 }} contentFit="contain" />
            <Logo size={64} />
          </View>
          <View className="items-center gap-1.5">
            <Typography className="text-3xl font-bold text-foreground">{t('register.title')}</Typography>
            <Typography className="max-w-xs text-center text-base leading-6 text-muted">
              {t('register.subtitle')}
            </Typography>
          </View>
        </View>

        {/* Form */}
        <Surface variant="secondary" className="gap-6 rounded-3xl p-5">
          <TextField>
            <Label>{t('register.fullName')}</Label>
            <Input
              placeholder={t('register.fullNamePlaceholder')}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </TextField>

          {/* Date of birth — structured day / month / year selects (no free text) */}
          <View className="gap-2">
            <Label>{t('register.dob')}</Label>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <DobSelect
                  placeholder={t('register.day')}
                  options={days}
                  value={day}
                  onChange={setDay}
                />
              </View>
              <View className="flex-[1.4]">
                <DobSelect
                  placeholder={t('register.month')}
                  options={months}
                  value={month}
                  onChange={setMonth}
                />
              </View>
              <View className="flex-1">
                <DobSelect
                  placeholder={t('register.year')}
                  options={years}
                  value={year}
                  onChange={setYear}
                />
              </View>
            </View>
            <Typography type="body-xs" color="muted">
              {t('register.dobHelper')}
            </Typography>
          </View>

          <View className="gap-2">
            <Label>{t('register.sex')}</Label>
            <View className="flex-row gap-3">
              {SEX_OPTIONS.map((opt) => {
                const selected = sex === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setSex(opt.value)}
                    className="flex-1 active:opacity-80">
                    <View
                      className="items-center rounded-2xl px-4 py-3.5"
                      style={{
                        borderWidth: 1.5,
                        borderColor: selected ? accent : `${muted}44`,
                        backgroundColor: selected ? `${accent}1F` : 'transparent',
                      }}>
                      <Typography
                        className="font-semibold"
                        style={{ color: selected ? accent : foreground }}>
                        {opt.label}
                      </Typography>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Surface>

        {identity ? (
          <Surface variant="secondary" className="gap-1 rounded-2xl">
            <Typography className="text-xs font-medium uppercase tracking-wide text-muted">
              {t('register.walletNumber')}
            </Typography>
            <Typography className="font-mono text-base text-foreground">
              {shortWallet(identity.walletNumber)}
            </Typography>
          </Surface>
        ) : null}

        <Button
          variant="primary"
          size="lg"
          className="rounded-full"
          isDisabled={!canSubmit}
          onPress={onSubmit}>
          {submitting ? <Spinner /> : null}
          <Button.Label>{submitting ? t('register.creating') : t('register.create')}</Button.Label>
        </Button>
      </ScrollView>
    </View>
  );
}

// A single date-part dropdown built from HeroUI Select in a bottom sheet.
function DobSelect({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: Opt[];
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = value ? options.find((o) => o.value === value) : undefined;
  return (
    <Select
      value={selected}
      onValueChange={(v) => onChange((v as Opt).value)}
      presentation="bottom-sheet">
      <Select.Trigger>
        <Select.Value placeholder={placeholder} />
        <Select.TriggerIndicator />
      </Select.Trigger>
      <Select.Portal>
        <Select.Overlay />
        <Select.Content presentation="bottom-sheet" snapPoints={['60%']}>
          <Select.ListLabel>{placeholder}</Select.ListLabel>
          {options.map((o) => (
            <Select.Item key={o.value} value={o.value} label={o.label} />
          ))}
        </Select.Content>
      </Select.Portal>
    </Select>
  );
}
