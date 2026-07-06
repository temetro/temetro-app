import { useBottomSheet, useBottomSheetAnimation } from 'heroui-native';
import { BlurView } from 'expo-blur';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedProps } from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// A blurred overlay for HeroUI's BottomSheet (replaces the default dim overlay).
// The blur intensity is driven by the sheet's open progress so it fades in with
// the sheet. Pressing it dismisses the sheet. Follows HeroUI's "Custom Overlay"
// pattern from the BottomSheet docs.
export function BottomSheetBlurOverlay() {
  const { theme } = useUniwind();
  const { onOpenChange } = useBottomSheet();
  const { progress } = useBottomSheetAnimation();

  const animatedProps = useAnimatedProps(() => ({
    // progress: 0 = idle, 1 = open, 2 = closing.
    intensity: interpolate(progress.get(), [0, 1, 2], [0, 32, 0]),
  }));

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={() => onOpenChange(false)}>
      <AnimatedBlurView
        animatedProps={animatedProps}
        tint={theme === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
    </Pressable>
  );
}
