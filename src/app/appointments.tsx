import { DetailList } from '@/components/detail-list';
import { formatDate } from '@/lib/format';
import { SAMPLE_APPOINTMENTS } from '@/lib/sample';

export default function AppointmentsScreen() {
  const items = SAMPLE_APPOINTMENTS.map((a, i) => ({
    id: `${a.date}-${i}`,
    title: a.reason,
    meta: `${formatDate(a.date)} · ${a.time}`,
    subtitle: a.clinic,
    body: `with ${a.provider}`,
  }));
  return <DetailList items={items} empty="No upcoming appointments." />;
}
