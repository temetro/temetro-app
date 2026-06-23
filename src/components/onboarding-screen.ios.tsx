import { Button, Host, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  buttonStyle,
  controlSize,
  font,
  foregroundColor,
  frame,
  multilineTextAlignment,
  padding,
  shapes,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

type Slide = { icon: string; color: keyof ReturnType<typeof slideColors>; title: string; body: string };

function slideColors(p: ReturnType<typeof useTheme>['palette']) {
  return {
    teal: { color: p.accent, soft: p.accentSoft },
    purple: p.category.problem,
    blue: p.category.medication,
  };
}

const SLIDES: Slide[] = [
  {
    icon: 'heart.text.square.fill',
    color: 'teal',
    title: 'Your record, your device',
    body: 'temetro keeps your health record on your phone — owned by you, not locked inside a clinic database.',
  },
  {
    icon: 'lock.shield.fill',
    color: 'purple',
    title: 'Encrypted on this device',
    body: 'Your data is sealed with keys that never leave your phone. Only you can unlock it.',
  },
  {
    icon: 'qrcode.viewfinder',
    color: 'blue',
    title: 'Share in a single tap',
    body: "Scan a clinic's QR to share securely — and you approve every request before anything leaves.",
  },
];

export default function OnboardingScreenIOS({ onDone }: { onDone: () => void }) {
  const { palette } = useTheme();
  const [index, setIndex] = useState(0);
  const colors = slideColors(palette);

  const slide = SLIDES[index];
  const c = colors[slide.color];
  const last = index === SLIDES.length - 1;
  const next = () => (last ? onDone() : setIndex((i) => i + 1));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <Host style={styles.fill}>
        <VStack modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity }), padding({ horizontal: 28, vertical: 12 })]}>
          {/* Skip */}
          <HStack modifiers={[frame({ maxWidth: Infinity })]}>
            <Spacer />
            <Button label="Skip" onPress={onDone} modifiers={[buttonStyle('borderless'), tint(palette.textDim)]} />
          </HStack>

          <Spacer />

          {/* Hero */}
          <VStack spacing={28} modifiers={[frame({ maxWidth: Infinity })]}>
            <VStack
              modifiers={[
                frame({ width: 132, height: 132 }),
                background(c.soft, shapes.roundedRectangle({ cornerRadius: 66 })),
              ]}
            >
              <Image systemName={slide.icon as never} size={58} color={c.color} />
            </VStack>
            <VStack spacing={14} modifiers={[frame({ maxWidth: Infinity })]}>
              <Text modifiers={[font({ size: 28, weight: 'bold' }), foregroundColor(palette.text), multilineTextAlignment('center')]}>
                {slide.title}
              </Text>
              <Text
                modifiers={[
                  font({ size: 16 }),
                  foregroundColor(palette.textDim),
                  multilineTextAlignment('center'),
                  padding({ horizontal: 8 }),
                ]}
              >
                {slide.body}
              </Text>
            </VStack>
          </VStack>

          <Spacer />

          {/* Page dots */}
          <HStack spacing={8} modifiers={[padding({ bottom: 20 })]}>
            {SLIDES.map((_, i) => (
              <VStack
                key={i}
                modifiers={[
                  frame({ width: i === index ? 22 : 8, height: 8 }),
                  background(i === index ? palette.accent : palette.separator, shapes.capsule()),
                ]}
              >
                <Spacer />
              </VStack>
            ))}
          </HStack>

          {/* Primary action */}
          <Button
            label={last ? 'Get started' : 'Continue'}
            onPress={next}
            modifiers={[buttonStyle('borderedProminent'), controlSize('large'), tint(palette.accent), frame({ maxWidth: Infinity }), padding({ bottom: 8 })]}
          />
        </VStack>
      </Host>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  fill: { flex: 1 },
});
