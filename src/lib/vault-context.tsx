import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import * as vault from './vault';

type VaultContextValue = {
  ready: boolean;
  hasVault: boolean;
  unlocked: boolean;
  method: vault.VaultMethod | null;
  create: (password: string, method: vault.VaultMethod) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  refresh: () => Promise<void>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

// Reactive wrapper around the vault module so screens + the launch gate can read
// lock state. The actual secrets/verifier stay in src/lib/vault.ts.
export function VaultProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hasVault, setHasVault] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [method, setMethod] = useState<vault.VaultMethod | null>(null);

  const refresh = async () => {
    const has = await vault.hasVault();
    setHasVault(has);
    setMethod(has ? await vault.getVaultMethod() : null);
    setUnlocked(vault.isUnlocked());
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, []);

  const create = async (password: string, m: vault.VaultMethod) => {
    await vault.createVault(password, m);
    setHasVault(true);
    setMethod(m);
    setUnlocked(true);
  };

  const unlock = async (password: string): Promise<boolean> => {
    const ok = await vault.unlock(password);
    if (ok) setUnlocked(true);
    return ok;
  };

  const lock = () => {
    vault.lock();
    setUnlocked(false);
  };

  return (
    <VaultContext.Provider
      value={{ ready, hasVault, unlocked, method, create, unlock, lock, refresh }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault(): VaultContextValue {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within a VaultProvider');
  return ctx;
}
