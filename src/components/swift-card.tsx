import { Image, Text, VStack } from '@expo/ui/swift-ui';
import {
  background,
  font,
  foregroundColor,
  frame,
  glassEffect,
  padding,
  shadow,
  shapes,
} from '@expo/ui/swift-ui/modifiers';

import type { Palette } from '@/lib/theme';

// Elevated card surface (SwiftUI): light leans on a soft drop shadow over a
// white fill, dark leans on frosted glass. Same call site, theme decides.
export function cardSurface(p: Palette, radius = 22) {
  return p.glass
    ? [glassEffect({ glass: { variant: 'regular' }, shape: 'roundedRectangle', cornerRadius: radius })]
    : [
        background(p.card, shapes.roundedRectangle({ cornerRadius: radius })),
        shadow({ radius: 16, y: 8, color: p.shadow }),
      ];
}

// A rounded, soft-tinted icon chip — the new per-category accent treatment.
export function Chip({
  color,
  soft,
  icon,
  size = 38,
}: {
  color: string;
  soft: string;
  icon: string;
  size?: number;
}) {
  return (
    <VStack
      modifiers={[
        frame({ width: size, height: size }),
        background(soft, shapes.roundedRectangle({ cornerRadius: size / 3.2 })),
      ]}
    >
      <Image systemName={icon as never} size={size * 0.46} color={color} />
    </VStack>
  );
}

export function SectionLabel({ text, palette }: { text: string; palette: Palette }) {
  return (
    <Text
      modifiers={[
        font({ size: 13, weight: 'semibold' }),
        foregroundColor(palette.textFaint),
        padding({ leading: 4, top: 4 }),
      ]}
    >
      {text}
    </Text>
  );
}
