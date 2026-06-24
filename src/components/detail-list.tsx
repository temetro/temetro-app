import { Card } from 'heroui-native';
import { InboxIcon } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type DetailItem = {
  id: string;
  title: string;
  meta?: string;
  subtitle?: string;
  body?: string;
};

// Shared layout for the four card detail pages (visits, prescriptions,
// appointments, documents): a scrollable list of HeroUI Cards reading from the
// on-device record (or local demo data).
export function DetailList({ items, empty }: { items: DetailItem[]; empty: string }) {
  const insets = useSafeAreaInsets();

  if (items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-10">
        <InboxIcon size={40} color="#9aa0a6" />
        <Text className="text-center text-base text-muted">{empty}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentContainerClassName="px-5 pt-4 gap-3"
        showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <Card key={item.id} className="gap-2">
            <View className="flex-row items-start justify-between gap-3">
              <Text className="flex-1 text-base font-semibold text-foreground">{item.title}</Text>
              {item.meta ? <Text className="text-sm text-muted">{item.meta}</Text> : null}
            </View>
            {item.subtitle ? (
              <Text className="text-sm font-medium text-foreground">{item.subtitle}</Text>
            ) : null}
            {item.body ? <Text className="text-sm leading-5 text-muted">{item.body}</Text> : null}
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
