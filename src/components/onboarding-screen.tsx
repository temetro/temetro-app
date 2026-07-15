import { Image } from 'expo-image';
import { Button, Surface, useThemeColor } from 'heroui-native';
import { Activity, Lock, QrCode, ShieldCheck } from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/logo';
import { StepDots } from '@/components/step-dots';

const GLOW = require('@/assets/images/logo-glow.png');

type Slide = {
  key: string;
  titleKey: string;
  bodyKey: string;
  visual: (accent: string) => ReactNode;
};

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    titleKey: 'onboarding.slides.welcomeTitle',
    bodyKey: 'onboarding.slides.welcomeBody',
    visual: () => <Logo size={112} />,
  },
  {
    key: 'own',
    titleKey: 'onboarding.slides.ownTitle',
    bodyKey: 'onboarding.slides.ownBody',
    visual: (accent) => <RecordStackVisual accent={accent} />,
  },
  {
    key: 'encrypted',
    titleKey: 'onboarding.slides.encryptedTitle',
    bodyKey: 'onboarding.slides.encryptedBody',
    visual: (accent) => <Lock size={64} color={accent} />,
  },
  {
    key: 'share',
    titleKey: 'onboarding.slides.shareTitle',
    bodyKey: 'onboarding.slides.shareBody',
    visual: (accent) => <QrCode size={64} color={accent} />,
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [accent, separator] = useThemeColor(['accent', 'border']);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  return (
    <SafeAreaView className="flex-1 bg-background px-7">
      <View className="h-11 flex-row items-center justify-end">
        {!last ? (
          <Pressable hitSlop={8} onPress={onDone} className="p-2 active:opacity-60">
            <Text className="text-base text-muted">{t('onboarding.skip')}</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="w-full max-w-md flex-1 items-center justify-center gap-10 self-center">
        {/* Illustration: a soft brand glow with the slide's mark centered on it */}
        <View className="h-64 w-64 items-center justify-center">
          <Image source={GLOW} style={{ position: 'absolute', width: 256, height: 256 }} contentFit="contain" />
          <Animated.View key={slide.key} entering={FadeIn.duration(320)} className="items-center justify-center">
            {slide.visual(accent)}
          </Animated.View>
        </View>

        <Animated.View key={`copy-${slide.key}`} entering={FadeIn.duration(320)} className="gap-3">
          <Text className="text-center text-3xl font-bold text-foreground">{t(slide.titleKey)}</Text>
          <Text className="px-2 text-center text-base leading-6 text-muted">{t(slide.bodyKey)}</Text>
        </Animated.View>
      </View>

      <View className="mb-5">
        <StepDots count={SLIDES.length} index={index} />
      </View>

      <Button
        variant="primary"
        size="lg"
        className="mb-3 w-full max-w-md self-center rounded-full"
        onPress={() => (last ? onDone() : setIndex((i) => i + 1))}>
        <Button.Label>{last ? t('onboarding.getStarted') : t('onboarding.continue')}</Button.Label>
      </Button>
    </SafeAreaView>
  );
}

// A small stack of mock record cards (echoes the on-device record) for the
// "your record, your device" slide.
function RecordStackVisual({ accent }: { accent: string }) {
  const { t } = useTranslation();
  return (
    <View className="h-44 w-60 items-center justify-center">
      <Surface
        variant="secondary"
        className="absolute w-52 rounded-2xl"
        style={{ transform: [{ rotate: '-6deg' }, { translateY: -10 }] }}>
        <MockRow
          icon={<Activity size={16} color={accent} />}
          label={t('onboarding.mock.vitals')}
          value={t('onboarding.mock.vitalsValue')}
        />
      </Surface>
      <Surface
        variant="default"
        className="w-56 gap-2 rounded-2xl"
        style={{ transform: [{ rotate: '4deg' }] }}>
        <MockRow
          icon={<ShieldCheck size={16} color={accent} />}
          label={t('onboarding.mock.ownedBy')}
          value={t('onboarding.mock.ownedByValue')}
        />
        <MockRow
          icon={<Lock size={16} color={accent} />}
          label={t('onboarding.mock.storage')}
          value={t('onboarding.mock.storageValue')}
        />
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
