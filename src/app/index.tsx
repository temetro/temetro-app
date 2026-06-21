import WalletScreen from '@/components/wallet-screen';

// Platform-resolved: wallet-screen.ios.tsx (SwiftUI) / wallet-screen.android.tsx
// (Jetpack Compose) / wallet-screen.tsx (universal web fallback).
export default function WalletRoute() {
  return <WalletScreen />;
}
