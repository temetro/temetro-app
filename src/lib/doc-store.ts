import { Directory, File, Paths } from 'expo-file-system';

import { decryptLocal, encryptLocal } from './crypto';

// Document bytes cached on the device, encrypted with the same device-held local
// key as the record (XChaCha20-Poly1305, see records.ts). Two kinds live here:
// clinic files fetched on demand over the portal, and photos the patient took
// themselves. Both are ciphertext on disk and only decrypted in memory.
//
// The bytes are held as base64 inside the encrypted blob so this can reuse
// encryptLocal/decryptLocal (which work on strings) rather than introduce a
// second, subtly different crypto path for binary.

const DIR = 'temetro-docs';

function docsDir(): Directory {
  return new Directory(Paths.document, DIR);
}

function docFile(id: string): File {
  // Ids come from the clinic (uuid) or are minted locally, but never trust them
  // as path segments.
  const safe = id.replace(/[^\w-]+/g, '_');
  return new File(docsDir(), `${safe}.enc`);
}

export function hasDocBytes(id: string): boolean {
  return docFile(id).exists;
}

/** Cache a document's bytes (base64) for offline viewing. */
export function saveDocBytes(localKey: string, id: string, base64: string): void {
  const dir = docsDir();
  if (!dir.exists) dir.create({ intermediates: true });
  const file = docFile(id);
  if (file.exists) file.delete();
  file.create();
  file.write(encryptLocal(localKey, base64));
}

/** The cached bytes (base64), or null when not cached / undecryptable. */
export async function loadDocBytes(
  localKey: string,
  id: string,
): Promise<string | null> {
  const file = docFile(id);
  if (!file.exists) return null;
  try {
    return decryptLocal(localKey, await file.text());
  } catch {
    return null;
  }
}

export function deleteDocBytes(id: string): void {
  const file = docFile(id);
  if (file.exists) file.delete();
}

/** Drop every cached document — part of wiping the wallet. */
export function deleteAllDocs(): void {
  const dir = docsDir();
  if (dir.exists) dir.delete();
}
