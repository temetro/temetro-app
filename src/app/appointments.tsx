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
    timeline: [
      {
        title: a.type || 'Appointment',
        subtitle: a.provider ? `With ${a.provider}` : undefined,
        meta: `${a.date} · ${a.time}`,
        active: true,
      },
      { title: `Status: ${a.status}`, active: a.status === 'completed' },
    ],
  }));
  return <DetailList items={items} empty="No upcoming appointments." />;
}
