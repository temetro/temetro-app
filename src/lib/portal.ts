import { File, Paths } from 'expo-file-system';
import { io, type Socket } from 'socket.io-client';

import { fromBase64, signMessage, utf8ToBytes } from './crypto';
import type { WalletIdentity } from './wallet';

// Client for a clinic's Patient Portal over the Temetro Network relay. Reached
// by scanning the clinic's `temetro-portal:` QR (relay URL + clinic signing key
// = the relay's routing id). We connect to {relay}/wallet, prove control of the
// wallet by signing the challenge, then run `portal:request` calls that the relay
// forwards to the clinic's backend and acks back — so this works from a real
// phone without the clinic exposing an HTTP API to the internet.

export type PortalTarget = { relay: string; clinic: string; slug: string };
export type Doctor = { name: string; specialty: string | null };
export type Availability = { date: string; provider: string; taken: string[] };
export type Booking = { date: string; time: string; type: string; provider: string };
export type PortalResults = {
  name: string;
  upcoming: {
    date: string;
    time: string;
    type: string;
    provider: string;
    status: string;
  }[];
  files: {
    id: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    labKey: string | null;
  }[];
};
export type ResultFile = { filename: string; mimeType: string; base64: string };

// Parse a scanned `temetro-portal:` pairing URI. String-based (Hermes' URL is
// partial) — mirrors parsePairingUri in relay.ts.
export function parsePortalPairing(uri: string): PortalTarget | null {
  try {
    if (!uri.startsWith('temetro-portal:')) return null;
    const q = uri.includes('?') ? uri.slice(uri.indexOf('?') + 1) : '';
    const p = new URLSearchParams(q);
    const relay = p.get('relay');
    const clinic = p.get('clinic');
    if (!relay || !clinic) return null;
    return { relay, clinic, slug: p.get('slug') ?? '' };
  } catch {
    return null;
  }
}

export type PortalSession = {
  request: <T = unknown>(action: string, payload?: Record<string, unknown>) => Promise<T>;
  close: () => void;
};

export function openPortalSession(
  target: PortalTarget,
  identity: WalletIdentity,
): PortalSession {
  const socket: Socket = io(`${target.relay}/wallet`, {
    transports: ['websocket', 'polling'],
    forceNew: true,
  });
  let authed = false;
  let failed = false;
  const waiters: ((ok: boolean) => void)[] = [];
  const settleAuth = (ok: boolean) => {
    authed = ok;
    failed = !ok;
    waiters.splice(0).forEach((w) => w(ok));
  };

  socket.on('wallet:challenge', ({ challenge }: { challenge: string }) => {
    const signature = signMessage(identity.privateKeyHex, utf8ToBytes(challenge));
    socket.emit(
      'wallet:auth',
      { walletNumber: identity.walletNumber, signature },
      (ack: { ok: boolean }) => settleAuth(!!ack?.ok),
    );
  });

  const waitAuth = () =>
    new Promise<boolean>((resolve) => {
      if (authed) return resolve(true);
      if (failed) return resolve(false);
      waiters.push(resolve);
      setTimeout(() => resolve(authed), 15000);
    });

  const request = async <T>(
    action: string,
    payload: Record<string, unknown> = {},
  ): Promise<T> => {
    const ok = await waitAuth();
    if (!ok) {
      throw new Error('Could not reach the clinic. Check your connection and try again.');
    }
    return new Promise<T>((resolve, reject) => {
      let done = false;
      const to = setTimeout(() => {
        if (!done) {
          done = true;
          reject(new Error('The request timed out.'));
        }
      }, 25000);
      socket.emit(
        'portal:request',
        { clinicId: target.clinic, action, payload },
        (res: { ok: boolean; data?: T; error?: string }) => {
          if (done) return;
          done = true;
          clearTimeout(to);
          if (res?.ok) resolve(res.data as T);
          else reject(new Error(res?.error || 'Request failed.'));
        },
      );
    });
  };

  return { request, close: () => socket.disconnect() };
}

// Write a downloaded result file (base64) into the app document dir. Returns the
// saved File so the caller can show where it landed.
export function saveResultFile(filename: string, base64: string): File {
  const safe = filename.replace(/[^\w.\-]+/g, '_') || 'result';
  const file = new File(Paths.document, safe);
  if (file.exists) file.delete();
  file.create();
  file.write(fromBase64(base64));
  return file;
}

// Candidate booking slots offered on the portal (09:00–16:30, every 30 min).
export const SLOT_TIMES: string[] = (() => {
  const out: string[] = [];
  for (let h = 9; h < 17; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 16) out.push(`${String(h).padStart(2, '0')}:30`);
  }
  return out;
})();

// The next `count` calendar days as { date, label } for the date picker.
export function upcomingDays(count = 7): { date: string; label: string }[] {
  const days: { date: string; label: string }[] = [];
  const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric' });
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    days.push({ date, label: i === 0 ? 'Today' : fmt.format(d) });
  }
  return days;
}
