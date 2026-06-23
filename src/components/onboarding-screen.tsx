import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

// Universal fallback (web / unsupported platforms). iOS and Android use the
// platform-specific SwiftUI / Jetpack Compose trees (onboarding-screen.ios/android).
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

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { palette } = useTheme();
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]}>
      <Pressable style={styles.skip} onPress={onDone}>
        <Text style={{ color: palette.textDim, fontSize: 15 }}>Skip</Text>
      </Pressable>

      <View style={styles.center}>
        <View style={[styles.hero, { backgroundColor: palette.accentSoft }]} />
        <Text style={[styles.title, { color: palette.text }]}>{slide.title}</Text>
        <Text style={[styles.body, { color: palette.textDim }]}>{slide.body}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { width: i === index ? 22 : 8, backgroundColor: i === index ? palette.accent : palette.separator },
            ]}
          />
        ))}
      </View>

      <Pressable
        style={[styles.cta, { backgroundColor: palette.accent }]}
        onPress={() => (last ? onDone() : setIndex((i) => i + 1))}
      >
        <Text style={{ color: palette.onAccent, fontSize: 17, fontWeight: '600' }}>
          {last ? 'Get started' : 'Continue'}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 28, paddingVertical: 16 },
  skip: { alignSelf: 'flex-end', padding: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  hero: { width: 132, height: 132, borderRadius: 66 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 16, textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },
  dots: { flexDirection: 'row', gap: 8, alignSelf: 'center', marginBottom: 20 },
  dot: { height: 8, borderRadius: 4 },
  cta: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
