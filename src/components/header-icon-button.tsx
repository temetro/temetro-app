import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

const SIZE = 44;

// A circular header icon button. On iOS 26+ it renders Apple's real **Liquid
// Glass** material (expo-glass-effect); on older iOS / Android it falls back to a
// subtle surface fill. Used for Settings + Notifications on the home header —
// the app's sanctioned native-material exception (see CLAUDE.md).
export function HeaderIconButton({
  icon: Icon,
  color,
  onPress,
  accessibilityLabel,
  badgeCount = 0,
}: {
  icon: LucideIcon;
  color: string;
  onPress: () => void;
  accessibilityLabel: string;
  /** Unread count shown as a badge on the top-right corner (0 = hidden). */
  badgeCount?: number;
}) {
  const glass = isLiquidGlassAvailable();
  const content = <Icon size={20} color={color} />;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="active:opacity-70">
      {badgeCount > 0 ? (
        <View
          className="absolute z-10 min-w-[18px] items-center justify-center rounded-full bg-danger px-1"
          style={{ height: 18, top: -3, right: -3 }}>
          <Text className="text-[10px] font-bold leading-4 text-white">
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      ) : null}
      {glass ? (
        <GlassView
          glassEffectStyle="regular"
          isInteractive
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {content}
        </GlassView>
      ) : (
        <View
          className="items-center justify-center rounded-full bg-surface"
          style={{ width: SIZE, height: SIZE }}>
          {content}
        </View>
      )}
    </Pressable>
  );
}
