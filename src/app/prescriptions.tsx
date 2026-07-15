import { useTranslation } from 'react-i18next';

import { DetailList, type DetailItem } from '@/components/detail-list';
import type { Prescription } from '@/lib/types';
import { useWallet } from '@/lib/wallet-context';

export default function PrescriptionsScreen() {
  const { t } = useTranslation();
  const { record } = useWallet();

  const prescriptions = record?.prescriptions ?? [];
  // Records pushed by a clinic older than the prescriptions bundle key carry
  // nothing here, so fall back to the medication list on the snapshot.
  const items: DetailItem[] = prescriptions.length
    ? prescriptions.map(toItem(t))
    : (record?.medications ?? []).map((m, i) => ({
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

function toItem(t: (k: string) => string) {
  return (p: Prescription): DetailItem => {
    const rows = [
      { label: t('prescriptionsScreen.dose'), value: p.dose },
      { label: t('prescriptionsScreen.frequency'), value: p.frequency },
      { label: t('prescriptionsScreen.prescriber'), value: p.prescriber },
      {
        label: t('prescriptionsScreen.status'),
        value: t(`prescriptionsScreen.statusValue.${p.status}`),
      },
      { label: t('prescriptionsScreen.prescribedAt'), value: p.prescribedAt },
    ];
    if (p.duration) {
      rows.push({
        label: t('prescriptionsScreen.duration'),
        value: p.duration,
      });
    }
    if (p.endDate) {
      rows.push({ label: t('prescriptionsScreen.endDate'), value: p.endDate });
    }
    return {
      id: p.id,
      title: p.medication,
      meta: p.dose,
      subtitle: p.frequency,
      body: p.notes ?? undefined,
      rows,
    };
  };
}
