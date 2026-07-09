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
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { useVault } from '@/lib/vault-context';

const PIN_LENGTH = 4;

// Unlock ("login") screen shown on cold start / after logout when a vault exists.
// It surfaces that a saved wallet was found on this device, then takes the PIN or
// passphrase the patient set at vault setup.
export default function LockScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { method, unlock } = useVault();

  const danger = useThemeColor('danger');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isPin = method !== 'passphrase';
  const minOk = isPin ? value.length === PIN_LENGTH : value.length >= 1;

  const attempt = async (candidate: string) => {
    if (busy) return;
    setBusy(true);
    const ok = await unlock(candidate);
    setBusy(false);
    if (ok) {
      router.replace('/');
    } else {
      setError(isPin ? 'Wrong PIN. Try again.' : 'Wrong passphrase. Try again.');
      setValue('');
    }
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
              Welcome back
            </Typography>
            <Typography type="body-sm" color="muted" align="center">
              We found your saved wallet on this device.{'\n'}
              {isPin ? 'Enter your PIN to unlock it.' : 'Enter your passphrase to unlock it.'}
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
                placeholder="Passphrase"
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
              Checking…
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
              <Button.Label>Unlock</Button.Label>
            </Button>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
