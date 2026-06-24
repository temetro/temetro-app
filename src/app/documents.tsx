import { DetailList } from '@/components/detail-list';
import { formatDate } from '@/lib/format';
import { SAMPLE_DOCUMENTS } from '@/lib/sample';

export default function DocumentsScreen() {
  const items = SAMPLE_DOCUMENTS.map((d, i) => ({
    id: `${d.title}-${i}`,
    title: d.title,
    meta: formatDate(d.date),
    subtitle: d.kind,
  }));
  return <DetailList items={items} empty="No documents yet." />;
}
