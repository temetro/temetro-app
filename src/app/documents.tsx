import { useTranslation } from 'react-i18next';

import { DetailList } from '@/components/detail-list';
import { formatDate } from '@/lib/format';
import { useWallet } from '@/lib/wallet-context';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const { record } = useWallet();
  // Documents are pushed by the clinic as metadata (filename/type/size); the
  // bytes stay on the clinic for now, so this lists what's on file.
  const items = (record?.documents ?? []).map((d) => ({
    id: d.id,
    title: d.filename,
    meta: formatSize(d.sizeBytes),
    subtitle: d.mimeType,
    rows: [
      { label: t('documentsScreen.type'), value: d.mimeType },
      { label: t('documentsScreen.size'), value: formatSize(d.sizeBytes) },
      { label: t('documentsScreen.added'), value: formatDate(d.createdAt) },
    ],
  }));
  return <DetailList items={items} empty={t('documentsScreen.empty')} />;
}
