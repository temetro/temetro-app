import type { Patient, Sex } from './types';

// What the registration screen collects before minting a record.
export type RegistrationProfile = {
  name: string;
  dob: string; // YYYY-MM-DD
  sex: Sex;
};

// Initials from a full name, e.g. "Amina Yusuf" -> "AY".
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Whole years between a YYYY-MM-DD birth date and today (0 if unparseable).
function ageFromDob(dob: string): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age < 0 ? 0 : age;
}

const EMPTY_TREND = { label: '', unit: '', points: [] as number[] };

// A blank record — no clinical data seeded. Used as the on-disk fallback when
// no record exists yet (records.ts) and as the base for a new registration.
export function emptyPatient(): Patient {
  return {
    fileNumber: '',
    name: '',
    age: 0,
    sex: 'F',
    pcp: 'Self-managed',
    status: 'active',
    initials: '?',
    alerts: [],
    allergies: [],
    medications: [],
    problems: [],
    vitals: { bp: '', hr: '', temp: '', spo2: '', takenAt: '' },
    vitalsTrend: { ...EMPTY_TREND },
    labs: [],
    labTrend: { ...EMPTY_TREND },
    encounters: [],
  };
}

// Mint the patient's first record from their entered profile. The record starts
// empty — clinical data is added when a clinic pushes signed updates or the
// patient shares/imports a record. No demo data is seeded.
export function buildPatientFromProfile(profile: RegistrationProfile): Patient {
  return {
    ...emptyPatient(),
    name: profile.name.trim(),
    age: ageFromDob(profile.dob),
    sex: profile.sex,
    initials: initialsOf(profile.name),
  };
}
