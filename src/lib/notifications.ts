import { File, Paths } from 'expo-file-system';

import { decryptLocal, encryptLocal } from './crypto';

// A local notification entry — clinic events (record updates, share requests)
// captured as they arrive over the relay so the patient has an inbox even when a
// live sheet was dismissed. Stored encrypted on-device, like the record itself.
export type NotificationKind = 'update' | 'share' | 'info';

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  createdAt: string; // ISO
  read: boolean;
};

const FILENAME = 'temetro-notifications.enc';
const MAX = 100;

function notificationsFile(): File {
  return new File(Paths.document, FILENAME);
}

export async function loadNotifications(localKey: string): Promise<AppNotification[]> {
  const file = notificationsFile();
  if (!file.exists) return [];
  try {
    return JSON.parse(decryptLocal(localKey, await file.text())) as AppNotification[];
  } catch {
    return [];
  }
}

export function saveNotifications(localKey: string, items: AppNotification[]): void {
  const file = notificationsFile();
  if (!file.exists) file.create();
  file.write(encryptLocal(localKey, JSON.stringify(items.slice(0, MAX))));
}

// Build a new notification (newest-first ordering is the caller's job).
export function makeNotification(
  kind: NotificationKind,
  title: string,
  body?: string,
): AppNotification {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false,
  };
}
