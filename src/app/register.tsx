import { useRouter } from 'expo-router';
import {
  Button,
  Description,
  Input,
  Label,
  Spinner,
  Surface,
  TextField,
  Typography,
  useThemeColor,
} from 'heroui-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { shortWallet } from '@/lib/format';
import type { Sex } from '@/lib/types';
import { useWallet } from '@/lib/wallet-context';

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'F', label: 'Female' },
  { value: 'M', label: 'Male' },
];

// First-run profile capture. The Ed25519 wallet is already minted (on app load);
// here the patient enters who they are, and we seed their on-device record.
export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { identity, register } = useWallet();
  const [accent, muted, foreground] = useThemeColor(['accent', 'muted', 'foreground']);

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState<Sex | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const dobValid = /^\d{4}-\d{2}-\d{2}$/.test(dob);
  const canSubmit = name.trim().length > 1 && dobValid && sex !== '' && !submitting;

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await register({ name, dob, sex: sex as Sex });
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingBottom: 40 }}
        contentContainerClassName="px-6 gap-8"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {/* Header */}
        <View className="items-center gap-5">
          <View className="size-20 items-center justify-center rounded-3xl bg-accent/12">
            <Logo size={44} />
          </View>
          <View className="items-center gap-1.5">
            <Typography className="text-3xl font-bold text-foreground">Create your wallet</Typography>
            <Typography className="max-w-xs text-center text-base leading-6 text-muted">
              Your record lives on this device, encrypted with keys only you hold. Tell us who you
              are to get started.
            </Typography>
          </View>
        </View>

        {/* Form */}
        <Surface variant="secondary" className="gap-6 rounded-3xl p-5">
          <TextField>
            <Label>Full name</Label>
            <Input
              placeholder="e.g. Amina Yusuf"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </TextField>

          <TextField isInvalid={dob.length > 0 && !dobValid}>
            <Label>Date of birth</Label>
            <Input
              placeholder="YYYY-MM-DD"
              value={dob}
              onChangeText={setDob}
              keyboardType="numbers-and-punctuation"
              autoCapitalize="none"
            />
            {dob.length > 0 && dobValid ? (
              <View className="flex-row items-center gap-1.5 pt-1">
                <CheckCircle2 size={14} color="#22C55E" />
                <Typography type="body-xs" style={{ color: '#22C55E' }}>
                  Looks good
                </Typography>
              </View>
            ) : (
              <Description>Used to show your age on your record.</Description>
            )}
          </TextField>

          <View className="gap-2">
            <Label>Sex</Label>
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
              Your wallet number
            </Typography>
            <Typography className="font-mono text-base text-foreground">
              {shortWallet(identity.walletNumber)}
            </Typography>
          </Surface>
        ) : null}

        <Button variant="primary" size="lg" isDisabled={!canSubmit} onPress={onSubmit}>
          {submitting ? <Spinner /> : null}
          <Button.Label>{submitting ? 'Creating…' : 'Create wallet'}</Button.Label>
        </Button>
      </ScrollView>
    </View>
  );
}
