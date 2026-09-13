import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQueries } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarX,
  Coins,
  Info,
  PackageX,
  Printer,
  Snowflake,
  Warehouse
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { DateField } from '@/components/ui/date-field';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { PageHeader } from '@/components/layout/PageHeader';
import { workingCapitalService } from '@/services';
import { cn, formatCurrency } from '@/lib/utils';
import { ExpiryExposureChart } from '../components/ExpiryExposureChart';
import { StockMovementChart } from '../components/StockMovementChart';
import { formatPercent, isoDaysAgo, isoToday, type Grouping } from '../components/periods';
import type { DeadStockRow, StoreCapital, VendorSpend } from '@/types/models';
import type { management } from '@/i18n/locales/en/management';

type TileKey = `inventory.tile.${keyof typeof management.inventory.tile}`;
type FilterKey = `profitability.filter.${keyof typeof management.profitability.filter}`;
type RangeKey = `profitability.range.${keyof typeof management.profitability.range}`;

/**
 * The same ranges and groupings the profitability screen offers.
 *
 * They scope only the movement half of this page — stock at cost is what is on
 * the shelf now and has no period — but the two screens are read one after the
 * other, and a filter row that looks the same and behaves differently is worse
 * than one that only applies to part of the page and says so.
 */
const RANGES = [
  { days: 7, labelKey: 'profitability.range.days7', grouping: 'day' },
  { days: 30, labelKey: 'profitability.range.days30', grouping: 'day' },
  { days: 90, labelKey: 'profitability.range.days90', grouping: 'week' },
  { days: 365, labelKey: 'profitability.range.months12', grouping: 'month' }
] as const satisfies readonly { days: number; labelKey: RangeKey; grouping: Grouping }[];

const GROUPINGS = [
  { value: 'day', labelKey: 'profitability.filter.day' },
  { value: 'week', labelKey: 'profitability.filter.week' },
  { value: 'month', labelKey: 'profitability.filter.month' }
] as const satisfies readonly { value: Grouping; labelKey: FilterKey }[];

/**
 * Where the hospital's money is when it is not in the bank.
 *
 * The page is laid out around one distinction: what is on the shelf right now,
 * and what moved through it over a period. Those are different kinds of figure
 * — a level and a flow — and mixing them is how a stock report starts saying
 * things that are not true. The two sit under their own headings, and the date
 * filter is labelled as applying only to the second.
 */
