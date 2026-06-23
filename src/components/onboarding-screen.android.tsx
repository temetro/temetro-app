import { Box, Button, Column, Host, Row, Text } from '@expo/ui/jetpack-compose';
import { background, clip, fillMaxWidth, size } from '@expo/ui/jetpack-compose/modifiers';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/lib/theme';

const SLIDES = [
  {
    title: 'Your record, your device',
    body: 'temetro keeps your health record on your phone — owned by you, not locked inside a clinic database.',
  },
  {
    title: 'Encrypted on this device',
    body: 'Your data is sealed with keys that never leave your phone. Only you can unlock it.',
  },
  {
    title: 'Share in a single tap',
    body: "Scan a clinic's QR to share securely — and you approve every request before anything leaves.",
  },
];

export default function OnboardingScreenAndroid({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  return (
    <SafeAreaView style={styles.safe}>
      <Host style={styles.fill}>
        <Column
          verticalArrangement="spaceBetween"
          horizontalAlignment="center"
          modifiers={[fillMaxWidth()]}
        >
          <Row horizontalArrangement="end" modifiers={[fillMaxWidth()]}>
            <Button onClick={onDone} colors={{ containerColor: 'transparent', contentColor: palette.textDim }}>
              <Text color={palette.textDim}>Skip</Text>
            </Button>
          </Row>

          <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 24 }}>
            <Box modifiers={[size(132, 132), background(palette.accentSoft), clip({ type: 'circle' })]} />
            <Text color={palette.text} style={{ typography: 'headlineMedium', fontWeight: 'bold' }}>
              {slide.title}
            </Text>
            <Text color={palette.textDim} style={{ typography: 'bodyLarge' }}>
              {slide.body}
            </Text>
          </Column>

          <Column horizontalAlignment="center" verticalArrangement={{ spacedBy: 20 }} modifiers={[fillMaxWidth()]}>
            <Row horizontalArrangement={{ spacedBy: 8 }}>
              {SLIDES.map((_, i) => (
                <Box
                  key={i}
                  modifiers={[
                    size(i === index ? 22 : 8, 8),
                    background(i === index ? palette.accent : palette.separator),
                    clip({ type: 'roundedCorner', radius: 4 }),
                  ]}
                />
              ))}
            </Row>
            <Button
              onClick={() => (last ? onDone() : setIndex((i) => i + 1))}
              colors={{ containerColor: palette.accent, contentColor: palette.onAccent }}
              modifiers={[fillMaxWidth()]}
            >
              <Text color={palette.onAccent}>{last ? 'Get started' : 'Continue'}</Text>
            </Button>
          </Column>
        </Column>
      </Host>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg, paddingHorizontal: 28, paddingVertical: 16 },
  fill: { flex: 1 },
});
