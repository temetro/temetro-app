import { useRouter } from 'expo-router';
import { useThemeColor } from 'heroui-native';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { StepDots } from '@/components/step-dots';

// Top bar for a step in the wallet-creation flow: a back affordance on the left
// (so a typo doesn't mean starting over) with the progress dots centred. The
// spacer on the right keeps the dots optically centred against the back button.
export function StepHeader({
  index,
  count,
  onBack,
}: {
  index: number;
  count: number;
  /** Defaults to popping the stack; pass a handler on the first step. */
  onBack?: () => void;
}) {
  const router = useRouter();
  const foreground = useThemeColor('foreground');
  const canGoBack = onBack || router.canGoBack();

  return (
    <View className="h-11 flex-row items-center justify-between">
      <View className="w-11 items-start">
        {canGoBack ? (
          <Pressable
            className="p-2 active:opacity-60"
            hitSlop={8}
            onPress={onBack ?? (() => router.back())}
          >
            <ChevronLeft color={foreground} size={24} />
          </Pressable>
        ) : null}
      </View>
      <StepDots count={count} index={index} />
      <View className="w-11" />
    </View>
  );
}
