import { DetailList } from '@/components/detail-list';

export default function DocumentsScreen() {
  // Documents aren't part of the shared record yet — a clinic would push these.
  return <DetailList items={[]} empty="No documents yet." />;
}
