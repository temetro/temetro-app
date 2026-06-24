import OnboardingScreen from '@/components/onboarding-screen';
import { useOnboarding } from '@/lib/onboarding';

// Route wrapper for the first-run intro. Marking it complete flips the onboarded
// flag; the gate in the root layout then redirects on to registration.
export default function OnboardingRoute() {
  const { complete } = useOnboarding();
  return <OnboardingScreen onDone={() => void complete()} />;
}
