import { BottomSheet, Button, Typography, useThemeColor } from 'heroui-native';
import { X, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Logo } from '@/components/logo';

// Shared bottom-sheet building blocks so every sheet reads the same: a header
// with the app mark + a round close button, an optional connected-dot timeline,
// a soft highlight card, and a bottom action bar (round icon button + pill).
// Modelled on the reference designs (see the app's sheet mockups).

export function SheetHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const foreground = useThemeColor('foreground');
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Logo size={26} />
        <BottomSheet.Close>
          <View className="size-8 items-center justify-center rounded-full bg-surface active:opacity-70">
            <X size={16} color={foreground} />
          </View>
        </BottomSheet.Close>
      </View>
      <View className="gap-1 pr-2">
        <Typography type="h4" className="font-bold text-foreground">
          {title}
        </Typography>
        {subtitle ? (
          <Typography type="body-sm" color="muted">
            {subtitle}
          </Typography>
        ) : null}
      </View>
    </View>
  );
}

export type TimelineStep = {
  title: string;
  subtitle?: string;
  meta?: string;
  active?: boolean;
};

// A vertical timeline with connected dots (pickup → dropoff style).
export function SheetTimeline({ steps }: { steps: TimelineStep[] }) {
  const [accent, border] = useThemeColor(['accent', 'border']);
  return (
    <View>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <View key={`${s.title}-${i}`} className="flex-row gap-3">
            <View className="items-center">
              <View
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 7,
                  borderWidth: 2,
                  borderColor: accent,
                  backgroundColor: s.active ? accent : 'transparent',
                  marginTop: 2,
                }}
              />
              {!last ? (
                <View style={{ width: 2, flex: 1, minHeight: 22, backgroundColor: border }} />
              ) : null}
            </View>
            <View className={last ? 'flex-1' : 'flex-1 pb-4'}>
              <View className="flex-row items-center justify-between gap-3">
                <Typography type="body-sm" className="font-semibold text-foreground">
                  {s.title}
                </Typography>
                {s.meta ? (
                  <Typography type="body-xs" color="muted">
                    {s.meta}
                  </Typography>
                ) : null}
              </View>
              {s.subtitle ? (
                <Typography type="body-sm" color="muted">
                  {s.subtitle}
                </Typography>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// A soft tinted highlight card (stands in for the reference's gradient panel).
export function SheetHighlight({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <View className="items-center gap-1 rounded-3xl bg-accent/10 px-5 py-6">
      <Typography type="body-sm" color="muted">
        {label}
      </Typography>
      <Typography type="h2" className="font-bold text-foreground">
        {value}
      </Typography>
      {hint ? (
        <Typography type="body-xs" color="muted">
          {hint}
        </Typography>
      ) : null}
    </View>
  );
}

// Bottom action bar: an optional round secondary icon button next to a
// full-width primary pill.
export function SheetActionBar({
  primaryLabel,
  onPrimary,
  icon: Icon,
  onIcon,
  iconAccessibilityLabel,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  icon?: LucideIcon;
  onIcon?: () => void;
  iconAccessibilityLabel?: string;
}) {
  const foreground = useThemeColor('foreground');
  return (
    <View className="flex-row items-center gap-3">
      {Icon ? (
        <Pressable
          onPress={onIcon}
          accessibilityRole="button"
          accessibilityLabel={iconAccessibilityLabel}
          className="size-12 items-center justify-center rounded-full bg-surface active:opacity-70">
          <Icon size={20} color={foreground} />
        </Pressable>
      ) : null}
      <View className="flex-1">
        <Button size="lg" onPress={onPrimary}>
          <Button.Label>{primaryLabel}</Button.Label>
        </Button>
      </View>
    </View>
  );
}
