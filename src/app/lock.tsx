import {
  Button,
  Input,
  InputOTP,
  REGEXP_ONLY_DIGITS,
  Spinner,
  TextField,
  Typography,
  useThemeColor,
} from 'heroui-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { nextPaint } from '@/lib/paint';
import { useVault } from '@/lib/vault-context';

const PIN_LENGTH = 4;

// Unlock ("login") screen shown on cold start / after logout when a vault exists.
// It surfaces that a saved wallet was found on this device, then takes the PIN or
// passphrase the patient set at vault setup.
export default function LockScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { method, unlock } = useVault();

  const danger = useThemeColor('danger');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isPin = method !== 'passphrase';
  const minOk = isPin ? value.length === PIN_LENGTH : value.length >= 1;

  const attempt = async (candidate: string) => {
    if (busy) return;
    // The OTP input is a real (hidden) TextInput that still holds focus, so drop
    // the keyboard here or it rides along to the home tabs and stays up.
    Keyboard.dismiss();
    setBusy(true);
    // Let the spinner paint before scrypt seizes the JS thread — see nextPaint.
    await nextPaint();
    const ok = await unlock(candidate);
    if (ok) {
      // Leave navigation to the gate: `unlock` flips the vault state and the
      // root layout redirects to '/'. Replacing here as well raced it.
      return;
    }
    setBusy(false);
    setError(isPin ? t('lock.wrongPin') : t('lock.wrongPassphrase'));
    setValue('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background">
      <View
        className="flex-1 items-center justify-center gap-8 px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}>
        <View className="items-center gap-5">
          <Logo size={64} />
          <View className="items-center gap-1.5">
            <Typography type="h3" className="font-bold text-foreground">
              {t('lock.welcomeBack')}
            </Typography>
            <Typography type="body-sm" color="muted" align="center">
              {t('lock.foundWallet')}{'\n'}
              {isPin ? t('lock.enterPin') : t('lock.enterPassphrase')}
            </Typography>
          </View>
        </View>

        {isPin ? (
          <View className="items-center gap-4" style={{ opacity: busy ? 0.5 : 1 }}>
            <InputOTP
              value={value}
              onChange={(v) => {
                setValue(v);
                setError(null);
              }}
              onComplete={attempt}
              maxLength={PIN_LENGTH}
              pattern={REGEXP_ONLY_DIGITS}
              isInvalid={!!error}>
              <InputOTP.Group>
                <InputOTP.Slot index={0} />
                <InputOTP.Slot index={1} />
                <InputOTP.Slot index={2} />
                <InputOTP.Slot index={3} />
              </InputOTP.Group>
            </InputOTP>
          </View>
        ) : (
          <View className="w-full">
            <TextField>
              <Input
                placeholder={t('lock.passphrasePlaceholder')}
                secureTextEntry
                autoFocus
                value={value}
                onChangeText={(v) => {
                  setValue(v);
                  setError(null);
                }}
                onSubmitEditing={() => minOk && attempt(value)}
              />
            </TextField>
          </View>
        )}

        {busy ? (
          <View className="flex-row items-center gap-2">
            <Spinner />
            <Typography type="body-sm" color="muted">
              {t('lock.checking')}
            </Typography>
          </View>
        ) : error ? (
          <Typography type="body-sm" align="center" style={{ color: danger }}>
            {error}
          </Typography>
        ) : null}

        {!isPin ? (
          <View className="w-full">
            <Button size="lg" isDisabled={!minOk || busy} onPress={() => attempt(value)}>
              {busy ? <Spinner /> : null}
              <Button.Label>{t('lock.unlock')}</Button.Label>
            </Button>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