export default function WorkingCapitalPage() {
  const { t } = useTranslation('management');
  const { t: shared } = useTranslation();

  const [fromDate, setFromDate] = useState(() => isoDaysAgo(30));
  const [toDate, setToDate] = useState(() => isoToday());
  const [grouping, setGrouping] = useState<Grouping>('day');

  const range = useMemo(() => ({ fromDate, toDate }), [fromDate, toDate]);

  const applyRange = (days: number, nextGrouping: Grouping) => {
    setFromDate(isoDaysAgo(days));
    setToDate(isoToday());
    setGrouping(nextGrouping);
  };

  const activeRange = RANGES.find(
    option => fromDate === isoDaysAgo(option.days) && toDate === isoToday()
  );

  const [summaryQuery, storesQuery, expiryQuery, deadQuery, movementQuery, vendorQuery] =
    useQueries({
      queries: [
        {
          queryKey: ['capital', 'summary', range],
          placeholderData: keepPreviousData,
          queryFn: () => workingCapitalService.getCapitalSummary(range)
        },
        // No range in the key: these are levels, and refetching them when the
        // date filter moves would suggest they had changed with it.
        {
          queryKey: ['capital', 'by-store'],
          queryFn: () => workingCapitalService.getCapitalByStore()
        },
        {
          queryKey: ['capital', 'expiry-exposure'],
          queryFn: () => workingCapitalService.getExpiryExposure()
        },
        {
          queryKey: ['capital', 'dead-stock'],
          queryFn: () => workingCapitalService.getDeadStock({ limit: 20 })
        },
        {
          queryKey: ['capital', 'movement', range, grouping],
          placeholderData: keepPreviousData,
          queryFn: () => workingCapitalService.getMovementTrend({ ...range, groupBy: grouping })
        },
        {
          queryKey: ['capital', 'vendor-spend', range],
          placeholderData: keepPreviousData,
          queryFn: () => workingCapitalService.getVendorSpend({ ...range, limit: 10 })
        }
      ]
    });

  const summary = summaryQuery.data;
  const loadError = summaryQuery.error ?? movementQuery.error;

  // The hint is resolved here rather than carried as a key plus a bag of
  // values: two of these interpolate a window and two do not, and the typed
  // `t()` cannot check one options object against a union of keys that disagree
  // about what they take. Resolving each where its key is known keeps the
  // checking.
  const tiles: {
    labelKey: TileKey;
    hint: string;
    value: string;
    icon: typeof Coins;
    tone?: 'warning' | 'destructive';
  }[] = summary
    ? [
        {
          labelKey: 'inventory.tile.stockAtCost',
          hint: t('inventory.tile.stockAtCostHint'),
          value: formatCurrency(summary.stockAtCost),
          icon: Coins
        },
        {
          labelKey: 'inventory.tile.deadStock',
          hint: t('inventory.tile.deadStockHint', { days: summary.deadStockDays }),
          value: formatCurrency(summary.deadStockValue),
          icon: Snowflake,
          tone: Number(summary.deadStockValue) > 0 ? 'warning' : undefined
        },
        {
          labelKey: 'inventory.tile.expiring',
          hint: t('inventory.tile.expiringHint', { days: summary.expiringDays }),
          value: formatCurrency(summary.expiringValue),
          icon: CalendarX,
          tone: Number(summary.expiringValue) > 0 ? 'warning' : undefined
        },
        {
          labelKey: 'inventory.tile.expired',
          hint: t('inventory.tile.expiredHint'),
          value: formatCurrency(summary.expiredValue),
          icon: PackageX,
          // Already lost, unlike everything else on this row — the one figure
          // here that is a write-off rather than a risk.
          tone: Number(summary.expiredValue) > 0 ? 'destructive' : undefined
        }
      ]
    : [];

  const stores = storesQuery.data ?? [];
  const storesTotal = stores.reduce((sum, row) => sum + Number(row.atCost), 0);

  const storeColumns: Column<StoreCapital>[] = [
    {
      header: t('inventory.stores.headerStore'),
      sortable: false,
      className: 'font-medium',
      render: row => row.storeName
    },
    {
      hideBelow: 'sm',
      header: t('inventory.stores.headerItems'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => row.items.toLocaleString()
    },
    {
      header: t('inventory.stores.headerAtCost'),
      sortable: false,
      className: 'text-right tabular-nums font-medium',
      render: row => formatCurrency(row.atCost)
    },
    {
      hideBelow: 'md',
      header: t('inventory.stores.headerAtRetail'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => formatCurrency(row.atRetail)
    },
    {
      header: t('inventory.stores.headerShare'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row =>
        storesTotal > 0 ? formatPercent((Number(row.atCost) / storesTotal) * 100) : '-'
    }
  ];

  const deadColumns: Column<DeadStockRow>[] = [
    {
      header: t('inventory.deadStock.headerItem'),
      sortable: false,
      className: 'font-medium',
      render: row => (
        <span className="flex flex-col">
          <span>{row.itemName}</span>
          <span className="font-mono text-xs text-muted-foreground">{row.itemCode}</span>
        </span>
      )
    },
    {
      hideBelow: 'md',
      header: t('inventory.deadStock.headerStore'),
      sortable: false,
      render: row => row.storeName
    },
    {
      hideBelow: 'sm',
      header: t('inventory.deadStock.headerQty'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => row.qty.toLocaleString()
    },
    {
      header: t('inventory.deadStock.headerValue'),
      sortable: false,
      className: 'text-right tabular-nums font-medium',
      render: row => formatCurrency(row.value)
    },
    {
      header: t('inventory.deadStock.headerIdle'),
      sortable: false,
      className: 'text-right',
      // Never issued is the worst case, not a missing value, so it says so
      // rather than rendering as a dash next to items that merely sold slowly.
      render: row =>
        row.daysIdle === null ? (
          <span className="text-destructive">{t('inventory.deadStock.neverIssued')}</span>
        ) : (
          t('inventory.deadStock.idleDays', { count: row.daysIdle })
        )
    }
  ];

  const vendors = vendorQuery.data ?? [];
  const vendorTotal = vendors.reduce((sum, row) => sum + Number(row.amount), 0);

  const vendorColumns: Column<VendorSpend>[] = [
    {
      header: t('inventory.vendors.headerVendor'),
      sortable: false,
      className: 'font-medium',
      render: row => row.vendorName
    },
    {
      hideBelow: 'lg',
      header: t('inventory.vendors.headerNotes'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => row.notes.toLocaleString()
    },
    {
      header: t('inventory.vendors.headerAmount'),
      sortable: false,
      className: 'text-right tabular-nums font-medium',
      render: row => formatCurrency(row.amount)
    },
    {
      header: t('inventory.vendors.headerShare'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row =>
        vendorTotal > 0 ? formatPercent((Number(row.amount) / vendorTotal) * 100) : '-'
    }
  ];

  return (
    <>
      <PageHeader
        title={t('inventory.title')}
        description={t('inventory.description')}
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {shared('common.action.print')}
          </Button>
        }
      />

      {loadError && (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError instanceof Error ? loadError.message : t('inventory.loadFailed')}
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold">{t('inventory.asOfNow')}</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryQuery.isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-3 h-7 w-20 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))
          : tiles.map(tile => (
              <Card key={tile.labelKey}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t(tile.labelKey)}
                  </CardTitle>
                  <tile.icon
                    className={cn(
                      'h-4 w-4',
                      tile.tone === 'warning' && 'text-warning',
                      tile.tone === 'destructive' && 'text-destructive',
                      !tile.tone && 'text-muted-foreground'
                    )}
                  />
                </CardHeader>
                <CardContent>
                  <p
                    className={cn(
                      'text-2xl font-semibold',
                      tile.tone === 'warning' && 'text-warning',
                      tile.tone === 'destructive' && 'text-destructive'
                    )}
                  >
                    {tile.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{tile.hint}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {summary && (
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 rounded-lg border px-4 py-3 text-sm">
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">{t('inventory.counts.items')}</dt>
            <dd className="font-medium tabular-nums">{summary.itemsInStock.toLocaleString()}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">{t('inventory.counts.batches')}</dt>
            <dd className="font-medium tabular-nums">{summary.batchesInStock.toLocaleString()}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">{t('inventory.tile.potentialMargin')}</dt>
            <dd className="font-medium tabular-nums">
              {formatCurrency(summary.potentialMargin)}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">{t('inventory.tile.belowReorder')}</dt>
            <dd
              className={cn(
                'font-medium tabular-nums',
                summary.belowReorder > 0 && 'text-warning'
              )}
            >
              {summary.belowReorder.toLocaleString()}
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-4 flex gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="text-sm">
          <p className="font-medium">{t('inventory.costBasis.title')}</p>
          <p className="mt-0.5 text-muted-foreground">{t('inventory.costBasis.body')}</p>
        </div>
      </div>

      {summary && summary.unvaluedBatches > 0 && (
        <div className="mt-3 flex gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <div className="text-sm">
            <p className="font-medium text-warning">
              {t('inventory.unvalued.title', { count: summary.unvaluedBatches })}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {t('inventory.unvalued.body', { qty: summary.unvaluedQty.toLocaleString() })}
              {summary.uncostedMovements > 0 && (
                <>
                  {' '}
                  {t('inventory.unvalued.movements', { count: summary.uncostedMovements })}
                </>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ExpiryExposureChart
          buckets={expiryQuery.data ?? []}
          loading={expiryQuery.isLoading}
        />

        <Card className="p-4">
          <h2 className="text-sm font-semibold">{t('inventory.stores.title')}</h2>
          <p className="text-xs text-muted-foreground">{t('inventory.stores.subtitle')}</p>
          <div className="mt-3">
            <DataTable
              columns={storeColumns}
              rows={stores}
              loading={storesQuery.isLoading}
              rowKey={row => row.storeId}
              emptyMessage={t('inventory.stores.empty')}
            />
          </div>
        </Card>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold">
        {t('inventory.deadStock.title')}
      </h2>
      <p className="mb-2 text-xs text-muted-foreground">
        {t('inventory.deadStock.subtitle', { days: summary?.deadStockDays ?? 90 })}
      </p>
      <DataTable
        columns={deadColumns}
        rows={deadQuery.data ?? []}
        loading={deadQuery.isLoading}
        rowKey={row => `${row.itemId}-${row.storeId}`}
        emptyMessage={t('inventory.deadStock.empty')}
      />

      {/* Everything below moves with the date filter, so the filter sits here
          rather than at the top — above the levels it would look like it
          scoped them too. */}
      <h2 className="mb-3 mt-8 text-sm font-semibold">{t('inventory.overPeriod')}</h2>

      <Card className="mb-4 p-4" data-print-hide>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={shared('common.label.from')} htmlFor="fromDate">
            <DateField
              id="fromDate"
              value={fromDate}
              max={toDate}
              onChange={event => setFromDate(event.target.value)}
            />
          </Field>
          <Field label={shared('common.label.to')} htmlFor="toDate">
            <DateField
              id="toDate"
              value={toDate}
              min={fromDate}
              onChange={event => setToDate(event.target.value)}
            />
          </Field>
          <Field label={t('profitability.filter.grouping')} htmlFor="groupBy">
            <NativeSelect
              id="groupBy"
              value={grouping}
              onChange={event => setGrouping(event.target.value as Grouping)}
            >
              {GROUPINGS.map(option => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>

        <div
          className="mt-3 flex flex-wrap items-center gap-1"
          role="group"
          aria-label={t('profitability.range.label')}
        >
          {RANGES.map(option => (
            <Button
              key={option.days}
              variant={activeRange?.days === option.days ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={activeRange?.days === option.days}
              onClick={() => applyRange(option.days, option.grouping)}
            >
              {t(option.labelKey)}
            </Button>
          ))}
        </div>
      </Card>

      {summary && (
        <dl className="mb-4 flex flex-wrap gap-x-8 gap-y-2 rounded-lg border px-4 py-3 text-sm">
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">{t('inventory.counts.received')}</dt>
            <dd className="font-medium tabular-nums">{formatCurrency(summary.receivedCost)}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">{t('inventory.counts.issued')}</dt>
            <dd className="font-medium tabular-nums">{formatCurrency(summary.issuedCost)}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">{t('inventory.counts.damaged')}</dt>
            <dd
              className={cn(
                'font-medium tabular-nums',
                Number(summary.damagedCost) > 0 && 'text-warning'
              )}
            >
              {formatCurrency(summary.damagedCost)}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">{t('inventory.counts.consumed')}</dt>
            <dd className="font-medium tabular-nums">{formatCurrency(summary.consumedCost)}</dd>
          </div>
        </dl>
      )}

      <StockMovementChart
        points={movementQuery.data ?? []}
        grouping={grouping}
        loading={movementQuery.isLoading}
      />

      <h2 className="mb-2 mt-6 flex items-center gap-2 text-sm font-semibold">
        <Warehouse className="h-4 w-4 text-muted-foreground" aria-hidden />
        {t('inventory.vendors.title')}
      </h2>
      <p className="mb-2 text-xs text-muted-foreground">{t('inventory.vendors.subtitle')}</p>
      <DataTable
        columns={vendorColumns}
        rows={vendors}
        loading={vendorQuery.isLoading}
        rowKey={row => row.vendorId}
        emptyMessage={t('inventory.vendors.empty')}
      />
    </>
  );
}
