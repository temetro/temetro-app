import IdentityScreen from '@/components/identity-screen';

// Platform-resolved: identity-screen.ios.tsx / identity-screen.android.tsx /
// identity-screen.tsx (universal web fallback).
export default function IdentityRoute() {
  return <IdentityScreen />;
}
