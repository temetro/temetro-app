import { DetailList } from '@/components/detail-list';

export default function AppointmentsScreen() {
  // Appointments aren't part of the shared record yet — a clinic would push these.
  return <DetailList items={[]} empty="No upcoming appointments." />;
}
