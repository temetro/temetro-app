import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import {
  BottomSheet,
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
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Fingerprint,
  Globe,
  Info,
  KeyRound,
  LogOut,
  Moon,
  Newspaper,
  Phone,
  Server,
  ShieldCheck,
  Trash2,
  Wallet,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Uniwind, useUniwind } from 'uniwind';

import { GlassButton } from '@/components/glass-button';
import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import { SheetInput } from '@/components/sheet/sheet-parts';
import { shortWallet } from '@/lib/format';
import i18n from '@/lib/i18n';
import {
  applyDirectionForLanguage,
  LANGUAGES,
  type LanguageCode,
  persistLanguage,
} from '@/lib/language';
import { useVault } from '@/lib/vault-context';
import { useWallet } from '@/lib/wallet-context';

const DOCS_URL = 'https://github.com/temetro/temetro';
const BLOG_URL = 'https://blog.temetro.com';
const APP_VERSION = Constants.expoConfig?.version ?? '—';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useUniwind();
  const router = useRouter();
  const { identity, record, status, reset, reloadRecord, updateRecord } = useWallet();
  const { lock, refresh: refreshVault } = useVault();
  const [muted, accent, foreground, danger] = useThemeColor([
    'muted',
    'accent',
    'foreground',
    'danger',
  ]);
  const [resetOpen, setResetOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');

  const openPhone = () => {
    setPhoneDraft(record?.phone ?? '');
    setPhoneOpen(true);
  };

  // Persist the patient's phone to the on-device record only. Trimming to empty
  // clears it (stored as undefined so the field simply drops off the record).
  const savePhone = () => {
    setPhoneOpen(false);
    if (!record) return;
    const trimmed = phoneDraft.trim();
    updateRecord({ ...record, phone: trimmed || undefined });
  };

  const statusLabel: Record<string, string> = {
    connecting: t('settings.status.connecting'),
    connected: t('settings.status.connected'),
    authenticated: t('settings.status.authenticated'),
    'auth-failed': t('settings.status.authFailed'),
    disconnected: t('settings.status.disconnected'),
  };

  const currentLanguage =
    LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const copy = async (value: string, label: string) => {
    await Clipboard.setStringAsync(value);
    Alert.alert(t('common.copied'), t('common.copiedToClipboard', { label }));
  };

  const chooseLanguage = async (code: LanguageCode) => {
    setLangOpen(false);
    if (code === i18n.language) return;
    persistLanguage(code);
    await i18n.changeLanguage(code);
    // RN only mirrors the layout after a reload, so if the direction flips
    // (to/from Arabic) ask the patient to relaunch to finish applying it.
    const directionChanged = applyDirectionForLanguage(code);
    if (directionChanged) {
      Alert.alert(
        t('settings.languageSheet.restartTitle'),
        t('settings.languageSheet.restartBody'),
      );
    }
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
      <RefreshableScrollView
        onRefresh={reloadRecord}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 90 }}
        contentContainerClassName="px-5 gap-6 w-full max-w-2xl self-center"
        showsVerticalScrollIndicator={false}>
        <Typography className="text-3xl font-bold text-foreground">
          {t('settings.title')}
        </Typography>

        {/* Identity hero */}
        <Surface className="flex-row items-center gap-4 rounded-3xl">
          <View className="size-14 items-center justify-center rounded-full bg-accent/15">
            <Typography className="text-xl font-bold" style={{ color: accent }}>
              {record?.initials ?? '?'}
            </Typography>
          </View>
          <View className="flex-1">
            <Typography className="text-lg font-semibold text-foreground">
              {record?.name ?? t('settings.patientFallback')}
            </Typography>
            <Typography className="text-sm text-muted">
              {t('settings.storedOnDevice')}
            </Typography>
          </View>
        </Surface>

        {/* Wallet */}
        <View className="gap-2">
          <Typography className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('settings.sections.wallet')}
          </Typography>
          <ListGroup>
            <ListGroup.Item
              onPress={() =>
                identity && copy(identity.walletNumber, t('settings.walletNumber'))
              }>
              <ListGroup.ItemPrefix>
                <Wallet size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t('settings.walletNumber')}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {identity ? shortWallet(identity.walletNumber) : '—'}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Copy size={18} color={muted} />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item
              onPress={() =>
                identity && copy(identity.fingerprint, t('settings.fingerprint'))
              }>
              <ListGroup.ItemPrefix>
                <Fingerprint size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t('settings.fingerprint')}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>{identity?.fingerprint ?? '—'}</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Copy size={18} color={muted} />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item disabled>
              <ListGroup.ItemPrefix>
                <KeyRound size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t('settings.algorithm')}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>Ed25519</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <View />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        </View>

        {/* Profile — the patient's own details, on-device only */}
        <View className="gap-2">
          <Typography className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('settings.sections.profile')}
          </Typography>
          <ListGroup>
            <ListGroup.Item onPress={openPhone}>
              <ListGroup.ItemPrefix>
                <Phone size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t('settings.phone')}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {record?.phone ? record.phone : t('settings.phoneNotSet')}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <ExternalLink size={18} color={muted} />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        </View>

        {/* Network */}
        <View className="gap-2">
          <Typography className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('settings.sections.network')}
          </Typography>
          <ListGroup>
            <ListGroup.Item>
              <ListGroup.ItemPrefix>
                <Server size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t('settings.temetroNetwork')}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>
                  {statusLabel[status] ?? status}
                </ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <View />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        </View>

        {/* Appearance & language */}
        <View className="gap-2">
          <Typography className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('settings.sections.appearance')}
          </Typography>
          <ListGroup>
            <ListGroup.Item disabled>
              <ListGroup.ItemPrefix>
                <Moon size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t('settings.darkMode')}</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <Switch
                  isSelected={theme === 'dark'}
                  onSelectedChange={(on) => Uniwind.setTheme(on ? 'dark' : 'light')}
                />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => setLangOpen(true)}>
              <ListGroup.ItemPrefix>
                <Globe size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t('settings.language')}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>{currentLanguage.label}</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <ExternalLink size={18} color={muted} />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        </View>

        {/* About */}
        <View className="gap-2">
          <Typography className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('settings.sections.about')}
          </Typography>
          <ListGroup>
            <ListGroup.Item>
              <ListGroup.ItemPrefix>
                <Info size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t('settings.version')}</ListGroup.ItemTitle>
                <ListGroup.ItemDescription>{APP_VERSION}</ListGroup.ItemDescription>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <View />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => Linking.openURL(DOCS_URL)}>
              <ListGroup.ItemPrefix>
                <BookOpen size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t('settings.help')}</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <ExternalLink size={18} color={muted} />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
            <Separator className="mx-4" />
            <ListGroup.Item onPress={() => Linking.openURL(BLOG_URL)}>
              <ListGroup.ItemPrefix>
                <Newspaper size={20} color={accent} />
              </ListGroup.ItemPrefix>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle>{t('settings.blog')}</ListGroup.ItemTitle>
              </ListGroup.ItemContent>
              <ListGroup.ItemSuffix>
                <ExternalLink size={18} color={muted} />
              </ListGroup.ItemSuffix>
            </ListGroup.Item>
          </ListGroup>
        </View>

        {/* Session */}
        <Button variant="secondary" size="lg" onPress={logout}>
          <LogOut size={18} color={foreground} />
          <Button.Label>{t('settings.logout')}</Button.Label>
        </Button>

        {/* Danger */}
        <Button variant="danger-soft" size="lg" onPress={() => setResetOpen(true)}>
          <Trash2 size={18} color={danger} />
          <Button.Label>{t('settings.resetWallet')}</Button.Label>
        </Button>

        {/* Privacy reassurance footer */}
        <View className="flex-row items-center justify-center gap-1.5 pt-1">
          <ShieldCheck size={14} color={muted} />
          <Typography className="text-xs text-muted">{t('settings.footer')}</Typography>
        </View>
      </RefreshableScrollView>

      {/* Language picker */}
      <BottomSheet isOpen={langOpen} onOpenChange={setLangOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <View className="gap-4 pt-1">
              <View className="gap-1">
                <BottomSheet.Title>{t('settings.languageSheet.title')}</BottomSheet.Title>
                <BottomSheet.Description>
                  {t('settings.languageSheet.subtitle')}
                </BottomSheet.Description>
              </View>
              <View className="gap-1">
                {LANGUAGES.map((lang) => {
                  const selected = lang.code === i18n.language;
                  return (
                    <Pressable
                      key={lang.code}
                      onPress={() => chooseLanguage(lang.code)}
                      accessibilityRole="button"
                      className="flex-row items-center gap-3 rounded-2xl px-3 py-3.5 active:opacity-70">
                      <View className="flex-1">
                        <Typography className="text-base font-medium text-foreground">
                          {lang.label}
                        </Typography>
                        <Typography className="text-xs text-muted">{lang.english}</Typography>
                      </View>
                      {selected ? <Check size={20} color={accent} /> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {/* Phone number editor — persists to the on-device record only */}
      <BottomSheet isOpen={phoneOpen} onOpenChange={setPhoneOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          {/* `keyboardBehavior="extend"` + SheetInput's focus/blur handlers keep
              the sheet above the keyboard instead of hidden behind it. */}
          <BottomSheet.Content keyboardBehavior="extend">
            <View className="gap-5 pt-1">
              <View className="gap-1">
                <BottomSheet.Title>{t('settings.phoneDialog.title')}</BottomSheet.Title>
                <BottomSheet.Description>
                  {t('settings.phoneDialog.description')}
                </BottomSheet.Description>
              </View>
              <SheetInput
                autoComplete="tel"
                autoFocus
                keyboardType="phone-pad"
                label={t('settings.phone')}
                onChangeText={setPhoneDraft}
                placeholder={t('settings.phoneDialog.placeholder')}
                value={phoneDraft}
              />
              <View className="flex-row gap-3">
                <Button variant="secondary" className="flex-1" onPress={() => setPhoneOpen(false)}>
                  <Button.Label>{t('settings.phoneDialog.cancel')}</Button.Label>
                </Button>
                <Button variant="primary" className="flex-1" onPress={savePhone}>
                  <Button.Label>{t('settings.phoneDialog.save')}</Button.Label>
                </Button>
              </View>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {/* Reset confirmation — native HeroUI dialog with Liquid Glass actions. */}
      <Dialog isOpen={resetOpen} onOpenChange={setResetOpen}>
        {/* Explicit absolute-fill + centering styles: the portal/overlay used to rely on
            heroui-native's internal Uniwind classes alone, and an Expo dependency bump
            broke their resolution once (dialog pinned to the top, backdrop no longer
            covering the screen). Inline styles keep the layout dependency-proof. */}
        <Dialog.Portal style={[StyleSheet.absoluteFill, { justifyContent: 'center', padding: 20 }]}>
          {/* Blurred backdrop behind the dialog (the BlurView lets taps fall
              through to the overlay so tapping outside still dismisses). */}
          <Dialog.Overlay
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
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
              <Dialog.Title>{t('settings.reset.title')}</Dialog.Title>
              <Dialog.Description>{t('settings.reset.body')}</Dialog.Description>
            </View>
            <View className="flex-row gap-3">
              <GlassButton
                label={t('settings.reset.cancel')}
                color={foreground}
                onPress={() => setResetOpen(false)}
              />
              <GlassButton
                label={t('settings.reset.confirm')}
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
