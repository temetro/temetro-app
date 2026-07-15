import {
  BottomSheet,
  Button,
  Input,
  Label,
  Separator,
  Surface,
  TextField,
  Typography,
  useBottomSheetAwareHandlers,
  useThemeColor,
} from 'heroui-native';
import { X, type LucideIcon } from 'lucide-react-native';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, View } from 'react-native';

// Shared bottom-sheet building blocks so every sheet reads the same. HeroUI's
// BottomSheet.Content already draws the drag grabber; these style the content
// below it — a header (optional subject icon + title + round close), grouped
// section labels, key/value rows, a connected-dot timeline, and an action bar.

// A labelled text field for use inside a BottomSheet.
//
// An Input in a sheet needs `useBottomSheetAwareHandlers` wired to focus/blur,
// or the sheet doesn't know the keyboard is coming and it covers the field the
// patient is typing into. The hook only works from a component *inside* the
// sheet's context (outside it the handlers silently no-op), which is why this is
// its own component rather than props on the call site. Pair it with
// `keyboardBehavior="extend"` on BottomSheet.Content.
export function SheetInput({
  label,
  ...inputProps
}: { label: string } & ComponentProps<typeof Input>) {
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  return (
    <TextField>
      <Label>{label}</Label>
      <Input {...inputProps} onBlur={onBlur} onFocus={onFocus} />
    </TextField>
  );
}

export function SheetHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
}) {
  const [foreground, accent] = useThemeColor(['foreground', 'accent']);
  return (
    <View className="flex-row items-start gap-3.5">
      {Icon ? (
        <View className="size-12 items-center justify-center rounded-2xl bg-accent/12">
          <Icon size={23} color={accent} />
        </View>
      ) : null}
      <View className="flex-1 gap-1 pt-0.5">
        <Typography type="h4" className="font-bold tracking-tight text-foreground">
          {title}
        </Typography>
        {subtitle ? (
          <Typography type="body-sm" color="muted">
            {subtitle}
          </Typography>
        ) : null}
      </View>
      <BottomSheet.Close>
        <View className="size-8 items-center justify-center rounded-full border border-border bg-surface active:opacity-70">
          <X size={16} color={foreground} />
        </View>
      </BottomSheet.Close>
    </View>
  );
}

// A labelled group: a small uppercase caption above its content.
export function SheetSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-2">
      <Typography
        type="body-xs"
        className="px-1 font-semibold uppercase tracking-wide text-muted">
        {label}
      </Typography>
      {children}
    </View>
  );
}

export type SheetRow = { label: string; value: string };

// Key/value rows in a single rounded surface, hairline-separated.
export function SheetRows({ rows }: { rows: SheetRow[] }) {
  return (
    <Surface variant="secondary" className="overflow-hidden rounded-3xl px-0 py-0">
      {rows.map((row, i) => (
        <View key={row.label}>
          {i > 0 ? <Separator /> : null}
          <View className="flex-row items-center justify-between gap-4 px-4 py-3.5">
            <Typography className="text-sm text-muted">{row.label}</Typography>
            <Typography className="flex-1 text-right text-sm font-semibold text-foreground">
              {row.value}
            </Typography>
          </View>
        </View>
      ))}
    </Surface>
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
    <View className="px-4 py-3">
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <View key={`${s.title}-${i}`} className="flex-row gap-3">
            <View className="items-center">
              <View
                style={{
                  width: 14,
                  height: 14,
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
    <View className="items-center gap-1 rounded-3xl border border-accent/15 bg-accent/10 px-5 py-7">
      <Typography type="body-sm" color="muted">
        {label}
      </Typography>
      <Typography type="h2" className="font-bold tracking-tight text-foreground">
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

// Bottom action bar: an optional round secondary icon button beside a full-width
// primary pill, with an optional ghost action stacked beneath.
export function SheetActionBar({
  primaryLabel,
  onPrimary,
  primaryDisabled,
  icon: Icon,
  onIcon,
  iconAccessibilityLabel,
  secondaryLabel,
  onSecondary,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  icon?: LucideIcon;
  onIcon?: () => void;
  iconAccessibilityLabel?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  const foreground = useThemeColor('foreground');
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-3">
        {Icon ? (
          <Pressable
            onPress={onIcon}
            accessibilityRole="button"
            accessibilityLabel={iconAccessibilityLabel}
            className="size-12 items-center justify-center rounded-full border border-border bg-surface active:opacity-70">
            <Icon size={20} color={foreground} />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Button size="lg" isDisabled={primaryDisabled} onPress={onPrimary}>
            <Button.Label>{primaryLabel}</Button.Label>
          </Button>
        </View>
      </View>
      {secondaryLabel ? (
        <Button variant="ghost" onPress={onSecondary}>
          <Button.Label>{secondaryLabel}</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}
