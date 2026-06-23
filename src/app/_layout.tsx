import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import OnboardingScreen from '@/components/onboarding-screen';
import { useOnboarding } from '@/lib/onboarding';
import { WalletProvider } from '@/lib/wallet-context';

// First launch shows the intro slides; once completed the wallet tabs take over.
// While the onboarded flag is still loading we render nothing — the animated
// splash overlay covers the gap.
function Gate() {
  const { ready, onboarded, complete } = useOnboarding();
  if (!ready) return null;
  if (!onboarded) return <OnboardingScreen onDone={() => void complete()} />;
  return <AppTabs />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WalletProvider>
        <AnimatedSplashOverlay />
        <Gate />
      </WalletProvider>
    </ThemeProvider>
  );
}
