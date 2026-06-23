import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

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

// Gate state for the root layout: `ready` once the flag is loaded, `onboarded`
// the current value, and `complete()` to mark the intro done and reveal the app.
export function useOnboarding(): {
  ready: boolean;
  onboarded: boolean;
  complete: () => Promise<void>;
} {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded_] = useState(false);

  useEffect(() => {
    let active = true;
    hasOnboarded().then((v) => {
      if (!active) return;
      setOnboarded_(v);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const complete = async () => {
    await setOnboarded();
    setOnboarded_(true);
  };

  return { ready, onboarded, complete };
}
