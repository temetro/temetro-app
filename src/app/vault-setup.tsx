import { useRouter } from 'expo-router';
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
import { LockKeyhole } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { nextPaint } from '@/lib/paint';
import { useVault } from '@/lib/vault-context';

type Method = 'pin' | 'passphrase';
const PIN_LENGTH = 4;

// First-run lock setup: the patient chooses a 4-digit PIN (OTP input) or a
// passphrase that will unlock the app on future launches. Two-step confirm so a
// typo can't lock them out. Pairs with the /lock unlock screen.
export default function VaultSetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { create } = useVault();
  const [accent, danger] = useThemeColor(['accent', 'danger']);

  const [method, setMethod] = useState<Method>('pin');
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter');
  const [first, setFirst] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const minOk = method === 'pin' ? value.length === PIN_LENGTH : value.length >= 4;

  const reset = (m: Method) => {
    setMethod(m);
    setStage('enter');
    setFirst('');
    setValue('');
    setError(null);
  };

  const submit = async (candidate: string) => {
    if (stage === 'enter') {
      setFirst(candidate);
      setValue('');
      setError(null);
      setStage('confirm');
      return;
    }
    if (candidate !== first) {
      setError(t('vaultSetup.noMatch'));
      setValue('');
      setStage('enter');
      setFirst('');
      return;
    }
    // The PIN's OTP input is a real (hidden) TextInput that still holds focus.
    // Drop the keyboard here or it rides along to the home tabs and stays up.
    Keyboard.dismiss();
    setBusy(true);
    // Let the spinner paint before scrypt seizes the JS thread — see nextPaint.
    await nextPaint();
    try {
      await create(candidate, method);
      // No navigation here on purpose: `create` sets the vault unlocked and the
      // gate in the root layout redirects to '/'. Doing it here too raced it.
    } catch {
      // Without this the spinner would spin forever on a keychain failure.
      setBusy(false);
      setError(t('vaultSetup.failed'));
      setValue('');
      setStage('enter');
      setFirst('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background">
      <View
        className="flex-1 items-center justify-center gap-8 px-8"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}>
        <View className="items-center gap-4">
          <View className="size-16 items-center justify-center rounded-3xl bg-accent/12">
            <LockKeyhole size={30} color={accent} />
          </View>
          <View className="items-center gap-1.5">
            <Typography type="h3" className="font-bold text-foreground">
              {stage === 'enter' ? t('vaultSetup.secure') : t('vaultSetup.confirmHeading')}
            </Typography>
            <Typography type="body-sm" color="muted" align="center">
              {method === 'pin'
                ? stage === 'enter'
                  ? t('vaultSetup.choosePin')
                  : t('vaultSetup.confirmPin')
                : stage === 'enter'
                  ? t('vaultSetup.choosePassphrase')
                  : t('vaultSetup.confirmPassphrase')}
            </Typography>
          </View>
        </View>

        {method === 'pin' ? (
          <View className="items-center gap-4" style={{ opacity: busy ? 0.5 : 1 }}>
            <InputOTP
              key={stage}
              value={value}
              onChange={(v) => {
                setValue(v);
                setError(null);
              }}
              onComplete={submit}
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
                placeholder={t('vaultSetup.passphrasePlaceholder')}
                secureTextEntry
                autoFocus
                value={value}
                onChangeText={(v) => {
                  setValue(v);
                  setError(null);
                }}
                onSubmitEditing={() => minOk && submit(value)}
              />
            </TextField>
          </View>
        )}

        {busy ? (
          <View className="flex-row items-center gap-2">
            <Spinner />
            <Typography type="body-sm" color="muted">
              {t('vaultSetup.securing')}
            </Typography>
          </View>
        ) : error ? (
          <Typography type="body-sm" align="center" style={{ color: danger }}>
            {error}
          </Typography>
        ) : null}

        <View className="w-full gap-3">
          {method === 'passphrase' ? (
            <Button size="lg" isDisabled={!minOk || busy} onPress={() => submit(value)}>
              {busy ? <Spinner /> : null}
              <Button.Label>
                {stage === 'enter' ? t('vaultSetup.continue') : t('vaultSetup.confirm')}
              </Button.Label>
            </Button>
          ) : null}
          <Pressable
            onPress={() => reset(method === 'pin' ? 'passphrase' : 'pin')}
            className="active:opacity-70">
            <Typography type="body-sm" align="center" style={{ color: accent }}>
              {method === 'pin' ? t('vaultSetup.usePassphrase') : t('vaultSetup.usePin')}
            </Typography>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
