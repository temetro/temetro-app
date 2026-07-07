import * as SecureStore from 'expo-secure-store';

// Client for a clinic's public Patient Portal API (backend `/api/portal/...`),
// reached by scanning the clinic's portal QR. Unauthenticated: the clinic is
// identified by its slug in the URL, and booking verifies name + file number.

// A parsed clinic portal QR. The QR encodes the web portal URL
// (`https://<host>/portal/<slug>`); an optional `?api=` query carries the
// backend base so this native app can reach the JSON API (a phone camera
// opening the same URL still lands on the working web portal).
export type PortalRef = { api: string; slug: string; webUrl: string };

export type Doctor = { name: string; specialty: string | null };
export type Availability = { date: string; provider: string; taken: string[] };
export type Booking = { date: string; time: string; type: string; provider: string };

// Parse a scanned string into a PortalRef, or null if it isn't a portal URL.
// String-based (Hermes' URL is partial) — mirrors parsePairingUri's approach.
export function parsePortalUri(uri: string): PortalRef | null {
  try {
    const noHash = uri.split('#')[0];
    const [path, query = ''] = noHash.split('?');
    const m = path.match(/^(https?):\/\/([^/]+)\/portal\/([^/]+)\/?$/i);
    if (!m) return null;
    const origin = `${m[1]}://${m[2]}`;
    const slug = decodeURIComponent(m[3]);
    const params = new URLSearchParams(query);
    const api = (params.get('api') || origin).replace(/\/+$/, '');
    return { api, slug, webUrl: uri };
  } catch {
    return null;
  }
}

async function toError(res: Response): Promise<Error> {
  try {
    const body = (await res.json()) as { error?: string; message?: string };
    return new Error(body.error || body.message || `Request failed (${res.status}).`);
  } catch {
    return new Error(`Request failed (${res.status}).`);
  }
}

async function getJson<T>(ref: PortalRef, path: string): Promise<T> {
  const res = await fetch(`${ref.api}/api/portal/${ref.slug}${path}`);
  if (!res.ok) throw await toError(res);
  return (await res.json()) as T;
}

export function getClinic(ref: PortalRef): Promise<{ name: string }> {
  return getJson(ref, '');
}

export function getDoctors(ref: PortalRef): Promise<Doctor[]> {
  return getJson(ref, '/doctors');
}

export function getAvailability(
  ref: PortalRef,
  provider: string,
  date: string,
): Promise<Availability> {
  const q = new URLSearchParams({ provider, date }).toString();
  return getJson(ref, `/availability?${q}`);
}

// Register the wallet's patient as a demographics-only patient at the clinic so
// they get a file number to book with. The number is cached per clinic slug so
// repeat bookings reuse the same record instead of creating duplicates.
async function ensureFileNumber(
  ref: PortalRef,
  demographics: { name: string; sex: string; age: number },
): Promise<string> {
  const key = `temetro.portal.file.${ref.slug}`;
  const cached = await SecureStore.getItemAsync(key).catch(() => null);
  if (cached) return cached;
  const res = await fetch(`${ref.api}/api/portal/${ref.slug}/patients`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(demographics),
  });
  if (!res.ok) throw await toError(res);
  const { fileNumber } = (await res.json()) as { fileNumber: string };
  await SecureStore.setItemAsync(key, fileNumber).catch(() => {});
  return fileNumber;
}

// Book an appointment with the chosen doctor at the chosen slot. Registers the
// patient first if needed, then posts the booking. A 409 (slot just taken) is
// surfaced to the caller so the UI can refresh availability.
export async function bookAppointment(
  ref: PortalRef,
  args: {
    demographics: { name: string; sex: string; age: number };
    provider: string;
    date: string;
    time: string;
  },
): Promise<Booking> {
  const fileNumber = await ensureFileNumber(ref, args.demographics);
  const res = await fetch(`${ref.api}/api/portal/${ref.slug}/appointments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      fileNumber,
      name: args.demographics.name,
      provider: args.provider,
      date: args.date,
      time: args.time,
    }),
  });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as Booking;
}

// Candidate booking slots offered on the portal (09:00–16:30, every 30 min).
// The screen disables any that the availability endpoint reports as taken.
export const SLOT_TIMES: string[] = (() => {
  const out: string[] = [];
  for (let h = 9; h < 17; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 16) out.push(`${String(h).padStart(2, '0')}:30`);
  }
  return out;
})();

// The next `count` calendar days as { date: 'YYYY-MM-DD', label } for the date picker.
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
