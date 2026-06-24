import { DetailList } from '@/components/detail-list';
import { formatDate } from '@/lib/format';
import { useWallet } from '@/lib/wallet-context';

export default function VisitsScreen() {
  const { record } = useWallet();
  const items = (record?.encounters ?? []).map((e, i) => ({
    id: `${e.date}-${i}`,
    title: e.type,
    meta: formatDate(e.date),
    subtitle: e.provider,
    body: e.summary,
  }));
  return <DetailList items={items} empty="No visits recorded yet." />;
}
