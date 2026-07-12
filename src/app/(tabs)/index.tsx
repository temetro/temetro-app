import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import {
  BottomSheet,
  Card,
  Separator,
  Surface,
  Typography,
  useThemeColor,
} from 'heroui-native';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Copy,
  FileText,
  Fingerprint,
  Info,
  KeyRound,
  type LucideIcon,
  Pill,
  QrCode,
  ReceiptText,
  RefreshCw,
  ScanLine,
  Settings,
  Share2,
  Stethoscope,
  Wallet,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderIconButton } from '@/components/header-icon-button';
import { Logo } from '@/components/logo';
import { SheetHeader } from '@/components/sheet/sheet-parts';
import { formatDate, shortWallet } from '@/lib/format';
import type { NotificationKind } from '@/lib/notifications';
import { useWallet } from '@/lib/wallet-context';

type QuickAction = { key: string; label: string; icon: LucideIcon; onPress: () => void };

// Icon per notification kind for the recent-activity feed.
const ACTIVITY_ICON: Record<NotificationKind, LucideIcon> = {
  update: RefreshCw,
  share: Share2,
  info: Info,
};

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
  const { identity, record, notifications, unreadNotifications, reloadRecord } =
    useWallet();
  const [fg, muted, accent] = useThemeColor(['foreground', 'muted', 'accent']);
  const [shareOpen, setShareOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const copy = async (value: string, label: string) => {
    await Clipboard.setStringAsync(value);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  };

  const quickActions: QuickAction[] = [
    {
      key: 'share',
      label: 'Share record',
      icon: QrCode,
      onPress: () => setShareOpen(true),
    },
    {
      key: 'wallet',
      label: 'My wallet',
      icon: Wallet,
      onPress: () => setWalletOpen(true),
    },
    {
      key: 'scan',
      label: 'Scan',
      icon: ScanLine,
      onPress: () => router.navigate('/camera'),
    },
  ];

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
      <RefreshableScrollView
        onRefresh={reloadRecord}
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
            badgeCount={unreadNotifications}
            onPress={() => router.push('/notifications')}
          />
        </View>

        {/* Greeting */}
        <View className="gap-1">
          <Typography className="text-base text-muted">{greeting()},</Typography>
          <Typography className="text-3xl font-bold text-foreground">{record?.name ?? 'Patient'}</Typography>
          <Typography className="text-sm text-muted">Your record, stored on this device.</Typography>
        </View>

        {/* Quick actions — the core patient actions, one tap each */}
        <View className="flex-row gap-3">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <Pressable
                key={qa.key}
                onPress={qa.onPress}
                accessibilityRole="button"
                accessibilityLabel={qa.label}
                className="flex-1 active:opacity-80">
                <Card className="items-center gap-2 py-4">
                  <View className="size-11 items-center justify-center rounded-2xl bg-accent/12">
                    <Icon size={22} color={accent} />
                  </View>
                  <Typography className="text-xs font-medium text-foreground">{qa.label}</Typography>
                </Card>
              </Pressable>
            );
          })}
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
                    <Typography className="text-3xl font-bold text-foreground">{tile.count}</Typography>
                    <Typography className="text-sm font-medium text-foreground">{tile.title}</Typography>
                    <Typography className="text-xs text-muted">{tile.caption}</Typography>
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
                  <Typography className="text-sm font-medium text-foreground">Invoices</Typography>
                  <Typography className="text-xs text-muted">
                    {invoices.length === 0
                      ? 'No invoices'
                      : unpaid > 0
                        ? `${unpaid} unpaid of ${invoices.length}`
                        : `${invoices.length} · all paid`}
                  </Typography>
                </View>
                <ChevronRight size={18} color={muted} />
              </Card>
            </Pressable>
          );
        })()}

        {/* Recent activity — latest clinic updates / share requests / info */}
        {notifications.length > 0 ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between px-1">
              <Typography className="text-sm font-semibold text-foreground">
                Recent activity
              </Typography>
              <Pressable
                onPress={() => router.push('/notifications')}
                accessibilityRole="button"
                className="active:opacity-70">
                <Typography className="text-sm font-medium" style={{ color: accent }}>
                  See all
                </Typography>
              </Pressable>
            </View>
            <Card className="gap-0">
              {notifications.slice(0, 3).map((n, i) => {
                const Icon = ACTIVITY_ICON[n.kind] ?? Info;
                return (
                  <View key={n.id}>
                    {i > 0 ? <Separator className="my-2.5" /> : null}
                    <View className="flex-row items-start gap-3">
                      <View className="size-9 items-center justify-center rounded-full bg-accent/12">
                        <Icon size={16} color={accent} />
                      </View>
                      <View className="flex-1 gap-0.5">
                        <Typography
                          className="text-sm font-medium text-foreground"
                          numberOfLines={1}>
                          {n.title}
                        </Typography>
                        {n.body ? (
                          <Typography className="text-xs text-muted" numberOfLines={1}>
                            {n.body}
                          </Typography>
                        ) : null}
                      </View>
                      <Typography className="text-xs text-muted">
                        {formatDate(n.createdAt)}
                      </Typography>
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        ) : null}
      </RefreshableScrollView>

      {/* Share record — a QR a clinic scans to request the record. The full
          share handshake completes on the clinic side. */}
      <BottomSheet isOpen={shareOpen} onOpenChange={setShareOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <View className="gap-5 pt-1">
              <SheetHeader
                title="Share your record"
                subtitle="Let a clinic scan this to request your record"
                icon={QrCode}
              />
              {identity ? (
                <View className="items-center gap-4 pb-2">
                  <View className="rounded-3xl bg-white p-5">
                    <QRCode value={identity.walletNumber} size={200} />
                  </View>
                  <Pressable
                    onPress={() => copy(identity.walletNumber, 'Wallet number')}
                    accessibilityRole="button"
                    className="flex-row items-center gap-1.5 active:opacity-70">
                    <Typography className="text-sm font-medium" style={{ color: accent }}>
                      {shortWallet(identity.walletNumber)}
                    </Typography>
                    <Copy size={14} color={accent} />
                  </Pressable>
                  <Typography type="body-xs" color="muted" className="px-6 text-center">
                    The clinic completes the request on their side after scanning.
                  </Typography>
                </View>
              ) : (
                <Typography className="text-sm text-muted">Wallet not ready yet.</Typography>
              )}
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {/* My wallet — quick-copy identity, without leaving Home. */}
      <BottomSheet isOpen={walletOpen} onOpenChange={setWalletOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <View className="gap-5 pt-1">
              <SheetHeader
                title="My wallet"
                subtitle="Your identity on this device"
                icon={Wallet}
              />
              <Surface variant="secondary" className="overflow-hidden rounded-3xl px-0 py-0">
                <CopyRow
                  accent={accent}
                  icon={Wallet}
                  label="Wallet number"
                  muted={muted}
                  onCopy={
                    identity
                      ? () => copy(identity.walletNumber, 'Wallet number')
                      : undefined
                  }
                  value={identity ? shortWallet(identity.walletNumber) : '—'}
                />
                <Separator />
                <CopyRow
                  accent={accent}
                  icon={Fingerprint}
                  label="Fingerprint"
                  muted={muted}
                  onCopy={
                    identity
                      ? () => copy(identity.fingerprint, 'Fingerprint')
                      : undefined
                  }
                  value={identity?.fingerprint ?? '—'}
                />
                <Separator />
                <CopyRow
                  accent={accent}
                  icon={KeyRound}
                  label="Algorithm"
                  muted={muted}
                  value="Ed25519"
                />
              </Surface>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
}

// A copyable identity row for the "My wallet" sheet.
function CopyRow({
  icon: Icon,
  label,
  value,
  onCopy,
  accent,
  muted,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onCopy?: () => void;
  accent: string;
  muted: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-70"
      disabled={!onCopy}
      onPress={onCopy}>
      <View className="size-9 items-center justify-center rounded-full bg-accent/12">
        <Icon size={18} color={accent} />
      </View>
      <View className="flex-1 gap-0.5">
        <Typography className="text-xs text-muted">{label}</Typography>
        <Typography className="text-sm font-medium text-foreground" numberOfLines={1}>
          {value}
        </Typography>
      </View>
      {onCopy ? <Copy size={16} color={muted} /> : null}
    </Pressable>
  );
}
