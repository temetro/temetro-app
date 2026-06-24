import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Card, Surface, useThemeColor } from 'heroui-native';
import {
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  FileText,
  type LucideIcon,
  Pill,
  Settings,
  Stethoscope,
  TriangleAlert,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shortWallet } from '@/lib/format';
import { SAMPLE_APPOINTMENTS, SAMPLE_DOCUMENTS } from '@/lib/sample';
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
  const { record, identity } = useWallet();
  const [fg, muted, accent] = useThemeColor(['foreground', 'muted', 'accent']);
  const [copied, setCopied] = useState(false);

  const copyWallet = async () => {
    if (!identity) return;
    await Clipboard.setStringAsync(identity.walletNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

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
      count: SAMPLE_APPOINTMENTS.length,
      icon: CalendarDays,
      color: '#0E8E82',
      tintClass: 'bg-teal-500/10',
      route: '/appointments',
    },
    {
      key: 'documents',
      title: 'Documents',
      caption: 'records & notes',
      count: SAMPLE_DOCUMENTS.length,
      icon: FileText,
      color: '#8B5CF6',
      tintClass: 'bg-violet-500/10',
      route: '/documents',
    },
  ];

  const alert = record?.alerts?.[0];

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 90 }}
        contentContainerClassName="px-5 gap-6"
        showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.navigate('/settings')}
            hitSlop={8}
            className="size-11 items-center justify-center rounded-full bg-surface active:opacity-70">
            <Settings size={20} color={fg} />
          </Pressable>

          <Pressable
            onPress={copyWallet}
            className="flex-row items-center gap-2 rounded-full bg-surface px-3.5 py-2 active:opacity-70">
            {copied ? <Check size={14} color={accent} /> : <Copy size={14} color={muted} />}
            <Text className="font-mono text-xs text-foreground">
              {identity ? shortWallet(identity.walletNumber) : 'tmw_…'}
            </Text>
          </Pressable>
        </View>

        {/* Greeting */}
        <View className="gap-1">
          <Text className="text-base text-muted">{greeting()},</Text>
          <Text className="text-3xl font-bold text-foreground">{record?.name ?? 'Patient'}</Text>
          <Text className="text-sm text-muted">Your record, stored on this device.</Text>
        </View>

        {/* Allergy / alert banner */}
        {alert ? (
          <Surface variant="secondary" className="flex-row items-center gap-3 rounded-2xl">
            <TriangleAlert size={18} color="#E0352B" />
            <Text className="flex-1 text-sm font-medium text-foreground">{alert}</Text>
          </Surface>
        ) : null}

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
      </ScrollView>
    </View>
  );
}
