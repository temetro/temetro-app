import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import type { Appointment } from './types';

// Local appointment reminders. Everything stays on-device: we read the
// appointments already on the record and schedule a local notification ahead of
// each one. No server, no push token — a natural fit for the offline wallet.

const PREF_KEY = 'temetro.reminders';
// How far before the appointment to fire the reminder.
const LEAD_MS = 60 * 60 * 1000; // 1 hour

type Translate = (key: string, opts?: Record<string, unknown>) => string;

// Show reminders even while the app is foregrounded. Called once at startup.
export function configureReminders(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export function remindersEnabled(): boolean {
  try {
    return SecureStore.getItem(PREF_KEY) === '1';
  } catch {
    return false;
  }
}

export function setRemindersPref(on: boolean): void {
  try {
    SecureStore.setItem(PREF_KEY, on ? '1' : '0');
  } catch {
    /* best effort — the toggle still applies for this session */
  }
}

// Ask for notification permission (used when the patient enables the toggle).
export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

// Parse "YYYY-MM-DD" + "HH:mm" as a local Date.
function appointmentDate(a: Appointment): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(a.date);
  const t = /^(\d{2}):(\d{2})$/.exec(a.time);
  if (!d || !t) return null;
  const date = new Date(
    Number(d[1]),
    Number(d[2]) - 1,
    Number(d[3]),
    Number(t[1]),
    Number(t[2]),
    0,
    0,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

// Cancel all previously-scheduled reminders and (when enabled + permitted)
// reschedule one per upcoming appointment. Safe to call on every record change.
// Does not prompt for permission — the Settings toggle owns that.
export async function syncAppointmentReminders(
  appointments: Appointment[] | undefined,
  t: Translate,
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!remindersEnabled()) return;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;

  const now = Date.now();
  for (const a of appointments ?? []) {
    if (a.status === 'cancelled' || a.status === 'completed') continue;
    const when = appointmentDate(a);
    if (!when) continue;
    const fireAt = when.getTime() - LEAD_MS;
    if (fireAt <= now) continue; // in the past or too soon to remind

    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('reminders.title'),
        body: t('reminders.body', { type: a.type, time: a.time }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
      },
    });
  }
}
