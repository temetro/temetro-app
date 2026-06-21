import type { Patient } from './types';

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
