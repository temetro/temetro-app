import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Pressable, Text, View } from 'react-native';

// A pill action button that renders Apple's real **Liquid Glass** material on
// iOS 26+ (expo-glass-effect); on older iOS / Android it falls back to a subtle
// surface fill. Used for the reset-wallet confirmation dialog's actions — the
// app's sanctioned native-material exception (see CLAUDE.md).
export function GlassButton({
  label,
  onPress,
  color,
  tintColor,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  color: string; // label color
  tintColor?: string; // optional glass tint (e.g. destructive red)
  accessibilityLabel?: string;
}) {
  const glass = isLiquidGlassAvailable();
  const inner = (
    <Text className="text-base font-semibold" style={{ color }}>
      {label}
    </Text>
  );
  const style = {
    height: 50,
    borderRadius: 25,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 20,
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      className="flex-1 active:opacity-70">
      {glass ? (
        <GlassView glassEffectStyle="regular" isInteractive tintColor={tintColor} style={style}>
          {inner}
        </GlassView>
      ) : (
        <View
          className="items-center justify-center rounded-full bg-surface"
          style={[style, tintColor ? { backgroundColor: tintColor } : null]}>
          {inner}
        </View>
      )}
    </Pressable>
  );
}
