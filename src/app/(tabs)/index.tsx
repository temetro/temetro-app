import { useRouter } from 'expo-router';
import { Card, useThemeColor } from 'heroui-native';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  FileText,
  type LucideIcon,
  Pill,
  ReceiptText,
  Settings,
  Stethoscope,
} from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderIconButton } from '@/components/header-icon-button';
import { Logo } from '@/components/logo';
import { useWallet } from '@/lib/wallet-context';

type Tile = {
  key: string;
  title: string;
  caption: string;
  count: number;
  icon: LucideIcon;
  color: string;
  tintClass: string;
  route: '/visits' | '/prescriptions' | '/appointments' | '/documents';
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { record } = useWallet();
  const [fg, muted] = useThemeColor(['foreground', 'muted']);

  const tiles: Tile[] = [
    {
      key: 'visits',
      title: 'Patient Visits',
      caption: 'clinical encounters',
      count: record?.encounters.length ?? 0,
      icon: Stethoscope,
      color: '#5B6CF0',
      tintClass: 'bg-indigo-500/10',
      route: '/visits',
    },
    {
      key: 'prescriptions',
      title: 'Prescriptions',
      caption: 'active medications',
      count: record?.medications.length ?? 0,
      icon: Pill,
      color: '#2D7FF9',
      tintClass: 'bg-blue-500/10',
      route: '/prescriptions',
    },
    {
      key: 'appointments',
      title: 'Appointments',
      caption: 'upcoming',
      count: record?.appointments?.filter((a) => a.status !== 'cancelled').length ?? 0,
      icon: CalendarDays,
      color: '#0EA5E9',
      tintClass: 'bg-sky-500/10',
      route: '/appointments',
    },
    {
      key: 'documents',
      title: 'Documents',
      caption: 'records & notes',
      count: 0,
      icon: FileText,
      color: '#8B5CF6',
      tintClass: 'bg-violet-500/10',
      route: '/documents',
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 90 }}
        contentContainerClassName="px-5 gap-6"
        showsVerticalScrollIndicator={false}>
        {/* Top bar — Liquid Glass icon buttons flanking the app mark */}
        <View className="flex-row items-center justify-between">
          <HeaderIconButton
            icon={Settings}
            color={fg}
            accessibilityLabel="Settings"
            onPress={() => router.navigate('/settings')}
          />
          <Logo size={52} />
          <HeaderIconButton
            icon={Bell}
            color={fg}
            accessibilityLabel="Notifications"
            onPress={() => router.push('/notifications')}
          />
        </View>

        {/* Greeting */}
        <View className="gap-1">
          <Text className="text-base text-muted">{greeting()},</Text>
          <Text className="text-3xl font-bold text-foreground">{record?.name ?? 'Patient'}</Text>
          <Text className="text-sm text-muted">Your record, stored on this device.</Text>
        </View>

        {/* Grid */}
        <View className="flex-row flex-wrap justify-between gap-y-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Pressable
                key={tile.key}
                onPress={() => router.push(tile.route)}
                className="w-[48%] active:opacity-80">
                <Card className="gap-4">
                  <View className="flex-row items-start justify-between">
                    <View
                      className={`size-11 items-center justify-center rounded-2xl ${tile.tintClass}`}>
                      <Icon size={22} color={tile.color} />
                    </View>
                    <ChevronRight size={18} color={muted} />
                  </View>
                  <View className="gap-0.5">
                    <Text className="text-3xl font-bold text-foreground">{tile.count}</Text>
                    <Text className="text-sm font-medium text-foreground">{tile.title}</Text>
                    <Text className="text-xs text-muted">{tile.caption}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        {/* Invoices — a full-width section button into the billing list */}
        {(() => {
          const invoices = record?.invoices ?? [];
          const unpaid = invoices.filter((i) => i.status === 'sent').length;
          return (
            <Pressable onPress={() => router.push('/invoices')} className="active:opacity-80">
              <Card className="flex-row items-center gap-4">
                <View className="size-11 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <ReceiptText size={22} color="#10B981" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-medium text-foreground">Invoices</Text>
                  <Text className="text-xs text-muted">
                    {invoices.length === 0
                      ? 'No invoices'
                      : unpaid > 0
                        ? `${unpaid} unpaid of ${invoices.length}`
                        : `${invoices.length} · all paid`}
                  </Text>
                </View>
                <ChevronRight size={18} color={muted} />
              </Card>
            </Pressable>
          );
        })()}
      </ScrollView>
    </View>
  );
}
