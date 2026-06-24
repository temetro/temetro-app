import { useRouter } from 'expo-router';
import {
  Button,
  Description,
  Input,
  Label,
  RadioGroup,
  Surface,
  TextField,
  useThemeColor,
} from 'heroui-native';
import { ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shortWallet } from '@/lib/format';
import type { Sex } from '@/lib/types';
import { useWallet } from '@/lib/wallet-context';

// First-run profile capture. The Ed25519 wallet is already minted (on app load);
// here the patient enters who they are, and we seed their on-device record.
export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { identity, register } = useWallet();
  const accent = useThemeColor('accent');

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
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 32 }}
          contentContainerClassName="px-6 gap-7"
          keyboardShouldPersistTaps="handled">
          <View className="gap-4">
            <View className="size-16 items-center justify-center rounded-3xl bg-accent/15">
              <ShieldCheck size={30} color={accent} />
            </View>
            <View className="gap-1.5">
              <Text className="text-3xl font-bold text-foreground">Create your wallet</Text>
              <Text className="text-base leading-6 text-muted">
                Your record lives on this device, encrypted with keys only you hold. Tell us who
                you are to get started.
              </Text>
            </View>
          </View>

          <View className="gap-5">
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
              <Description>Used to show your age on your record.</Description>
            </TextField>

            <View className="gap-2">
              <Label>Sex</Label>
              <RadioGroup
                value={sex}
                onValueChange={(v) => setSex(v as Sex)}
                orientation="horizontal"
                className="gap-6">
                <RadioGroup.Item value="F">Female</RadioGroup.Item>
                <RadioGroup.Item value="M">Male</RadioGroup.Item>
              </RadioGroup>
            </View>
          </View>

          {identity ? (
            <Surface variant="secondary" className="gap-1 rounded-2xl">
              <Text className="text-xs font-medium uppercase tracking-wide text-muted">
                Your wallet number
              </Text>
              <Text className="font-mono text-base text-foreground">
                {shortWallet(identity.walletNumber)}
              </Text>
            </Surface>
          ) : null}

          <Button variant="primary" size="lg" isDisabled={!canSubmit} onPress={onSubmit}>
            <Button.Label>{submitting ? 'Creating…' : 'Create wallet'}</Button.Label>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
