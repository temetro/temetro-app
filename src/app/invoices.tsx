import { Card, Separator, Typography, useThemeColor } from 'heroui-native';
import { ReceiptText } from 'lucide-react-native';
import { View } from 'react-native';

import { RefreshableScrollView } from '@/components/refreshable-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Invoice, InvoiceStatus } from '@/lib/types';
import { useWallet } from '@/lib/wallet-context';

function invoiceTotal(inv: Invoice): number {
  return inv.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
}

function money(n: number): string {
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

// Status → label + tint. "paid" is green, outstanding (sent) amber, drafts/void neutral.
const STATUS_STYLE: Record<InvoiceStatus, { label: string; dot: string; tint: string }> = {
  paid: { label: 'Paid', dot: '#22C55E', tint: 'bg-green-500/12' },
  sent: { label: 'Unpaid', dot: '#F59E0B', tint: 'bg-amber-500/12' },
  draft: { label: 'Draft', dot: '#9AA0A6', tint: 'bg-neutral-500/12' },
  void: { label: 'Void', dot: '#9AA0A6', tint: 'bg-neutral-500/12' },
};

function StatusPill({ status }: { status: InvoiceStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <View className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${s.tint}`}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: s.dot }} />
      <Typography type="body-xs" className="font-semibold text-foreground">
        {s.label}
      </Typography>
    </View>
  );
}

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const { record, reloadRecord } = useWallet();
  const muted = useThemeColor('muted');
  const invoices = record?.invoices ?? [];

  if (invoices.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-10">
        <ReceiptText size={40} color={muted} />
        <Typography type="body" color="muted" align="center">
          No invoices yet.
        </Typography>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <RefreshableScrollView
        onRefresh={reloadRecord}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentContainerClassName="px-5 pt-4 gap-3"
        showsVerticalScrollIndicator={false}>
        {invoices.map((inv) => {
          const paidInstallments = inv.installments.filter((i) => i.paid).length;
          return (
            <Card key={inv.id} className="gap-3">
              <View className="flex-row items-start justify-between gap-3">
                <View className="gap-0.5">
                  <Typography type="body" className="font-semibold text-foreground">
                    {inv.number || 'Invoice'}
                  </Typography>
                  <Typography type="body-xs" color="muted">
                    Issued {inv.issuedAt}
                    {inv.dueAt ? ` · Due ${inv.dueAt}` : ''}
                  </Typography>
                </View>
                <StatusPill status={inv.status} />
              </View>

              <View className="flex-row items-end justify-between">
                <Typography type="h4" className="font-bold text-foreground">
                  {money(invoiceTotal(inv))}
                </Typography>
                {inv.installments.length > 0 ? (
                  <Typography type="body-xs" color="muted">
                    {paidInstallments}/{inv.installments.length} installments paid
                  </Typography>
                ) : null}
              </View>

              {inv.installments.length > 0 ? (
                <View className="gap-0 overflow-hidden rounded-2xl bg-surface">
                  {inv.installments.map((inst, i) => (
                    <View key={inst.label}>
                      {i > 0 ? <Separator /> : null}
                      <View className="flex-row items-center justify-between gap-3 px-3 py-2.5">
                        <Typography type="body-sm" color="muted">
                          {inst.label}
                          {inst.dueAt ? ` · ${inst.dueAt}` : ''}
                        </Typography>
                        <View className="flex-row items-center gap-2">
                          <Typography type="body-sm" className="font-medium text-foreground">
                            {money(inst.amount)}
                          </Typography>
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: inst.paid ? '#22C55E' : '#F59E0B',
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })}
      </RefreshableScrollView>
    </View>
  );
}
