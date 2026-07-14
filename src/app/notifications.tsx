import { Card, Typography, useThemeColor } from 'heroui-native';
import type { TFunction } from 'i18next';
import { BellOff, FileText, Share2, Info, type LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { NotificationKind } from '@/lib/notifications';
import { useWallet } from '@/lib/wallet-context';

const ICON: Record<NotificationKind, LucideIcon> = {
  update: FileText,
  share: Share2,
  info: Info,
};

// ISO -> "just now" / "10m ago" / "3h ago" / "2d ago" (localized).
function relativeTime(iso: string, t: TFunction): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return t('notificationsScreen.justNow');
  if (mins < 60) return t('notificationsScreen.minutesAgo', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('notificationsScreen.hoursAgo', { count: hours });
  return t('notificationsScreen.daysAgo', { count: Math.floor(hours / 24) });
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { notifications, markNotificationsRead, reloadRecord } = useWallet();
  const [accent, muted] = useThemeColor(['accent', 'muted']);

  // Viewing the inbox clears the unread badge.
  useEffect(() => {
    markNotificationsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (notifications.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-10">
        <BellOff size={40} color={muted} />
        <Typography type="body" align="center" className="text-foreground">
          {t('notificationsScreen.empty')}
        </Typography>
        <Typography type="body-sm" color="muted" align="center">
          {t('notificationsScreen.emptyBody')}
        </Typography>
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
        {notifications.map((n) => {
          const Icon = ICON[n.kind] ?? Info;
          return (
            <Card key={n.id} className="flex-row items-start gap-3">
              <View className="size-10 items-center justify-center rounded-2xl bg-accent/12">
                <Icon size={18} color={accent} />
              </View>
              <View className="flex-1 gap-0.5">
                <Typography type="body-sm" className="font-semibold text-foreground">
                  {n.title}
                </Typography>
                {n.body ? (
                  <Typography type="body-sm" color="muted" numberOfLines={2}>
                    {n.body}
                  </Typography>
                ) : null}
                <Typography type="body-xs" color="muted">
                  {relativeTime(n.createdAt, t)}
                </Typography>
              </View>
              {!n.read ? (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />
              ) : null}
            </Card>
          );
        })}
      </RefreshableScrollView>
    </View>
  );
}
