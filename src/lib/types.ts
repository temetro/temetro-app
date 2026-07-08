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

// Appointments and invoices live in their own clinic tables (not on the canonical
// Patient snapshot), but the clinic pushes them alongside the record so the wallet
// can show them. Mirrors backend/src/types/{appointment,invoice}.ts.
export type AppointmentStatus = 'confirmed' | 'checked-in' | 'completed' | 'cancelled';
export type Appointment = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: string;
  provider: string;
  status: AppointmentStatus;
};

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';
export type InvoiceLineItem = { description: string; quantity: number; unitPrice: number };
export type InvoiceInstallment = {
  label: string;
  amount: number;
  dueAt: string | null;
  paid: boolean;
};
export type Invoice = {
  id: string;
  number: string;
  issuedAt: string; // YYYY-MM-DD
  dueAt: string | null;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  installments: InvoiceInstallment[];
  notes: string | null;
};

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
  // Pushed by the clinic alongside the record (optional on older records).
  appointments?: Appointment[];
  invoices?: Invoice[];
};
