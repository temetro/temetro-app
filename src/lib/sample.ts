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

// Appointments + documents aren't part of the canonical clinic Patient record
// (which a wallet shares), so they live here as local demo data the home grid +
// detail pages render. In the full vision a clinic would push these too.
export type Appointment = {
  date: string;
  time: string;
  clinic: string;
  provider: string;
  reason: string;
};

export const SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    date: '2026-07-08',
    time: '09:30',
    clinic: 'Riverside Endocrinology',
    provider: 'Dr. Hassan',
    reason: 'Thyroid follow-up',
  },
  {
    date: '2026-09-02',
    time: '14:00',
    clinic: 'Riverside Family Medicine',
    provider: 'Dr. Okafor',
    reason: 'Annual physical',
  },
];

export type PatientDocument = {
  title: string;
  kind: string;
  date: string;
};

export const SAMPLE_DOCUMENTS: PatientDocument[] = [
  { title: 'TSH lab panel', kind: 'Lab report', date: '2026-05-20' },
  { title: 'Visit summary — Check-up', kind: 'Clinical note', date: '2026-05-20' },
  { title: 'Penicillin allergy record', kind: 'Allergy note', date: '2025-11-03' },
];

// Mint the patient's first record from their entered profile, seeded with the
// sample medical data so the wallet has something to show + share on day one.
export function buildPatientFromProfile(profile: RegistrationProfile): Patient {
  return {
    ...SAMPLE_PATIENT,
    name: profile.name.trim(),
    sex: profile.sex,
    age: ageFromDob(profile.dob),
    initials: initialsOf(profile.name),
  };
}

// A seed record so a fresh wallet has something to show + share. The patient can
// edit these fields; in the full vision a clinic would push signed updates here.
export const SAMPLE_PATIENT: Patient = {
  fileNumber: '',
  name: 'Amina Yusuf',
  age: 34,
  sex: 'F',
  pcp: 'Self-managed',
  status: 'active',
  initials: 'AY',
  alerts: ['Penicillin allergy'],
  allergies: [
    { substance: 'Penicillin', reaction: 'Hives', severity: 'moderate' },
  ],
  medications: [
    { name: 'Levothyroxine', dose: '50 mcg', frequency: 'Once daily' },
  ],
  problems: [{ label: 'Hypothyroidism', since: '2019' }],
  vitals: { bp: '118/76', hr: '72', temp: '36.8', spo2: '98', takenAt: '2026-06-01' },
  vitalsTrend: { label: 'Heart rate', unit: 'bpm', points: [70, 72, 71, 73, 72] },
  labs: [
    { name: 'TSH', value: '2.1 mIU/L', flag: 'normal', takenAt: '2026-05-20' },
  ],
  labTrend: { label: 'TSH', unit: 'mIU/L', points: [2.4, 2.2, 2.1] },
  encounters: [
    {
      date: '2026-05-20',
      type: 'Check-up',
      provider: 'Dr. Hassan',
      summary: 'Routine thyroid review. Stable on current dose.',
    },
  ],
};
