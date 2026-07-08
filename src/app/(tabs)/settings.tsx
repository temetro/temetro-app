import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import {
  Button,
  Dialog,
  ListGroup,
  Separator,
  Surface,
  Switch,
  Typography,
  useThemeColor,
} from 'heroui-native';
import { useRouter } from 'expo-router';
import {
  Copy,
  Fingerprint,
  KeyRound,
  LogOut,
  Moon,
  Server,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Uniwind, useUniwind } from 'uniwind';

import { GlassButton } from '@/components/glass-button';
import { shortWallet } from '@/lib/format';
import { useVault } from '@/lib/vault-context';
import { useWallet } from '@/lib/wallet-context';

const STATUS_LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  connected: 'Connected',
  authenticated: 'Online',
  'auth-failed': 'Auth failed',
  disconnected: 'Offline',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useUniwind();
  const router = useRouter();
  const { identity, record, status, reset } = useWallet();
  const { lock, refresh: refreshVault } = useVault();
  const [muted, accent, foreground, danger] = useThemeColor([
    'muted',
    'accent',
    'foreground',
    'danger',
  ]);
  const [resetOpen, setResetOpen] = useState(false);

  const copy = async (value: string, label: string) => {
    await Clipboard.setStringAsync(value);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  };

  const confirmReset = async () => {
    setResetOpen(false);
    await reset();
    await refreshVault();
  };

  // Lock the app without wiping anything — the vault (encrypted record) stays on
  // device; the next launch asks for the PIN/passphrase again.
  const logout = () => {
    lock();
    router.replace('/lock');
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 90 }}
        contentContainerClassName="px-5 gap-6"
        showsVerticalScrollIndicator={false}>
        <Typography className="text-3xl font-bold text-foreground">Settings</Typography>

        {/* Identity hero */}
        <Surface className="flex-row items-center gap-4 rounded-3xl">
          <View className="size-14 items-center justify-center rounded-full bg-accent/15">
            <Typography className="text-xl font-bold" style={{ color: accent }}>
              {record?.initials ?? '?'}
            </Typography>
          </View>
          <View className="flex-1">
            <Typography className="text-lg font-semibold text-foreground">
              {record?.name ?? 'Patient'}
            </Typography>
            <Typography className="text-sm text-muted">Stored only on this device</Typography>
          </View>
        </Surface>

        {/* Wallet */}
        <View className="gap-2">
          <Typography className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Wallet
          </Typography>
          <ListGroup>
            <ListGroup.Item onPress={() => identity && copy(identity.walletNumber, 'Wallet number')}>
              <ListGroup.ItemPrefix>
                <Wallet size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Wallet number</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {identity ? shortWallet(identity.walletNumber) : '—'}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Copy size={18} color={muted} />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => identity && copy(identity.fingerprint, 'Fingerprint')}>
              <ListGroup.ItemPrefix>
                <Fingerprint size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Fingerprint</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>{identity?.fingerprint ?? '—'}</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Copy size={18} color={muted} />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item isDisabled>
              <ListGroup.ItemPrefix>
                <KeyRound size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Algorithm</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>Ed25519</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <View />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        </View>

        {/* Network */}
        <View className="gap-2">
          <Typography className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Network
          </Typography>
          <ListGroup>
            <ListGroup.Item>
              <ListGroup.ItemPrefix>
                <Server size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Temetro Network</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {STATUS_LABEL[status] ?? status}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <View />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        </View>

        {/* Appearance */}
        <View className="gap-2">
          <Typography className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Appearance
          </Typography>
          <ListGroup>
            <ListGroup.Item isDisabled>
              <ListGroup.ItemPrefix>
                <Moon size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Dark mode</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Switch
                  isSelected={theme === 'dark'}
                  onSelectedChange={(on) => Uniwind.setTheme(on ? 'dark' : 'light')}
                />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        </View>

        {/* Session */}
        <Button variant="secondary" size="lg" onPress={logout}>
          <LogOut size={18} color={foreground} />
          <Button.Label>Log out</Button.Label>
        </Button>

        {/* Danger */}
        <Button variant="danger-soft" size="lg" onPress={() => setResetOpen(true)}>
          <Trash2 size={18} color={danger} />
          <Button.Label>Reset wallet</Button.Label>
        </Button>
      </ScrollView>

      {/* Reset confirmation — native HeroUI dialog with Liquid Glass actions. */}
      <Dialog isOpen={resetOpen} onOpenChange={setResetOpen}>
        <Dialog.Portal>
          {/* Blurred backdrop behind the dialog (the BlurView lets taps fall
              through to the overlay so tapping outside still dismisses). */}
          <Dialog.Overlay
            style={{
              backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.15)',
            }}>
            <BlurView
              intensity={24}
              tint={theme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          </Dialog.Overlay>
          <Dialog.Content>
            <View className="mb-6 gap-2">
              <Dialog.Title>Reset wallet?</Dialog.Title>
              <Dialog.Description>
                This permanently deletes your keys and on-device record. You&apos;ll need to
                register again. This cannot be undone.
              </Dialog.Description>
            </View>
            <View className="flex-row gap-3">
              <GlassButton label="Cancel" color={foreground} onPress={() => setResetOpen(false)} />
              <GlassButton
                label="Reset"
                color={danger}
                tintColor="rgba(255,69,58,0.18)"
                onPress={confirmReset}
              />
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  );
}
