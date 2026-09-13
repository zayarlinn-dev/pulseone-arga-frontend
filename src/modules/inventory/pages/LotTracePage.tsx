import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowLeft, Loader2, Package, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/layout/PageHeader';
import { lotService, type LotPosition, type LotRecipient } from '@/services';
import { formatDate } from '@/lib/utils';

/**
 * The recall screen: everything about one delivery of one medicine.
 *
 * When a vendor recalls a lot, two questions have to be answered before
 * anything else — how much of it is still on our shelves, and who did we
 * already give some to. This page is those two questions side by side, reached
 * from any single batch of the lot because that is what a user has in front of
 * them when the recall notice arrives.
 *
 * The lot is wider than the batch on screen: the same delivery split between
 * the main store and the pharmacy is two `item_batch` rows, and a recall covers
 * both. The backend widens it by the document the stock arrived on.
 */
export default function LotTracePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: trace,
    isLoading,
    error
  } = useQuery({
    queryKey: ['lot-trace', id],
    queryFn: () => lotService.trace(id!),
    enabled: Boolean(id)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        {t('inventory.lot.tracing')}
      </div>
    );
  }

  if (error || !trace) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-destructive">
          {(error as Error)?.message ?? t('inventory.lot.notFound')}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          {t('inventory.lot.goBack')}
        </Button>
      </div>
    );
  }

  const { lot, positions, recipients, totalOnHand, totalDispensed } = trace;

  const positionColumns: Column<LotPosition>[] = [
    {
      header: t('inventory.lot.column.store'),
      sortable: false,
      className: 'font-medium',
      render: row => row.storeName
    },
    {
      header: t('inventory.lot.column.received'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => row.receivedQty.toLocaleString()
    },
    {
      header: t('inventory.lot.column.onHand'),
      sortable: false,
      className: 'text-right tabular-nums font-medium',
      render: row => (
        <span className="flex items-center justify-end gap-2">
          {row.onHandQty.toLocaleString()}
          {/* A store at zero still matters: it held the lot and dispensed all
              of it, so its patients are on the list below. */}
          {row.onHandQty === 0 && <Badge variant="secondary">none left</Badge>}
        </span>
      )
    }
  ];

  const recipientColumns: Column<LotRecipient>[] = [
    {
      header: t('inventory.lot.column.patient'),
      sortable: false,
      className: 'font-medium',
      render: row => row.patientName || '—'
    },
    {
      hideBelow: 'md',
      header: t('inventory.lot.column.contact'),
      sortable: false,
      render: row =>
        row.phoneNo ? (
          <a className="flex items-center gap-1 hover:underline" href={`tel:${row.phoneNo}`}>
            <Phone className="size-3" />
            {row.phoneNo}
          </a>
        ) : (
          <span className="text-muted-foreground">no number on file</span>
        )
    },
    {
      header: t('inventory.lot.column.dispensed'),
      sortable: false,
      render: row => formatDate(row.orderDate)
    },
    {
      hideBelow: 'lg',
      header: t('inventory.lot.column.document'),
      sortable: false,
      className: 'font-mono text-xs',
      render: row => row.pharmacySaleNo ?? row.invoiceNo ?? '—'
    },
    { hideBelow: 'md', header: t('inventory.lot.column.store'), sortable: false, render: row => row.storeName },
    {
      header: t('common.label.qty'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => row.qty.toLocaleString()
    }
  ];

  return (
    <>
      <PageHeader
        title={t('inventory.lot.title', { number: lot.batchNo })}
        description={t('inventory.lot.subtitle', { code: lot.itemCode, name: lot.itemName })}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 size-4" />
            {t('common.action.back')}
          </Button>
        }
      />

      {/* Tracing by batch number is the weak case: two vendors can reuse one,
          so the list below may be wider than the actual recall. Saying so is
          the difference between a caveat and a wrong answer. */}
      {lot.tracedBy === 'batch number' && (
        <Card className="mb-4 flex items-start gap-3 border-warning/40 bg-warning/5 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <p className="text-sm">
            {t('inventory.lot.tracedByBatchWarning', {
              item: lot.itemName,
              number: lot.batchNo
            })}
          </p>
        </Card>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label={t('inventory.lot.stillOnHand')}
          value={totalOnHand.toLocaleString()}
        />
        <SummaryCard
          label={t('inventory.lot.dispensedToPatients')}
          value={totalDispensed.toLocaleString()}
        />
        <SummaryCard
          label={t('inventory.lot.expires')}
          value={lot.expiryDate ? formatDate(lot.expiryDate) : '—'}
        />
        <SummaryCard
          label={t('inventory.lot.receivedOn')}
          value={lot.sourceDocument || '—'}
          hint={lot.vendorName || undefined}
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Package className="size-4" />
          {t('inventory.lot.whereItIs')}
          <span className="font-normal text-muted-foreground">
            {t('inventory.lot.storeCount', { count: positions.length })}
          </span>
        </h2>
        <DataTable
          columns={positionColumns}
          rows={positions}
          rowKey={row => row.itemBatchId}
          emptyMessage={t('inventory.lot.noStores')}
        />
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          {t('inventory.lot.whoReceived')}
          <span className="font-normal text-muted-foreground">
            {t('inventory.lot.patientCount', { count: recipients.length })}
          </span>
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          {t('inventory.lot.recipientsNote')}
        </p>
        <DataTable
          columns={recipientColumns}
          rows={recipients}
          rowKey={row => row.pharmacySaleDetailId}
          emptyMessage={t('inventory.lot.noRecipients')}
        />
      </section>
    </>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
