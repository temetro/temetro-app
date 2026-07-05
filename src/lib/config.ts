import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// The relay URL the wallet connects to. This is FIXED — end users can't change
// it in-app (a mistyped URL used to break the connection). Production builds bake
// it into app.json `extra.relayUrl`; a build-time EXPO_PUBLIC_API_URL still wins
// for local dev / self-hosting. A clinic-specific relay can also arrive via a
// scanned QR (see relay/pairing), which takes effect just for that share.

// Legacy key for the removed in-app override — cleared on startup so any bad
// value a user previously saved is discarded.
const OVERRIDE_KEY = 'temetro.relayUrl';

const BAKED_DEFAULT = (
  (Constants.expoConfig?.extra as { relayUrl?: string } | undefined)?.relayUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  'https://network.temetro.com'
).replace(/\/+$/, ''); // no trailing slash → clean `${url}/wallet`

// The relay URL to use right now (fixed).
export function relayUrl(): string {
  return BAKED_DEFAULT;
}

export function defaultRelayUrl(): string {
  return BAKED_DEFAULT;
}

// Called once at startup: wipe any override a previous build may have persisted,
// so the wallet always uses the fixed relay URL.
export async function loadRelayOverride(): Promise<string> {
  try {
    await SecureStore.deleteItemAsync(OVERRIDE_KEY);
  } catch {
    /* nothing stored — fine */
  }
  return relayUrl();
}
