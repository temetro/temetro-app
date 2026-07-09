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
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVault } from '@/lib/vault-context';

type Method = 'pin' | 'passphrase';
const PIN_LENGTH = 4;

// First-run lock setup: the patient chooses a 4-digit PIN (OTP input) or a
// passphrase that will unlock the app on future launches. Two-step confirm so a
// typo can't lock them out. Pairs with the /lock unlock screen.
export default function VaultSetupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
      setError("Those didn't match. Try again.");
      setValue('');
      setStage('enter');
      setFirst('');
      return;
    }
    setBusy(true);
    await create(candidate, method);
    setBusy(false);
    router.replace('/');
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
              {stage === 'enter' ? 'Secure your wallet' : 'Confirm it'}
            </Typography>
            <Typography type="body-sm" color="muted" align="center">
              {method === 'pin'
                ? stage === 'enter'
                  ? 'Choose a 4-digit PIN to open the app.'
                  : 'Enter your PIN again to confirm.'
                : stage === 'enter'
                  ? 'Choose a passphrase to open the app.'
                  : 'Enter your passphrase again to confirm.'}
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
                placeholder="Passphrase"
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
              Securing your wallet…
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
              <Button.Label>{stage === 'enter' ? 'Continue' : 'Confirm'}</Button.Label>
            </Button>
          ) : null}
          <Pressable
            onPress={() => reset(method === 'pin' ? 'passphrase' : 'pin')}
            className="active:opacity-70">
            <Typography type="body-sm" align="center" style={{ color: accent }}>
              {method === 'pin' ? 'Use a passphrase instead' : 'Use a 4-digit PIN instead'}
            </Typography>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
