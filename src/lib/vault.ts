import { scryptAsync } from '@noble/hashes/scrypt.js';
import { bytesToHex, randomBytes } from '@noble/hashes/utils.js';
import * as SecureStore from 'expo-secure-store';

import { decryptLocal, encryptLocal, hexToBytes } from './crypto';

// Obsidian-style app lock. The wallet's keys already live in the OS keychain
// (expo-secure-store), so the record folder is encrypted at rest; this adds a
// user-facing password/PIN that must be entered to open the app after a cold
// start or a logout. The password is never stored — only a scrypt-derived
// verifier is, so we can check an entry without keeping the secret.
//
// `method` is remembered so the lock screen shows a numeric PIN pad (OTP input)
// or a passphrase field to match what the user chose at setup.

const VAULT_KEY = 'temetro.vault';
const MAGIC = 'temetro-vault-v1';

export type VaultMethod = 'pin' | 'passphrase';

type VaultData = {
  v: 1;
  method: VaultMethod;
  salt: string; // hex
  verifier: string; // encryptLocal(kdf(password, salt), MAGIC)
};

// In-memory unlock flag for the current app session (reset on logout / restart).
let unlocked = false;

async function deriveKey(password: string, saltHex: string): Promise<string> {
  const key = await scryptAsync(
    new TextEncoder().encode(password),
    hexToBytes(saltHex),
    { N: 2 ** 14, r: 8, p: 1, dkLen: 32 },
  );
  return bytesToHex(key);
}

async function readVault(): Promise<VaultData | null> {
  const raw = await SecureStore.getItemAsync(VAULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VaultData;
  } catch {
    return null;
  }
}

export async function hasVault(): Promise<boolean> {
  return (await SecureStore.getItemAsync(VAULT_KEY)) !== null;
}

export async function getVaultMethod(): Promise<VaultMethod | null> {
  return (await readVault())?.method ?? null;
}

// Create (or replace) the lock with a new password/PIN. Marks the session
// unlocked so setup flows straight into the app.
export async function createVault(password: string, method: VaultMethod): Promise<void> {
  const salt = bytesToHex(randomBytes(16));
  const keyHex = await deriveKey(password, salt);
  const data: VaultData = {
    v: 1,
    method,
    salt,
    verifier: encryptLocal(keyHex, MAGIC),
  };
  await SecureStore.setItemAsync(VAULT_KEY, JSON.stringify(data));
  unlocked = true;
}

// Check an entered password against the stored verifier. On success the session
// is marked unlocked.
export async function unlock(password: string): Promise<boolean> {
  const data = await readVault();
  if (!data) return false;
  try {
    const keyHex = await deriveKey(password, data.salt);
    if (decryptLocal(keyHex, data.verifier) === MAGIC) {
      unlocked = true;
      return true;
    }
  } catch {
    /* wrong password / tampered verifier */
  }
  return false;
}

export function isUnlocked(): boolean {
  return unlocked;
}

// Lock the session without destroying the vault (logout). The next launch
// requires the password again; the encrypted record stays on device.
export function lock(): void {
  unlocked = false;
}

// Remove the lock entirely (used when the wallet is reset).
export async function removeVault(): Promise<void> {
  await SecureStore.deleteItemAsync(VAULT_KEY);
  unlocked = false;
}
