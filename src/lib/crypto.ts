// Polyfill crypto.getRandomValues for @noble before any key generation runs.
import 'react-native-get-random-values';

import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import {
  bytesToHex,
  concatBytes,
  hexToBytes,
  randomBytes,
  utf8ToBytes,
} from '@noble/hashes/utils.js';

// Patient-wallet crypto. The wire format is a deliberate mirror of the clinic
// backend's src/lib/wallet-crypto.ts so a sealed, signed bundle produced here
// decrypts + verifies there. Identity is an Ed25519 keypair; its public key,
// base58check-encoded with a `tmw_` prefix, is the wallet number. Bundles are
// sealed to a recipient's ephemeral X25519 key and signed with the wallet key.

export const WALLET_PREFIX = 'tmw_';

const B58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const B64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// --- base64 (no Buffer/atob in Hermes) -------------------------------------

export function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64_ALPHABET[b0 >> 2];
    out += B64_ALPHABET[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += i + 1 < bytes.length ? B64_ALPHABET[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)] : '=';
    out += i + 2 < bytes.length ? B64_ALPHABET[b2 & 63] : '=';
  }
  return out;
}

export function fromBase64(str: string): Uint8Array {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < str.length; i++) {
    const v = B64_ALPHABET.indexOf(str[i]);
    if (v < 0) continue;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

// --- base58check -----------------------------------------------------------

function base58Encode(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits: number[] = [];
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = '1'.repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) out += B58_ALPHABET[digits[i]];
  return out;
}

function base58Decode(str: string): Uint8Array {
  let zeros = 0;
  while (zeros < str.length && str[zeros] === '1') zeros++;
  const bytes: number[] = [];
  for (let i = zeros; i < str.length; i++) {
    const value = B58_ALPHABET.indexOf(str[i]);
    if (value < 0) throw new Error('Invalid base58 character.');
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  const out = new Uint8Array(zeros + bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[zeros + bytes.length - 1 - i] = bytes[i];
  }
  return out;
}

function checksum(payload: Uint8Array): Uint8Array {
  return sha256(sha256(payload)).slice(0, 4);
}

// --- Ed25519 identity + wallet number --------------------------------------

export function newSigningKeypair(): { privateKeyHex: string; publicKeyHex: string } {
  const privateKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(privateKey);
  return { privateKeyHex: bytesToHex(privateKey), publicKeyHex: bytesToHex(publicKey) };
}

export function publicKeyFromPrivate(privateKeyHex: string): string {
  return bytesToHex(ed25519.getPublicKey(hexToBytes(privateKeyHex)));
}

export function signMessage(privateKeyHex: string, message: Uint8Array): string {
  return bytesToHex(ed25519.sign(message, hexToBytes(privateKeyHex)));
}

export function fingerprint(publicKeyHex: string): string {
  const hex = bytesToHex(sha256(hexToBytes(publicKeyHex))).slice(0, 32);
  return `ed25519:${(hex.match(/.{1,4}/g) ?? []).join(' ')}`;
}

export function encodeWalletNumber(publicKeyHex: string): string {
  const publicKey = hexToBytes(publicKeyHex);
  return WALLET_PREFIX + base58Encode(concatBytes(publicKey, checksum(publicKey)));
}

export function decodeWalletNumber(walletNumber: string): Uint8Array {
  const trimmed = walletNumber.trim();
  if (!trimmed.startsWith(WALLET_PREFIX)) throw new Error('Bad wallet prefix.');
  const decoded = base58Decode(trimmed.slice(WALLET_PREFIX.length));
  if (decoded.length !== 36) throw new Error('Bad wallet length.');
  return decoded.slice(0, 32);
}

// --- Sealed box to a recipient X25519 public key ---------------------------

function deriveKey(
  shared: Uint8Array,
  ephemeralPub: Uint8Array,
  recipientPub: Uint8Array,
): Uint8Array {
  return sha256(concatBytes(shared, ephemeralPub, recipientPub));
}

// Seal `plaintext` to `recipientPublicKeyHex` (X25519). Returns base64 of
// `ephemeralPub(32) || nonce(24) || ciphertext` — the exact layout the backend
// `open` expects.
export function seal(recipientPublicKeyHex: string, plaintext: Uint8Array): string {
  const recipientPub = hexToBytes(recipientPublicKeyHex);
  const ephemeralPriv = x25519.utils.randomSecretKey();
  const ephemeralPub = x25519.getPublicKey(ephemeralPriv);
  const shared = x25519.getSharedSecret(ephemeralPriv, recipientPub);
  const key = deriveKey(shared, ephemeralPub, recipientPub);
  const nonce = randomBytes(24);
  const ciphertext = xchacha20poly1305(key, nonce).encrypt(plaintext);
  return toBase64(concatBytes(ephemeralPub, nonce, ciphertext));
}

// --- Local symmetric encryption for the on-device record store -------------

export function newLocalKey(): string {
  return bytesToHex(randomBytes(32));
}

export function encryptLocal(keyHex: string, plaintext: string): string {
  const nonce = randomBytes(24);
  const ciphertext = xchacha20poly1305(hexToBytes(keyHex), nonce).encrypt(
    utf8ToBytes(plaintext),
  );
  return toBase64(concatBytes(nonce, ciphertext));
}

export function decryptLocal(keyHex: string, payloadBase64: string): string {
  const blob = fromBase64(payloadBase64);
  const nonce = blob.slice(0, 24);
  const ciphertext = blob.slice(24);
  const plaintext = xchacha20poly1305(hexToBytes(keyHex), nonce).decrypt(ciphertext);
  return new TextDecoder().decode(plaintext);
}

export { utf8ToBytes };
