import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

import { decryptLocal, encryptLocal } from './crypto';
import type { Patient } from './types';

// A clinic→wallet record update waiting for the patient's decision. Opened and
// signature-verified when it arrives, then stored (encrypted, like the record)
// so it survives app restarts until the patient approves or denies it.
export type PendingUpdate = {
  requestId: string;
  clinicName: string;
  clinicPublicKey: string; // hex
  fingerprint: string;
  changes: string[];
  patient: Patient; // the new snapshot applied on approval
  createdAt: string;
  // TOFU: true when this clinic's signing key differs from the one we first
  // pinned for it — surfaced as a warning in the review sheet.
  keyChanged: boolean;
};

const FILENAME = 'temetro-updates.enc';
const PINS_KEY = 'temetro.clinicPins';

function updatesFile(): File {
  return new File(Paths.document, FILENAME);
}

export async function loadUpdates(localKey: string): Promise<PendingUpdate[]> {
  const file = updatesFile();
  if (!file.exists) return [];
  try {
    return JSON.parse(
      decryptLocal(localKey, await file.text()),
    ) as PendingUpdate[];
  } catch {
    return [];
  }
}

export function saveUpdates(localKey: string, updates: PendingUpdate[]): void {
  const file = updatesFile();
  if (!file.exists) file.create();
  file.write(encryptLocal(localKey, JSON.stringify(updates)));
}

// --- TOFU clinic-key pinning ------------------------------------------------
// First key seen for a clinic name is pinned; a later, different key raises a
// warning (`keyChanged`) rather than being silently trusted.

type Pins = Record<string, string>; // clinicName -> clinicPublicKey (hex)

async function loadPins(): Promise<Pins> {
  try {
    const raw = await SecureStore.getItemAsync(PINS_KEY);
    return raw ? (JSON.parse(raw) as Pins) : {};
  } catch {
    return {};
  }
}

// Returns whether the key matches the pinned one (true for a brand-new clinic,
// which pins it now; false only when a pin exists and differs).
export async function checkAndPinClinicKey(
  clinicName: string,
  clinicPublicKey: string,
): Promise<boolean> {
  const pins = await loadPins();
  const existing = pins[clinicName];
  if (existing) return existing === clinicPublicKey;
  pins[clinicName] = clinicPublicKey;
  await SecureStore.setItemAsync(PINS_KEY, JSON.stringify(pins));
  return true;
}
