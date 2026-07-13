import { useTranslation } from 'react-i18next';

import { DetailList } from '@/components/detail-list';
import { formatDate } from '@/lib/format';
import { useWallet } from '@/lib/wallet-context';

export default function VisitsScreen() {
  const { t } = useTranslation();
  const { record } = useWallet();
  const items = (record?.encounters ?? []).map((e, i) => ({
    id: `${e.date}-${i}`,
    title: e.type,
    meta: formatDate(e.date),
    subtitle: e.provider,
    body: e.summary,
    rows: [
      { label: t('visitsScreen.date'), value: formatDate(e.date) },
      { label: t('visitsScreen.type'), value: e.type },
      { label: t('visitsScreen.provider'), value: e.provider },
    ],
  }));
  return <DetailList items={items} empty={t('visitsScreen.empty')} />;
}
