import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { relayUrl } from './config';
import { fromBase64 } from './crypto';
import { hasDocBytes, loadDocBytes, saveDocBytes } from './doc-store';
import { openPortalSession, type ResultFile } from './portal';
import type { WalletDocument } from './types';
import type { WalletIdentity } from './wallet';

export function isImage(doc: WalletDocument): boolean {
  return doc.mimeType.startsWith('image/');
}

/** True when the bytes are already on the device (so it opens offline). */
export function isCached(doc: WalletDocument): boolean {
  return hasDocBytes(doc.id);
}

export class DocumentError extends Error {}

// Get a document's bytes as base64: from the encrypted on-device cache if we
// have them, otherwise from the clinic that sent the file.
//
// The clinic keeps the bytes; it only pushes metadata. The portal's
// `result-file` action serves them, gated on the wallet being linked to the
// patient, and it reads the same attachment table the pushed documents come
// from — so the ids already line up and nothing new is needed server-side.
export async function fetchDocBytes(
  identity: WalletIdentity,
  doc: WalletDocument,
): Promise<string> {
  const cached = await loadDocBytes(identity.localKey, doc.id);
  if (cached) return cached;

  if (doc.source === 'patient') {
    // Patient photos only ever exist on this device; there is nowhere to
    // re-fetch them from, so a miss here means the cache is gone.
    throw new DocumentError('missing');
  }
  if (!doc.clinicId) {
    // Pushed by a clinic too old to send its id, so we can't route the request.
    throw new DocumentError('unknown-clinic');
  }

  const session = openPortalSession(
    { relay: relayUrl(), clinic: doc.clinicId, slug: '' },
    identity,
  );
  try {
    const file = await session.request<ResultFile>('result-file', {
      id: doc.id,
    });
    if (!file?.base64) throw new DocumentError('failed');
    // Cache it so the next open works without the clinic, or a network.
    saveDocBytes(identity.localKey, doc.id, file.base64);
    return file.base64;
  } finally {
    session.close();
  }
}

// Hand a document to the OS viewer (Quick Look on iOS, the chooser on Android).
//
// Sharing needs a real file, so the plaintext has to touch the disk. Write it to
// the cache directory rather than the document directory, and delete it once the
// sheet closes, so the only durable copy stays the encrypted one.
export async function openDocExternally(
  doc: WalletDocument,
  base64: string,
): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new DocumentError('no-viewer');
  }
  const safe = doc.filename.replace(/[^\w.\-]+/g, '_') || 'document';
  const file = new File(Paths.cache, safe);
  if (file.exists) file.delete();
  file.create();
  file.write(fromBase64(base64));
  try {
    await Sharing.shareAsync(file.uri, {
      mimeType: doc.mimeType,
      UTI: doc.mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
    });
  } finally {
    if (file.exists) file.delete();
  }
}
