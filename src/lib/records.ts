import { File, Paths } from 'expo-file-system';

import { decryptLocal, encryptLocal } from './crypto';
import { emptyPatient } from './sample';
import type { Patient } from './types';

// The patient's record is stored as a single encrypted blob in the app's
// document directory (XChaCha20-Poly1305 with the device-held local key). On
// disk it is ciphertext; it is only ever decrypted in memory.

const FILENAME = 'temetro-record.enc';

function recordFile(): File {
  return new File(Paths.document, FILENAME);
}

export async function loadRecord(localKey: string): Promise<Patient> {
  const file = recordFile();
  if (!file.exists) return emptyPatient();
  try {
    return JSON.parse(decryptLocal(localKey, await file.text())) as Patient;
  } catch {
    return emptyPatient();
  }
}

export function saveRecord(localKey: string, patient: Patient): void {
  const file = recordFile();
  if (!file.exists) file.create();
  file.write(encryptLocal(localKey, JSON.stringify(patient)));
}

// Remove the on-disk record entirely (used when resetting the wallet so a fresh
// registration starts from a clean slate rather than a stale ciphertext).
export function deleteRecord(): void {
  const file = recordFile();
  if (file.exists) file.delete();
}
