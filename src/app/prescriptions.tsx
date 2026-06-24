import { DetailList } from '@/components/detail-list';
import { useWallet } from '@/lib/wallet-context';

export default function PrescriptionsScreen() {
  const { record } = useWallet();
  const items = (record?.medications ?? []).map((m, i) => ({
    id: `${m.name}-${i}`,
    title: m.name,
    meta: m.dose,
    body: m.frequency,
  }));
  return <DetailList items={items} empty="No active prescriptions." />;
}
