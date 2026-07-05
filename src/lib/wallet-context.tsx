import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Socket } from 'socket.io-client';

import { loadRelayOverride, relayUrl as resolveRelayUrl } from './config';
import { hexToBytes, open, verifySignature, x25519PrivFromSeed } from './crypto';
import {
  checkAndPinClinicKey,
  loadUpdates,
  type PendingUpdate,
  saveUpdates,
} from './pending-updates';
import { deleteRecord, loadRecord, saveRecord } from './records';
import { clearRegistered, isRegistered, setRegistered } from './registration';
import {
  connectRelay,
  type Pairing,
  type RecordUpdateEvent,
  respondToPairing,
  respondToShare,
  respondToUpdate,
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
  pendingUpdates: PendingUpdate[];
  register: (profile: RegistrationProfile) => Promise<void>;
  approve: (request: ShareRequest) => void;
  deny: (request: ShareRequest) => void;
  approveUpdate: (update: PendingUpdate) => void;
  denyUpdate: (update: PendingUpdate) => void;
  respondToPairing: (pairing: Pairing) => Promise<boolean>;
  updateRecord: (patient: Patient) => void;
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
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const identityRef = useRef<WalletIdentity | null>(null);
  const recordRef = useRef<Patient | null>(null);
  const updatesRef = useRef<PendingUpdate[]>([]);

  const persistUpdates = (next: PendingUpdate[]) => {
    updatesRef.current = next;
    setPendingUpdates(next);
    const id = identityRef.current;
    if (id) saveUpdates(id.localKey, next);
  };

  // A clinic pushed a record update: open it with our derived X25519 key, verify
  // the clinic's signature over the plaintext, TOFU-pin the clinic key, and queue
  // it for the patient to review. Ignored silently if it can't be trusted.
  const handleUpdateRequest = (event: RecordUpdateEvent) => {
    const id = identityRef.current;
    if (!id) return;
    // Skip anything we already hold (the relay re-sends on reconnect).
    if (updatesRef.current.some((u) => u.requestId === event.requestId)) return;
    try {
      const priv = x25519PrivFromSeed(id.privateKeyHex);
      const plaintext = open(priv, event.sealed);
      const ok = verifySignature(
        hexToBytes(event.clinicPublicKey),
        event.signature,
        plaintext,
      );
      if (!ok) return;
      const bundle = JSON.parse(new TextDecoder().decode(plaintext)) as {
        patient: Patient;
        changes: string[];
      };
      void checkAndPinClinicKey(event.clinicName, event.clinicPublicKey).then(
        (keyOk) => {
          const update: PendingUpdate = {
            requestId: event.requestId,
            clinicName: event.clinicName,
            clinicPublicKey: event.clinicPublicKey,
            fingerprint: event.fingerprint,
            changes: bundle.changes ?? event.changes ?? [],
            patient: bundle.patient,
            createdAt: event.createdAt,
            keyChanged: !keyOk,
          };
          if (updatesRef.current.some((u) => u.requestId === update.requestId)) {
            return;
          }
          persistUpdates([...updatesRef.current, update]);
        },
      );
    } catch {
      /* undecryptable / malformed — drop it */
    }
  };

  // (Re)connect the relay socket to the given URL.
  const connect = (id: WalletIdentity, url: string) => {
    socketRef.current?.disconnect();
    setStatus('connecting');
    socketRef.current = connectRelay(url, id, {
      onStatus: setStatus,
      onShareRequest: (request) => setPendingRequest(request),
      onUpdateRequest: handleUpdateRequest,
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
      const saved = await loadUpdates(id.localKey);
      updatesRef.current = saved;
      setPendingUpdates(saved);
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

  // The patient approved a pushed update: replace the on-device record with the
  // clinic's snapshot, tell the clinic, and clear it from the inbox.
  const approveUpdate = (update: PendingUpdate) => {
    const id = identityRef.current;
    if (id) {
      saveRecord(id.localKey, update.patient);
      recordRef.current = update.patient;
      setRecord(update.patient);
    }
    const socket = socketRef.current;
    if (socket && id) {
      respondToUpdate(socket, id, update.requestId, 'approved');
    }
    persistUpdates(
      updatesRef.current.filter((u) => u.requestId !== update.requestId),
    );
  };

  const denyUpdate = (update: PendingUpdate) => {
    const socket = socketRef.current;
    const id = identityRef.current;
    if (socket && id) {
      respondToUpdate(socket, id, update.requestId, 'denied');
    }
    persistUpdates(
      updatesRef.current.filter((u) => u.requestId !== update.requestId),
    );
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
    updatesRef.current = [];
    setPendingUpdates([]);
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
        pendingUpdates,
        register,
        approve,
        deny,
        approveUpdate,
        denyUpdate,
        respondToPairing: respondToPairingShare,
        updateRecord,
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
