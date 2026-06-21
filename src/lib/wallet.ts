import * as SecureStore from 'expo-secure-store';

import {
  encodeWalletNumber,
  fingerprint,
  newLocalKey,
  newSigningKeypair,
  publicKeyFromPrivate,
} from './crypto';

// The patient's identity lives entirely on the device. The Ed25519 private key
// (and the symmetric key that encrypts the local record) are held in the OS
// keychain/keystore via expo-secure-store and never leave the device. The
// wallet number is just the base58check-encoded public key.

const SIGNING_KEY = 'temetro.signingKey';
const LOCAL_KEY = 'temetro.localKey';

export type WalletIdentity = {
  walletNumber: string;
  publicKeyHex: string;
  privateKeyHex: string;
  fingerprint: string;
  localKey: string;
};

let cached: WalletIdentity | null = null;

async function getOrCreate(key: string, make: () => string): Promise<string> {
  const existing = await SecureStore.getItemAsync(key);
  if (existing) return existing;
  const value = make();
  await SecureStore.setItemAsync(key, value);
  return value;
}

// Load the wallet identity, generating + persisting keys on first launch.
export async function getWallet(): Promise<WalletIdentity> {
  if (cached) return cached;
  const privateKeyHex = await getOrCreate(
    SIGNING_KEY,
    () => newSigningKeypair().privateKeyHex,
  );
  const localKey = await getOrCreate(LOCAL_KEY, () => newLocalKey());
  const publicKeyHex = publicKeyFromPrivate(privateKeyHex);
  cached = {
    walletNumber: encodeWalletNumber(publicKeyHex),
    publicKeyHex,
    privateKeyHex,
    fingerprint: fingerprint(publicKeyHex),
    localKey,
  };
  return cached;
}

// Destroy this wallet's keys (and forget the cached identity). The next
// getWallet() mints a brand-new wallet number.
export async function resetWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(SIGNING_KEY);
  await SecureStore.deleteItemAsync(LOCAL_KEY);
  cached = null;
}
