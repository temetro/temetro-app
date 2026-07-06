import { Button, Surface, useThemeColor } from 'heroui-native';
import { Activity, Lock, QrCode, ShieldCheck } from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';

type Slide = {
  key: string;
  title: string;
  body: string;
  visual: (accent: string) => ReactNode;
};

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    title: 'Welcome to temetro',
    body: 'Your health record — owned by you, carried with you, shared only when you choose.',
    visual: () => <Logo size={104} />,
  },
  {
    key: 'own',
    title: 'Your record, your device',
    body: 'temetro keeps your health record on your phone, not locked inside a clinic database.',
    visual: (accent) => <RecordStackVisual accent={accent} />,
  },
  {
    key: 'encrypted',
    title: 'Encrypted on this device',
    body: 'Your data is sealed with keys that never leave your phone. Only you can unlock it.',
    visual: (accent) => (
      <IconHalo accent={accent}>
        <Lock size={52} color={accent} />
      </IconHalo>
    ),
  },
  {
    key: 'share',
    title: 'Share in a single tap',
    body: "Scan a clinic's QR to share securely — and you approve every request before anything leaves.",
    visual: (accent) => (
      <IconHalo accent={accent}>
        <QrCode size={52} color={accent} />
      </IconHalo>
    ),
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [accent, muted, separator] = useThemeColor(['accent', 'muted', 'border']);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  return (
    <SafeAreaView className="flex-1 bg-background px-7">
      <View className="h-11 flex-row items-center justify-end">
        {!last ? (
          <Pressable hitSlop={8} onPress={onDone} className="p-2 active:opacity-60">
            <Text className="text-base text-muted">Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-1 items-center justify-center gap-9">
        <View className="h-56 items-center justify-center">{slide.visual(accent)}</View>
        <View className="gap-3">
          <Text className="text-center text-3xl font-bold text-foreground">{slide.title}</Text>
          <Text className="px-2 text-center text-base leading-6 text-muted">{slide.body}</Text>
        </View>
      </View>

      <View className="mb-5 flex-row items-center justify-center gap-2">
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={{
              width: i === index ? 22 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === index ? accent : separator,
            }}
          />
        ))}
      </View>

      <Button
        variant="primary"
        size="lg"
        className="mb-3"
        onPress={() => (last ? onDone() : setIndex((i) => i + 1))}>
        <Button.Label>{last ? 'Get started' : 'Continue'}</Button.Label>
      </Button>
    </SafeAreaView>
  );
}

// A soft accent circle behind a large icon — the visual for the security slides.
function IconHalo({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <View
      className="size-40 items-center justify-center rounded-full"
      style={{ backgroundColor: `${accent}1A` }}>
      {children}
    </View>
  );
}

// A small stack of mock record cards (echoes the on-device record) for the
// "your record, your device" slide.
function RecordStackVisual({ accent }: { accent: string }) {
  return (
    <View className="h-44 w-64 items-center justify-center">
      <Surface
        variant="secondary"
        className="absolute w-56 rounded-2xl"
        style={{ transform: [{ rotate: '-6deg' }, { translateY: -10 }] }}>
        <MockRow icon={<Activity size={16} color={accent} />} label="Vitals" value="Stable" />
      </Surface>
      <Surface
        variant="default"
        className="w-60 gap-2 rounded-2xl"
        style={{ transform: [{ rotate: '4deg' }] }}>
        <MockRow
          icon={<ShieldCheck size={16} color={accent} />}
          label="Owned by"
          value="You"
        />
        <MockRow icon={<Lock size={16} color={accent} />} label="Storage" value="This device" />
      </Surface>
    </View>
  );
}

function MockRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-2">
      {icon}
      <Text className="flex-1 text-sm text-muted">{label}</Text>
      <Text className="text-sm font-semibold text-foreground">{value}</Text>
    </View>
  );
}
