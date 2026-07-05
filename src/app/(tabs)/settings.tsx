import * as Clipboard from 'expo-clipboard';
import {
  BottomSheet,
  Button,
  Input,
  ListGroup,
  Separator,
  Surface,
  Switch,
  useThemeColor,
} from 'heroui-native';
import {
  Copy,
  Fingerprint,
  KeyRound,
  Moon,
  Server,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Uniwind, useUniwind } from 'uniwind';

import { shortWallet } from '@/lib/format';
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
  const { identity, record, status, relayUrl, setRelayUrl, reset } = useWallet();
  const [muted, accent] = useThemeColor(['muted', 'accent']);

  const [editingRelay, setEditingRelay] = useState(false);
  const [relayDraft, setRelayDraft] = useState(relayUrl);

  const copy = async (value: string, label: string) => {
    await Clipboard.setStringAsync(value);
    Alert.alert('Copied', `${label} copied to clipboard.`);
  };

  const onReset = () => {
    Alert.alert(
      'Reset wallet?',
      'This permanently deletes your keys and on-device record. You will need to register again. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => void reset() },
      ],
    );
  };

  const saveRelay = async () => {
    await setRelayUrl(relayDraft.trim());
    setEditingRelay(false);
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 90 }}
        contentContainerClassName="px-5 gap-6"
        showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-bold text-foreground">Settings</Text>

        {/* Identity hero */}
        <Surface className="flex-row items-center gap-4 rounded-3xl">
          <View className="size-14 items-center justify-center rounded-full bg-accent/15">
            <Text className="text-xl font-bold" style={{ color: accent }}>
              {record?.initials ?? '?'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">
              {record?.name ?? 'Patient'}
            </Text>
            <Text className="text-sm text-muted">Stored only on this device</Text>
          </View>
        </Surface>

        {/* Wallet */}
        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Wallet
          </Text>
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
          <Text className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Network
          </Text>
          <ListGroup>
            <ListGroup.Item
              onPress={() => {
                setRelayDraft(relayUrl);
                setEditingRelay(true);
              }}>
              <ListGroup.ItemPrefix>
                <Server size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>Relay server</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {STATUS_LABEL[status] ?? status} · {relayUrl}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix />
            </ListGroup.Item>
          </ListGroup>
        </View>

        {/* Appearance */}
        <View className="gap-2">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Appearance
          </Text>
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

        {/* Danger */}
        <Button variant="danger-soft" size="lg" onPress={onReset}>
          <Trash2 size={18} color="#E0352B" />
          <Button.Label>Reset wallet</Button.Label>
        </Button>
      </ScrollView>

      {/* Relay editor */}
      <BottomSheet isOpen={editingRelay} onOpenChange={setEditingRelay}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <View className="gap-5">
              <View className="gap-2">
                <BottomSheet.Title>Relay server</BottomSheet.Title>
                <BottomSheet.Description>
                  The Temetro Network relay that forwards your encrypted share
                  requests. Leave the default unless a clinic gives you another.
                </BottomSheet.Description>
              </View>
              <Input
                value={relayDraft}
                onChangeText={setRelayDraft}
                placeholder="https://network.temetro.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <View className="gap-3">
                <Button variant="primary" onPress={saveRelay}>
                  <Button.Label>Save</Button.Label>
                </Button>
                <Button variant="tertiary" onPress={() => setEditingRelay(false)}>
                  <Button.Label>Cancel</Button.Label>
                </Button>
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
}
