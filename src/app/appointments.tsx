import { DetailList, type DetailItem } from '@/components/detail-list';
import { useWallet } from '@/lib/wallet-context';

export default function AppointmentsScreen() {
  const { record } = useWallet();
  // Appointments are pushed by the clinic alongside the record (see wallet-context).
  const items: DetailItem[] = (record?.appointments ?? []).map((a) => ({
    id: a.id,
    title: a.type || 'Appointment',
    meta: a.date,
    subtitle: [a.time, a.provider].filter(Boolean).join(' · '),
    rows: [
      { label: 'Date', value: a.date },
      { label: 'Time', value: a.time },
      { label: 'Provider', value: a.provider || '—' },
      { label: 'Status', value: a.status },
    ],
  }));
  return <DetailList items={items} empty="No upcoming appointments." />;
}
