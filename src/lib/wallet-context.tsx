import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Socket } from 'socket.io-client';

import { API_URL } from './config';
import { loadRecord, saveRecord } from './records';
import { connectRelay, respondToShare, type RelayStatus, type ShareRequest } from './relay';
import type { Patient } from './types';
import { getWallet, resetWallet, type WalletIdentity } from './wallet';

type WalletContextValue = {
  identity: WalletIdentity | null;
  record: Patient | null;
  status: RelayStatus;
  pendingRequest: ShareRequest | null;
  approve: (request: ShareRequest) => void;
  deny: (request: ShareRequest) => void;
  updateRecord: (patient: Patient) => void;
  reset: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<WalletIdentity | null>(null);
  const [record, setRecord] = useState<Patient | null>(null);
  const [status, setStatus] = useState<RelayStatus>('connecting');
  const [pendingRequest, setPendingRequest] = useState<ShareRequest | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const identityRef = useRef<WalletIdentity | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const id = await getWallet();
      if (!active) return;
      identityRef.current = id;
      setIdentity(id);
      setRecord(await loadRecord(id.localKey));
      const socket = connectRelay(API_URL, id, {
        onStatus: setStatus,
        onShareRequest: (request) => setPendingRequest(request),
      });
      socketRef.current = socket;
    })();
    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const approve = (request: ShareRequest) => {
    const socket = socketRef.current;
    const id = identityRef.current;
    if (socket && id && record) {
      respondToShare(socket, id, request, 'approved', record);
    }
    setPendingRequest(null);
  };

  const deny = (request: ShareRequest) => {
    const socket = socketRef.current;
    const id = identityRef.current;
    if (socket && id) respondToShare(socket, id, request, 'denied');
    setPendingRequest(null);
  };

  const updateRecord = (patient: Patient) => {
    const id = identityRef.current;
    if (!id) return;
    saveRecord(id.localKey, patient);
    setRecord(patient);
  };

  const reset = async () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    await resetWallet();
    const id = await getWallet();
    identityRef.current = id;
    setIdentity(id);
    setRecord(await loadRecord(id.localKey));
    const socket = connectRelay(API_URL, id, {
      onStatus: setStatus,
      onShareRequest: (request) => setPendingRequest(request),
    });
    socketRef.current = socket;
  };

  return (
    <WalletContext.Provider
      value={{ identity, record, status, pendingRequest, approve, deny, updateRecord, reset }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
}
