import { useTranslation } from 'react-i18next';

import { DetailList, type DetailItem } from '@/components/detail-list';
import { useWallet } from '@/lib/wallet-context';

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const { record } = useWallet();
  // Appointments are pushed by the clinic alongside the record (see wallet-context).
  const items: DetailItem[] = (record?.appointments ?? []).map((a) => {
    const title = a.type || t('appointmentsScreen.fallback');
    return {
      id: a.id,
      title,
      meta: a.date,
      subtitle: [a.time, a.provider].filter(Boolean).join(' · '),
      timeline: [
        {
          title,
          subtitle: a.provider
            ? t('appointmentsScreen.with', { provider: a.provider })
            : undefined,
          meta: `${a.date} · ${a.time}`,
          active: true,
        },
        {
          title: t('appointmentsScreen.status', { status: a.status }),
          active: a.status === 'completed',
        },
      ],
    };
  });
  return <DetailList items={items} empty={t('appointmentsScreen.empty')} />;
}
