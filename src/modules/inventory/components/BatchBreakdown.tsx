import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { inventoryService } from '@/services';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { formatQty } from '@/lib/uom';
import type { ExpiryStatus, StockBatch } from '@/types/models';

interface BatchBreakdownProps {
  itemStoreMapId: number;
  /** Named on the row above, so the panel does not repeat it. */
  baseUom?: string | null;
}

/**
 * The batches behind one stock balance row.
 *
 * The balance says a store holds 240 tablets; this says which lots those 240
 * are, when each expires, what each cost, and — the part that cannot be worked
 * out from anywhere else — which one the next sale will actually draw from.
 *
 * The rows arrive already in issue order, so the list is not re-sorted here:
 * the server applied the store's policy, and reordering client-side would show
 * a queue the system does not use.
 */
export function BatchBreakdown({ itemStoreMapId, baseUom }: BatchBreakdownProps) {
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-batches', itemStoreMapId],
    queryFn: () => inventoryService.getBatchBreakdown(itemStoreMapId)
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t('inventory.batches.loading')}
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="px-4 py-6 text-sm text-destructive">
        {(error as Error)?.message ?? t('inventory.batches.failed')}
      </p>
    );
  }

  if (data.batches.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">{t('inventory.batches.empty')}</p>
    );
  }

  // The two figures are supposed to be the same number. When they are not,
  // something wrote a stock column without going through the stock service, and
  // the person looking at the stock should hear about it here rather than
  // finding out when a sale is refused.
  const drifted = data.recordedQty !== data.batchQtySum;

  return (
    <div className="px-4 py-3">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>
          {t('inventory.batches.policyLabel')}{' '}
          <Badge variant="secondary">{t(`inventory.policy.${data.issuePolicy}.short`)}</Badge>
        </span>
        <span>{t('inventory.batches.policyHint')}</span>
      </div>

      {drifted && (
        <p className="mb-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {t('inventory.batches.drift', {
            recorded: data.recordedQty,
            batches: data.batchQtySum
          })}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 pr-3 text-left font-medium">
                {t('inventory.batches.column.order')}
              </th>
              <th className="py-2 pr-3 text-left font-medium">
                {t('inventory.batches.column.batchNo')}
              </th>
              <th className="py-2 pr-3 text-left font-medium">
                {t('inventory.batches.column.received')}
              </th>
              <th className="py-2 pr-3 text-left font-medium">
                {t('inventory.batches.column.expiry')}
              </th>
              <th className="py-2 pr-3 text-right font-medium">
                {t('inventory.batches.column.onHand')}
              </th>
              <th className="py-2 pr-3 text-right font-medium">
                {t('inventory.batches.column.costPrice')}
              </th>
              <th className="py-2 text-right font-medium">
                {t('inventory.batches.column.stockCost')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.batches.map(batch => (
              <BatchRow key={batch.id} batch={batch} baseUom={baseUom} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-medium">
              <td className="py-2" colSpan={4}>
                {t('inventory.batches.total', { count: data.batches.length })}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {formatQty(data.batchQtySum, baseUom)}
              </td>
              <td />
              <td className="py-2 text-right tabular-nums">{formatCurrency(data.stockCost)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/** Badge colour per expiry band. `ok` and `none` get no badge at all. */
const statusVariant: Record<ExpiryStatus, 'destructive' | 'warning' | null> = {
  expired: 'destructive',
  critical: 'destructive',
  warning: 'warning',
  ok: null,
  none: null
};

function BatchRow({ batch, baseUom }: { batch: StockBatch; baseUom?: string | null }) {
  const { t } = useTranslation();
  const variant = statusVariant[batch.expiryStatus];

  return (
    <tr className={cn('border-b last:border-0', batch.expiryStatus === 'expired' && 'opacity-60')}>
      <td className="py-2 pr-3 tabular-nums">
        {/*
          The queue position is the whole reason this panel is ordered the way
          it is. "1" is called out rather than left as a number, because "which
          batch goes out next" is the question the policy setting answers and
          this is the only place the answer is visible.
        */}
        {batch.issueOrder === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : batch.issueOrder === 1 ? (
          <Badge variant="default">{t('inventory.batches.nextOut')}</Badge>
        ) : (
          <span className="text-muted-foreground">{batch.issueOrder}</span>
        )}
      </td>

      <td className="py-2 pr-3 font-mono">
        {/*
          A batch number is what a recall notice names, so it links straight to
          the lot trace rather than making someone search for it.
        */}
        <Link to={`/inventories/lots/${batch.id}`} className="hover:underline">
          {batch.batchNo}
        </Link>
      </td>

      <td className="py-2 pr-3">{batch.batchDate ? formatDate(batch.batchDate) : '-'}</td>

      <td className="py-2 pr-3">
        {batch.expiryDate ? (
          <span className="flex items-center gap-2">
            {formatDate(batch.expiryDate)}
            {variant && (
              <Badge variant={variant}>
                {batch.expiryStatus === 'expired'
                  ? t('inventory.batches.expired')
                  : t('inventory.batches.inDays', { days: batch.daysToExpiry ?? 0 })}
              </Badge>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">{t('inventory.batches.noExpiry')}</span>
        )}
      </td>

      <td className="py-2 pr-3 text-right tabular-nums">{formatQty(batch.batchQty, baseUom)}</td>

      <td className="py-2 pr-3 text-right tabular-nums">
        {/*
          Zero cost is "never valued", not "free". Legacy batches and openings
          keyed without prices both land here, and reporting them as zero is
          what makes a whole store read as costing nothing.
        */}
        {Number(batch.costPrice) === 0 ? (
          <span className="text-muted-foreground">{t('inventory.batches.unvalued')}</span>
        ) : (
          formatCurrency(batch.costPrice)
        )}
      </td>

      <td className="py-2 text-right tabular-nums">{formatCurrency(batch.stockCost)}</td>
    </tr>
  );
}
