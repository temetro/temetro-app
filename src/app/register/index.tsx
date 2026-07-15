import { useRouter } from 'expo-router';
import {
  Button,
  Input,
  Label,
  RadioGroup,
  TextField,
  Typography,
} from 'heroui-native';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StepHeader } from '@/components/step-header';
import { shortWallet } from '@/lib/format';
import type { Sex } from '@/lib/types';
import { useWallet } from '@/lib/wallet-context';

import { REGISTER_STEPS, useRegisterDraft } from './_layout';

// Step 1 of wallet creation: who the patient is. The Ed25519 wallet is already
// minted (on app load) — this only collects the profile that seeds the record.
export default function RegisterNameScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { identity } = useWallet();
  const { draft, setDraft } = useRegisterDraft();

  const canContinue = draft.name.trim().length > 1 && draft.sex !== '';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 px-6" style={{ paddingTop: insets.top + 4 }}>
        <StepHeader count={REGISTER_STEPS} index={0} />

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
              {t('register.title')}
            </Typography>
            <Typography className="text-base leading-6 text-muted">
              {t('register.subtitle')}
            </Typography>
          </View>

          <TextField>
            <Label>{t('register.fullName')}</Label>
            <Input
              autoCapitalize="words"
              autoFocus
              onChangeText={(name) => setDraft({ name })}
              placeholder={t('register.fullNamePlaceholder')}
              returnKeyType="next"
              value={draft.name}
            />
          </TextField>

          <View className="gap-2">
            <Label>{t('register.sex')}</Label>
            <RadioGroup
              onValueChange={(sex) => setDraft({ sex: sex as Sex })}
              value={draft.sex}
            >
              <RadioGroup.Item value="F">{t('register.female')}</RadioGroup.Item>
              <RadioGroup.Item value="M">{t('register.male')}</RadioGroup.Item>
            </RadioGroup>
          </View>
        </ScrollView>

        <View
          className="gap-4 pt-2"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          {identity ? (
            <View className="items-center gap-0.5">
              <Typography className="text-xs font-medium uppercase tracking-wide text-muted">
                {t('register.walletNumber')}
              </Typography>
              <Typography className="font-mono text-sm text-muted">
                {shortWallet(identity.walletNumber)}
              </Typography>
            </View>
          ) : null}
          <Button
            className="rounded-full"
            isDisabled={!canContinue}
            onPress={() => router.push('/register/age')}
            size="lg"
            variant="primary"
          >
            <Button.Label>{t('register.continue')}</Button.Label>
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
