import { Stack } from 'expo-router';
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { Sex } from '@/lib/types';

// Wallet creation is three steps: who you are, when you were born, then the PIN
// (which lives at /vault-setup, driven by the gate once registration lands).
export const REGISTER_STEPS = 3;

type Draft = { name: string; sex: Sex | ''; day: string; month: string; year: string };

type DraftValue = {
  draft: Draft;
  setDraft: (patch: Partial<Draft>) => void;
};

const EMPTY: Draft = { name: '', sex: '', day: '', month: '', year: '' };

const RegisterDraftContext = createContext<DraftValue | null>(null);

// The half-filled profile, held in context rather than route params: it's the
// patient's name and date of birth, and route params would put both in
// navigation history.
export function RegisterDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<Draft>(EMPTY);
  const value = useMemo<DraftValue>(
    () => ({
      draft,
      setDraft: (patch) => setDraftState((d) => ({ ...d, ...patch })),
    }),
    [draft],
  );
  return (
    <RegisterDraftContext.Provider value={value}>
      {children}
    </RegisterDraftContext.Provider>
  );
}

export function useRegisterDraft(): DraftValue {
  const ctx = useContext(RegisterDraftContext);
  if (!ctx) {
    throw new Error('useRegisterDraft must be used within a RegisterDraftProvider');
  }
  return ctx;
}

export default function RegisterLayout() {
  return (
    <RegisterDraftProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="age" />
      </Stack>
    </RegisterDraftProvider>
  );
}
