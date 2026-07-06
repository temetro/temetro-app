import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

// Blue accent (mirrors src/lib/theme.ts) used for the selected tab — applied to
// both the label and the icon so they stay consistent (the SF Symbol otherwise
// falls back to the iOS system tint).
const TINT = { light: '#2C6FE6', dark: '#5B93FF' } as const;

// Native bottom tab bar (real UITabBar / Material BottomNavigation) via
// expo-router's NativeTabs. Screen content is built with HeroUI Native; only the
// bar itself stays native. Icons are SF Symbols on iOS (crisp + native) with
// Material drawable fallbacks on Android.
export default function TabsLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={TINT[scheme]}
      labelStyle={{ selected: { color: TINT[scheme] } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" drawable="ic_menu_home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="camera">
        <NativeTabs.Trigger.Label>Scan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="qrcode.viewfinder" drawable="ic_menu_camera" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" drawable="ic_menu_preferences" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
