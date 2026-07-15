import { useThemeColor } from 'heroui-native';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

// Pagination dots shared by the onboarding carousel and the wallet-creation
// flow, so both read as the same kind of progress.
export function StepDots({ count, index }: { count: number; index: number }) {
  const [accent, separator] = useThemeColor(['accent', 'border']);
  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: count }, (_, i) => (
        <Dot accent={accent} active={i === index} inactive={separator} key={i} />
      ))}
    </View>
  );
}

// An animated pagination dot: the active dot smoothly widens and takes the accent
// color; inactive dots shrink back to the separator color.
function Dot({
  active,
  accent,
  inactive,
}: {
  active: boolean;
  accent: string;
  inactive: string;
}) {
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 22 : 8, { duration: 250 }),
    backgroundColor: withTiming(active ? accent : inactive, { duration: 250 }),
  }));
  return <Animated.View style={[{ height: 8, borderRadius: 4 }, style]} />;
}
