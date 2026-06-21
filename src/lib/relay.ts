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

export function connectRelay(
  apiUrl: string,
  identity: WalletIdentity,
  handlers: {
    onStatus: (status: RelayStatus) => void;
    onShareRequest: (request: ShareRequest) => void;
  },
): Socket {
  const socket = io(`${apiUrl}/wallet`, {
    transports: ['websocket'],
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

  return socket;
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
