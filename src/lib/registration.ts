import * as SecureStore from 'expo-secure-store';

// Whether the patient has completed registration (entered their profile and
// minted a record). Stored next to the wallet keys + onboarding flag in the OS
// keychain (mirrors the getOrCreate pattern in wallet.ts / onboarding.ts).
const REGISTERED_KEY = 'temetro.registered';

export async function isRegistered(): Promise<boolean> {
  return (await SecureStore.getItemAsync(REGISTERED_KEY)) === '1';
}

export async function setRegistered(): Promise<void> {
  await SecureStore.setItemAsync(REGISTERED_KEY, '1');
}

export async function clearRegistered(): Promise<void> {
  await SecureStore.deleteItemAsync(REGISTERED_KEY);
}
