import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

import { decryptLocal, encryptLocal } from './crypto';
import type { Patient } from './types';

// A clinic→wallet record update waiting for the patient's decision. Opened and
// signature-verified when it arrives, then stored (encrypted, like the record)
// so it survives app restarts until the patient approves or denies it.
export type PendingUpdate = {
  requestId: string;
  clinicId?: string; // stable org id; absent on pushes from older clinics
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
// First key seen for a clinic is pinned; a later, different key raises a warning
// (`keyChanged`) rather than being silently trusted.
//
// Pins are keyed by the clinic's stable id, never its display name. Names are
// mutable and not unique — the clinic falls back to the literal "A clinic" when
// an org is unnamed, so every unnamed clinic used to collide on one pin and the
// second one always tripped a bogus "key changed" warning. Renaming a clinic did
// the same.

type Pins = Record<string, string>; // clinicId -> clinicPublicKey (hex)

async function loadPins(): Promise<Pins> {
  try {
    const raw = await SecureStore.getItemAsync(PINS_KEY);
    return raw ? (JSON.parse(raw) as Pins) : {};
  } catch {
    return {};
  }
}

// Drop every pin. SecureStore outlives app deletion on iOS, so without this a
// stale pin survives a wallet reset *and* a reinstall — a re-seeded dev clinic
// then mints a fresh key under a name we'd already pinned and warns instantly.
export async function clearClinicPins(): Promise<void> {
  await SecureStore.deleteItemAsync(PINS_KEY);
}

// Returns whether the key matches the pinned one (true for a brand-new clinic,
// which pins it now; false only when a pin exists and differs).
export async function checkAndPinClinicKey(
  clinicId: string,
  clinicPublicKey: string,
): Promise<boolean> {
  // A clinic older than the `clinicId` field has nothing stable to pin against,
  // so trust it rather than warn on every push.
  if (!clinicId) return true;
  const pins = await loadPins();
  const existing = pins[clinicId];
  if (existing) return existing === clinicPublicKey;
  pins[clinicId] = clinicPublicKey;
  await SecureStore.setItemAsync(PINS_KEY, JSON.stringify(pins));
  return true;
}
