import { io, type Socket } from 'socket.io-client';

import { seal, signMessage, utf8ToBytes } from './crypto';
import type { Patient } from './types';
import type { WalletIdentity } from './wallet';

// Connection to the clinic backend's /wallet relay namespace. The relay only
// ever forwards ciphertext; we prove control of the wallet by signing a
// server-issued challenge, then receive encrypted share requests and reply with
// a sealed, signed bundle (or a denial).

export type RelayStatus =
  | 'connecting'
  | 'connected'
  | 'authenticated'
  | 'auth-failed'
  | 'disconnected';

export type ShareRequest = {
  requestId: string;
  clinicName: string;
  requestedBy: string;
  ephemeralPubKey: string;
  mode: 'permanent' | 'temporary';
  durationHours: number | null;
};

// A clinic→wallet record update pushed over the relay. `sealed` is the encrypted
// patient snapshot (opened with the wallet's derived X25519 key);
// `signature`/`clinicPublicKey` prove the clinic authored it.
export type RecordUpdateEvent = {
  requestId: string;
  clinicName: string;
  sealed: string;
  signature: string;
  clinicPublicKey: string;
  fingerprint: string;
  changes: string[];
  createdAt: string;
};

export function connectRelay(
  apiUrl: string,
  identity: WalletIdentity,
  handlers: {
    onStatus: (status: RelayStatus) => void;
    onShareRequest: (request: ShareRequest) => void;
    onUpdateRequest?: (update: RecordUpdateEvent) => void;
  },
): Socket {
  const socket = io(`${apiUrl}/wallet`, {
    transports: ['websocket', 'polling'],
    forceNew: true,
  });

  socket.on('connect', () => handlers.onStatus('connected'));
  socket.on('disconnect', () => handlers.onStatus('disconnected'));
  socket.io.on('reconnect_attempt', () => handlers.onStatus('connecting'));

  // The server proves we hold the wallet key before letting us join our room.
  socket.on('wallet:challenge', ({ challenge }: { challenge: string }) => {
    const signature = signMessage(identity.privateKeyHex, utf8ToBytes(challenge));
    socket.emit(
      'wallet:auth',
      { walletNumber: identity.walletNumber, signature },
      (ack: { ok: boolean }) =>
        handlers.onStatus(ack?.ok ? 'authenticated' : 'auth-failed'),
    );
  });

  socket.on('wallet:share-request', (request: ShareRequest) =>
    handlers.onShareRequest(request),
  );

  socket.on('wallet:update-request', (update: RecordUpdateEvent) =>
    handlers.onUpdateRequest?.(update),
  );

  return socket;
}

// Tell the clinic the patient's decision on a pushed record update. The decision
// is signed (`${decision}:${requestId}`) so the backend can verify it came from
// this wallet before resolving the update.
export function respondToUpdate(
  socket: Socket,
  identity: WalletIdentity,
  requestId: string,
  decision: 'approved' | 'denied',
): void {
  const signature = signMessage(
    identity.privateKeyHex,
    utf8ToBytes(`${decision}:${requestId}`),
  );
  socket.emit('wallet:update-response', {
    requestId,
    walletNumber: identity.walletNumber,
    decision,
    signature,
  });
}

// Parsed contents of a scanned `temetro-pair:` QR (a clinic's relay URL + the
// pending request + the ephemeral key to seal to).
export type Pairing = {
  relay: string;
  rid: string;
  epk: string;
  mode?: string;
  dur?: string;
};

export function parsePairingUri(uri: string): Pairing | null {
  try {
    const q = uri.includes('?') ? uri.slice(uri.indexOf('?') + 1) : '';
    const params = new URLSearchParams(q);
    const relay = params.get('relay');
    const rid = params.get('rid');
    const epk = params.get('epk');
    if (!relay || !rid || !epk) return null;
    return {
      relay,
      rid,
      epk,
      mode: params.get('mode') ?? undefined,
      dur: params.get('dur') ?? undefined,
    };
  } catch {
    return null;
  }
}

// QR flow: connect to the clinic's relay (from the scanned QR — may differ from
// our default), authenticate, and submit the sealed + signed bundle for that
// request, then disconnect. Resolves true on success.
export function respondToPairing(
  identity: WalletIdentity,
  patient: Patient,
  pairing: Pairing,
): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = io(`${pairing.relay}/wallet`, {
      transports: ['websocket', 'polling'],
      forceNew: true,
    });
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      socket.disconnect();
      resolve(ok);
    };
    socket.on('wallet:challenge', ({ challenge }: { challenge: string }) => {
      const signature = signMessage(identity.privateKeyHex, utf8ToBytes(challenge));
      socket.emit(
        'wallet:auth',
        { walletNumber: identity.walletNumber, signature },
        (ack: { ok: boolean }) => {
          if (!ack?.ok) return finish(false);
          const bytes = utf8ToBytes(JSON.stringify({ patient }));
          socket.emit(
            'wallet:share-response',
            {
              requestId: pairing.rid,
              walletNumber: identity.walletNumber,
              decision: 'approved',
              sealed: seal(pairing.epk, bytes),
              signature: signMessage(identity.privateKeyHex, bytes),
            },
            (ack2: { ok: boolean }) => finish(!!ack2?.ok),
          );
        },
      );
    });
    // Give up if we can't reach the relay — long enough to tolerate a first
    // cold connection over cellular / a public tunnel, short enough not to hang.
    setTimeout(() => finish(false), 15000);
  });
}

// Reply to a share request. On approval, the record bundle is signed with the
// wallet key (provenance) and sealed to the clinic's ephemeral key (privacy).
export function respondToShare(
  socket: Socket,
  identity: WalletIdentity,
  request: ShareRequest,
  decision: 'approved' | 'denied',
  patient?: Patient,
): void {
  if (decision === 'denied' || !patient) {
    socket.emit('wallet:share-response', {
      requestId: request.requestId,
      walletNumber: identity.walletNumber,
      decision: 'denied',
    });
    return;
  }
  const bytes = utf8ToBytes(JSON.stringify({ patient }));
  const signature = signMessage(identity.privateKeyHex, bytes);
  const sealed = seal(request.ephemeralPubKey, bytes);
  socket.emit('wallet:share-response', {
    requestId: request.requestId,
    walletNumber: identity.walletNumber,
    decision: 'approved',
    sealed,
    signature,
  });
}
