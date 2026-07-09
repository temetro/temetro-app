import { BottomSheet, Card, Surface, Typography } from 'heroui-native';
import { InboxIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import {
  SheetHeader,
  SheetRows,
  SheetTimeline,
  type TimelineStep,
} from '@/components/sheet/sheet-parts';
import { useWallet } from '@/lib/wallet-context';

export type DetailRow = { label: string; value: string };

export type DetailItem = {
  id: string;
  title: string;
  meta?: string; // right-aligned on the card (e.g. date)
  subtitle?: string; // secondary line (e.g. provider)
  body?: string; // longer text (summary)
  rows?: DetailRow[]; // key/value rows shown in the detail sheet
  timeline?: TimelineStep[]; // connected-dot timeline shown in the detail sheet
};

// Shared layout for the record detail pages (visits, prescriptions,
// appointments): a scrollable list of HeroUI Cards. Tapping a card opens a
// blurred bottom sheet with the item's full details.
export function DetailList({ items, empty }: { items: DetailItem[]; empty: string }) {
  const insets = useSafeAreaInsets();
  const { reloadRecord } = useWallet();
  const [active, setActive] = useState<DetailItem | null>(null);

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-10">
        <InboxIcon size={40} color="#9aa0a6" />
        <Typography className="text-center text-base text-muted">{empty}</Typography>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <RefreshableScrollView
        onRefresh={reloadRecord}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentContainerClassName="px-5 pt-4 gap-3"
        showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <Pressable key={item.id} onPress={() => setActive(item)} className="active:opacity-80">
            <Card className="gap-2">
              <View className="flex-row items-start justify-between gap-3">
                <Typography className="flex-1 text-base font-semibold text-foreground">{item.title}</Typography>
                {item.meta ? <Typography className="text-sm text-muted">{item.meta}</Typography> : null}
              </View>
              {item.subtitle ? (
                <Typography className="text-sm font-medium text-foreground">{item.subtitle}</Typography>
              ) : null}
              {item.body ? (
                <Typography numberOfLines={2} className="text-sm leading-5 text-muted">
                  {item.body}
                </Typography>
              ) : null}
            </Card>
          </Pressable>
        ))}
      </RefreshableScrollView>

      <BottomSheet
        isOpen={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            {active ? <DetailSheetBody item={active} /> : null}
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
}

function DetailSheetBody({ item }: { item: DetailItem }) {
  const caption = [item.subtitle, item.meta].filter(Boolean).join(' · ');
  return (
    <View className="gap-5 pt-1">
      <SheetHeader title={item.title} subtitle={caption || undefined} />

      {item.timeline?.length ? (
        <Surface variant="secondary" className="rounded-2xl px-0 py-0">
          <SheetTimeline steps={item.timeline} />
        </Surface>
      ) : null}

      {item.rows?.length ? <SheetRows rows={item.rows} /> : null}

      {item.body ? (
        <Typography className="text-sm leading-6 text-foreground">{item.body}</Typography>
      ) : null}
    </View>
  );
}
