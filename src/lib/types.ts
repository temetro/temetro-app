// Patient record shape — mirrors the clinic's canonical Patient
// (temetro-mono/backend/src/types/patient.ts) so a bundle shared from this
// wallet imports cleanly into a clinic.

export type Sex = 'M' | 'F';
export type PatientStatus = 'active' | 'inpatient' | 'discharged';
export type AllergySeverity = 'mild' | 'moderate' | 'severe';
export type LabFlag = 'normal' | 'high' | 'low' | 'critical';

export type Allergy = { substance: string; reaction: string; severity: AllergySeverity };
export type Medication = { name: string; dose: string; frequency: string };
export type Problem = { label: string; since: string };
export type Vitals = { bp: string; hr: string; temp: string; spo2: string; takenAt: string };
export type Lab = { name: string; value: string; flag: LabFlag; takenAt: string };
export type Encounter = { date: string; type: string; provider: string; summary: string };
export type Trend = { label: string; unit: string; points: number[] };

export type Patient = {
  fileNumber: string;
  name: string;
  age: number;
  sex: Sex;
  pcp: string;
  status: PatientStatus;
  initials: string;
  allergies: Allergy[];
  alerts: string[];
  medications: Medication[];
  problems: Problem[];
  vitals: Vitals;
  vitalsTrend: Trend;
  labs: Lab[];
  labTrend: Trend;
  encounters: Encounter[];
};
