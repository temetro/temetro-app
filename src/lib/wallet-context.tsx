import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Socket } from 'socket.io-client';

import { loadRelayOverride, relayUrl as resolveRelayUrl, setRelayOverride } from './config';
import { deleteRecord, loadRecord, saveRecord } from './records';
import { clearRegistered, isRegistered, setRegistered } from './registration';
import {
  connectRelay,
  type Pairing,
  respondToPairing,
  respondToShare,
  type RelayStatus,
  type ShareRequest,
} from './relay';
import { buildPatientFromProfile, type RegistrationProfile } from './sample';
import type { Patient } from './types';
import { getWallet, resetWallet, type WalletIdentity } from './wallet';

type WalletContextValue = {
  ready: boolean;
  registered: boolean;
  identity: WalletIdentity | null;
  record: Patient | null;
  status: RelayStatus;
  relayUrl: string;
  pendingRequest: ShareRequest | null;
  register: (profile: RegistrationProfile) => Promise<void>;
  approve: (request: ShareRequest) => void;
  deny: (request: ShareRequest) => void;
  respondToPairing: (pairing: Pairing) => Promise<boolean>;
  updateRecord: (patient: Patient) => void;
  setRelayUrl: (url: string) => Promise<void>;
  reset: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [registered, setRegisteredState] = useState(false);
  const [identity, setIdentity] = useState<WalletIdentity | null>(null);
  const [record, setRecord] = useState<Patient | null>(null);
  const [status, setStatus] = useState<RelayStatus>('connecting');
  const [relayUrl, setRelayUrlState] = useState<string>(resolveRelayUrl());
  const [pendingRequest, setPendingRequest] = useState<ShareRequest | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const identityRef = useRef<WalletIdentity | null>(null);
  const recordRef = useRef<Patient | null>(null);

  // (Re)connect the relay socket to the given URL.
  const connect = (id: WalletIdentity, url: string) => {
    socketRef.current?.disconnect();
    setStatus('connecting');
    socketRef.current = connectRelay(url, id, {
      onStatus: setStatus,
      onShareRequest: (request) => setPendingRequest(request),
    });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      await loadRelayOverride();
      const id = await getWallet();
      if (!active) return;
      identityRef.current = id;
      setIdentity(id);
      const rec = await loadRecord(id.localKey);
      recordRef.current = rec;
      setRecord(rec);
      setRegisteredState(await isRegistered());
      const url = resolveRelayUrl();
      setRelayUrlState(url);
      connect(id, url);
      if (active) setReady(true);
    })();
    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Mint the patient's first record from their profile and mark them registered.
  const register = async (profile: RegistrationProfile) => {
    const id = identityRef.current;
    if (!id) return;
    const patient = buildPatientFromProfile(profile);
    saveRecord(id.localKey, patient);
    recordRef.current = patient;
    setRecord(patient);
    await setRegistered();
    setRegisteredState(true);
  };

  const approve = (request: ShareRequest) => {
    const socket = socketRef.current;
    const id = identityRef.current;
    if (socket && id && recordRef.current) {
      respondToShare(socket, id, request, 'approved', recordRef.current);
    }
    setPendingRequest(null);
  };

  const deny = (request: ShareRequest) => {
    const socket = socketRef.current;
    const id = identityRef.current;
    if (socket && id) respondToShare(socket, id, request, 'denied');
    setPendingRequest(null);
  };

  const respondToPairingShare = async (pairing: Pairing): Promise<boolean> => {
    const id = identityRef.current;
    if (!id || !recordRef.current) return false;
    return respondToPairing(id, recordRef.current, pairing);
  };

  const updateRecord = (patient: Patient) => {
    const id = identityRef.current;
    if (!id) return;
    saveRecord(id.localKey, patient);
    recordRef.current = patient;
    setRecord(patient);
  };

  const setRelayUrl = async (url: string) => {
    await setRelayOverride(url);
    const next = resolveRelayUrl();
    setRelayUrlState(next);
    if (identityRef.current) connect(identityRef.current, next);
  };

  const reset = async () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    // Wipe keys + the on-disk record + the registered flag so the wallet returns
    // to a clean first-run state (onboarding stays done; registration repeats).
    await resetWallet();
    deleteRecord();
    await clearRegistered();
    recordRef.current = null;
    setRecord(null);
    setRegisteredState(false);
    const id = await getWallet();
    identityRef.current = id;
    setIdentity(id);
    connect(id, resolveRelayUrl());
  };

  return (
    <WalletContext.Provider
      value={{
        ready,
        registered,
        identity,
        record,
        status,
        relayUrl,
        pendingRequest,
        register,
        approve,
        deny,
        respondToPairing: respondToPairingShare,
        updateRecord,
        setRelayUrl,
        reset,
      }}
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
