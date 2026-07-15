import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

// Whether the first-launch intro has been completed. Stored next to the wallet
// keys in the OS keychain (mirrors the getOrCreate pattern in wallet.ts).
const ONBOARDED_KEY = 'temetro.onboarded';

export async function hasOnboarded(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ONBOARDED_KEY)) === '1';
}

export async function setOnboarded(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDED_KEY, '1');
}

export async function clearOnboarded(): Promise<void> {
  await SecureStore.deleteItemAsync(ONBOARDED_KEY);
}

type OnboardingValue = {
  ready: boolean;
  onboarded: boolean;
  /** Mark the intro done and reveal the app. */
  complete: () => Promise<void>;
  /** Send the wallet back to a true first-run state (used by Reset wallet). */
  clear: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingValue | null>(null);

// Gate state for the root layout. This has to be one shared context rather than
// a per-component hook: the flag is written by the onboarding screen but read by
// the gate, so two independent copies of the state meant finishing the intro
// updated the writer and left the gate none the wiser (the app sat on the last
// slide until it was restarted). The same split is why clearing the flag on
// reset didn't bring onboarding back.
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboardedState] = useState(false);

  useEffect(() => {
    let active = true;
    hasOnboarded().then((v) => {
      if (!active) return;
      setOnboardedState(v);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const complete = async () => {
    await setOnboarded();
    setOnboardedState(true);
  };

  const clear = async () => {
    await clearOnboarded();
    setOnboardedState(false);
  };

  return (
    <OnboardingContext.Provider value={{ ready, onboarded, complete, clear }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return ctx;
}
