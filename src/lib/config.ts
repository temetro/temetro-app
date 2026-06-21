import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// The clinic relay URL the wallet connects to. End users never type this:
// production builds bake a default into app.json `extra.relayUrl`. Resolution
// precedence: a user-set in-app override → EXPO_PUBLIC_API_URL (dev only) →
// app.json extra.relayUrl → localhost. A clinic-specific URL can also arrive
// via a scanned QR (see relay/pairing), which takes effect for that share.

const OVERRIDE_KEY = 'temetro.relayUrl';

const BAKED_DEFAULT =
  (Constants.expoConfig?.extra as { relayUrl?: string } | undefined)?.relayUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://localhost:4000';

let overrideCache: string | null | undefined;

// The relay URL to use right now (honours an in-app override once loaded).
export function relayUrl(): string {
  return overrideCache || BAKED_DEFAULT;
}

export function defaultRelayUrl(): string {
  return BAKED_DEFAULT;
}

// Load the persisted override into the cache (call once at startup).
export async function loadRelayOverride(): Promise<string> {
  overrideCache = await SecureStore.getItemAsync(OVERRIDE_KEY);
  return relayUrl();
}

// Persist (or clear) the in-app relay override.
export async function setRelayOverride(url: string | null): Promise<void> {
  const trimmed = url?.trim();
  if (trimmed) {
    overrideCache = trimmed;
    await SecureStore.setItemAsync(OVERRIDE_KEY, trimmed);
  } else {
    overrideCache = null;
    await SecureStore.deleteItemAsync(OVERRIDE_KEY);
  }
}
