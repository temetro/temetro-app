import { useTranslation } from 'react-i18next';

import { DetailList } from '@/components/detail-list';
import { useWallet } from '@/lib/wallet-context';

export default function PrescriptionsScreen() {
  const { t } = useTranslation();
  const { record } = useWallet();
  const items = (record?.medications ?? []).map((m, i) => ({
    id: `${m.name}-${i}`,
    title: m.name,
    meta: m.dose,
    subtitle: m.frequency,
    rows: [
      { label: t('prescriptionsScreen.dose'), value: m.dose },
      { label: t('prescriptionsScreen.frequency'), value: m.frequency },
    ],
  }));
  return <DetailList items={items} empty={t('prescriptionsScreen.empty')} />;
}
