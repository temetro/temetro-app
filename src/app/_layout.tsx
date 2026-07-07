import '@/global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { HeroUINativeProvider } from 'heroui-native';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { UpdatesInbox } from '@/components/updates-inbox';
import { useOnboarding } from '@/lib/onboarding';
import { darkPalette, lightPalette } from '@/lib/theme';
import { useWallet, WalletProvider } from '@/lib/wallet-context';

// Navigation themes whose surfaces match the app palette (src/lib/theme.ts) so
// the native-stack card + window never flash a stock white/near-black during
// push/pop transitions. React Navigation's default backgrounds don't match our
// palette, which is what caused the white edges on transitions.
const navDark = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: darkPalette.bg, card: darkPalette.bg },
};
const navLight = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: lightPalette.bg, card: lightPalette.bg },
};

// Auth-style gate: once the onboarding flag + wallet state are loaded, redirect
// into the right flow. The animated splash overlay covers the first frame so the
// redirect doesn't flash. Detail routes (visits, prescriptions, …) are pushed
// over the tabs by the root Stack.
function GateRedirector() {
  const router = useRouter();
  const segments = useSegments();
  const { ready: onbReady, onboarded } = useOnboarding();
  const { ready: walletReady, registered } = useWallet();

  useEffect(() => {
    if (!onbReady || !walletReady) return;
    const top = segments[0];
    const inOnboarding = top === 'onboarding';
    const inRegister = top === 'register';

    if (!onboarded) {
      if (!inOnboarding) router.replace('/onboarding');
    } else if (!registered) {
      if (!inRegister) router.replace('/register');
    } else if (inOnboarding || inRegister) {
      router.replace('/');
    }
  }, [onbReady, walletReady, onboarded, registered, segments, router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const dark = colorScheme === 'dark';
  const palette = dark ? darkPalette : lightPalette;

  // Paint the window root the palette background so no white shows through
  // around/behind screens during transitions.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(palette.bg);
  }, [palette.bg]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.bg }}>
      <ThemeProvider value={dark ? navDark : navLight}>
        <HeroUINativeProvider>
          <WalletProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: palette.bg },
              }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
              <Stack.Screen name="register" options={{ animation: 'fade' }} />
              <Stack.Screen
                name="visits"
                options={{ headerShown: true, title: 'Patient Visits', headerBackTitle: 'Home' }}
              />
              <Stack.Screen
                name="prescriptions"
                options={{ headerShown: true, title: 'Prescriptions', headerBackTitle: 'Home' }}
              />
              <Stack.Screen
                name="appointments"
                options={{ headerShown: true, title: 'Appointments', headerBackTitle: 'Home' }}
              />
              <Stack.Screen
                name="documents"
                options={{ headerShown: true, title: 'Documents', headerBackTitle: 'Home' }}
              />
              <Stack.Screen
                name="notifications"
                options={{ headerShown: true, title: 'Notifications', headerBackTitle: 'Home' }}
              />
              <Stack.Screen
                name="portal"
                options={{ headerShown: true, title: 'Patient Portal', headerBackTitle: 'Scan' }}
              />
            </Stack>
            <AnimatedSplashOverlay />
            <UpdatesInbox />
            <GateRedirector />
          </WalletProvider>
        </HeroUINativeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
