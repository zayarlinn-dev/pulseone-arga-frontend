import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQueries } from '@tanstack/react-query';
import { AlertTriangle, Info, Percent, Printer, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { DateField } from '@/components/ui/date-field';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { PageHeader } from '@/components/layout/PageHeader';
import { managementService } from '@/services';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { ProfitStatement } from '../components/ProfitStatement';
import { ProfitChart } from '../components/ProfitChart';
import { RevenueCostChart } from '../components/RevenueCostChart';
import { RevenueSourceChart } from '../components/RevenueSourceChart';
import {
  formatPercent,
  isoDaysAgo,
  isoToday,
  percentChange,
  type Grouping
} from '../components/periods';
import type { ItemProfit, PaymentMethodTotal, ProfitSummary } from '@/types/models';
import type { management } from '@/i18n/locales/en/management';

/**
 * Catalogue paths, built from the English catalogue the same way the sidebar's
 * are: a table of `{ labelKey }` rows is otherwise just strings to the
 * compiler, and a renamed key would reach a user as a raw path instead of
 * failing the build.
 */
type FilterKey = `profitability.filter.${keyof typeof management.profitability.filter}`;
type RangeKey = `profitability.range.${keyof typeof management.profitability.range}`;
type TileKey = `profitability.tile.${keyof typeof management.profitability.tile}`;

/**
 * Quick ranges, with the grouping each one implies.
 *
 * A year of daily bars is 365 marks in a 260px-tall card — unreadable, and slow
 * to draw. Picking a long range switches the bucket with it, and the reader can
 * still override the grouping afterwards.
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
 * The owner's screen.
 *
 * Everything below the filter row reads one period and one set of definitions,
 * so the headline figures, the statement, the two trends and the two
 * breakdowns always reconcile. That is the reason the range lives here and not
 * on each card: two cards quietly showing different months is the failure mode
 * that makes a management report worthless.
 */
export default function ProfitabilityPage() {
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

  // Fetched together because they describe one period; keepPreviousData holds
  // the previous figures on screen while a new range loads, so changing the
  // filter does not blank the page into a grid of skeletons every time.
  const [summaryQuery, trendQuery, sourcesQuery, itemsQuery, paymentsQuery] = useQueries({
    queries: [
      {
        queryKey: ['management', 'profit', 'summary', range],
        placeholderData: keepPreviousData,
        queryFn: () => managementService.getProfitSummary(range)
      },
      {
        queryKey: ['management', 'profit', 'trend', range, grouping],
        placeholderData: keepPreviousData,
        queryFn: () => managementService.getProfitTrend({ ...range, groupBy: grouping })
      },
      {
        queryKey: ['management', 'profit', 'sources', range],
        placeholderData: keepPreviousData,
        queryFn: () => managementService.getRevenueSources(range)
      },
      {
        queryKey: ['management', 'profit', 'top-items', range],
        placeholderData: keepPreviousData,
        queryFn: () => managementService.getTopItems({ ...range, limit: 10 })
      },
      {
        queryKey: ['management', 'profit', 'payment-mix', range],
        placeholderData: keepPreviousData,
        queryFn: () => managementService.getPaymentMix(range)
      }
    ]
  });

  const current = summaryQuery.data?.current;
  const previous = summaryQuery.data?.previous;

  const loadError = summaryQuery.error ?? trendQuery.error;

  const tiles = current ? buildTiles(current, previous) : [];

  const itemColumns: Column<ItemProfit>[] = [
    {
      header: t('profitability.topItems.headerItem'),
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
      hideBelow: 'sm',
      header: t('profitability.topItems.headerQty'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => row.qty.toLocaleString()
    },
    {
      header: t('profitability.topItems.headerRevenue'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => formatCurrency(row.revenue)
    },
    {
      hideBelow: 'lg',
      header: t('profitability.topItems.headerCost'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => formatCurrency(row.cost)
    },
    {
      header: t('profitability.topItems.headerProfit'),
      sortable: false,
      className: 'text-right tabular-nums font-medium',
      render: row => formatCurrency(row.profit)
    },
    {
      hideBelow: 'md',
      header: t('profitability.topItems.headerMargin'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => formatPercent(row.marginPercent)
    }
  ];

  const payments = paymentsQuery.data ?? [];
  const collected = payments.reduce((sum, row) => sum + Number(row.amount), 0);

  const paymentColumns: Column<PaymentMethodTotal>[] = [
    {
      header: t('profitability.payments.headerMethod'),
      sortable: false,
      className: 'font-medium',
      render: row => t(`profitability.payments.${row.method}`)
    },
    {
      hideBelow: 'sm',
      header: t('profitability.payments.headerDocuments'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => row.documents.toLocaleString()
    },
    {
      header: t('profitability.payments.headerAmount'),
      sortable: false,
      className: 'text-right tabular-nums font-medium',
      render: row => formatCurrency(row.amount)
    },
    {
      header: t('profitability.payments.headerShare'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row =>
        collected > 0 ? formatPercent((Number(row.amount) / collected) * 100) : '-'
    }
  ];

  return (
    <>
      <PageHeader
        title={t('profitability.title')}
        description={t('profitability.description')}
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {shared('common.action.print')}
          </Button>
        }
      />

      {loadError && (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError instanceof Error
            ? loadError.message
            : t('profitability.loadFailed')}
        </div>
      )}

      {/* One filter row for everything below it. */}
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
                  <tile.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {/* Proportional figures, not tabular-nums: equal-width digits
                      make a standalone number look mechanically spaced. */}
                  <p
                    className={cn(
                      'text-2xl font-semibold',
                      tile.negative && 'text-destructive'
                    )}
                  >
                    {tile.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tile.change === null ? (
                      tile.hintKey ? (
                        t(tile.hintKey)
                      ) : (
                        t('profitability.tile.noPrevious')
                      )
                    ) : (
                      <span
                        className={cn(
                          'font-medium',
                          tile.change > 0 ? 'text-success' : 'text-destructive'
                        )}
                      >
                        {tile.change > 0 ? '+' : '−'}
                        {formatPercent(Math.abs(tile.change))}
                        <span className="ml-1 font-normal text-muted-foreground">
                          {previous &&
                            t('profitability.tile.vsPrevious', {
                              from: formatDate(previous.fromDate),
                              to: formatDate(previous.toDate)
                            })}
                        </span>
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* How much work produced those figures. Three plain numbers rather than
          three more cards — they give the headline its scale, they are not
          headlines themselves. */}
      {current && (
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 rounded-lg border px-4 py-3 text-sm">
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">
              {t('profitability.activity.invoices')}
            </dt>
            <dd className="font-medium tabular-nums">{current.invoices.toLocaleString()}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">
              {t('profitability.activity.patients')}
            </dt>
            <dd className="font-medium tabular-nums">{current.patients.toLocaleString()}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted-foreground">
              {t('profitability.activity.averageInvoice')}
            </dt>
            <dd className="font-medium tabular-nums">
              {formatCurrency(current.averageInvoice)}
            </dd>
          </div>
        </dl>
      )}

      {/*
        The caveat sits directly under the headline figures rather than at the
        bottom of the page. A number labelled "gross profit" that a reader takes
        for take-home pay is the one way this screen can do harm, and a footnote
        below three charts is a footnote nobody reads.
      */}
      <div className="mt-4 flex gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="text-sm">
          <p className="font-medium">{t('profitability.grossOnly.title')}</p>
          <p className="mt-0.5 text-muted-foreground">
            {t('profitability.grossOnly.body')}
          </p>
        </div>
      </div>

      {current && current.uncostedLines > 0 && (
        <div className="mt-3 flex gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <div className="text-sm">
            <p className="font-medium text-warning">
              {t('profitability.uncosted.title', { count: current.uncostedLines })}
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {t('profitability.uncosted.body')}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RevenueCostChart
          points={trendQuery.data ?? []}
          grouping={grouping}
          loading={trendQuery.isLoading}
        />
        <ProfitChart
          points={trendQuery.data ?? []}
          grouping={grouping}
          loading={trendQuery.isLoading}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ProfitStatement
          current={current}
          previous={previous}
          loading={summaryQuery.isLoading}
        />
        <RevenueSourceChart
          sources={sourcesQuery.data ?? []}
          loading={sourcesQuery.isLoading}
        />
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold">
        {t('profitability.topItems.title')}
      </h2>
      <p className="mb-2 text-xs text-muted-foreground">
        {t('profitability.topItems.subtitle')}
      </p>
      <DataTable
        columns={itemColumns}
        rows={itemsQuery.data ?? []}
        loading={itemsQuery.isLoading}
        rowKey={row => row.itemId}
        emptyMessage={t('profitability.topItems.empty')}
      />

      <h2 className="mb-2 mt-6 text-sm font-semibold">
        {t('profitability.payments.title')}
      </h2>
      <p className="mb-2 text-xs text-muted-foreground">
        {t('profitability.payments.subtitle')}
      </p>
      <DataTable
        columns={paymentColumns}
        rows={payments}
        loading={paymentsQuery.isLoading}
        rowKey={row => row.method}
        emptyMessage={t('profitability.payments.empty')}
      />
    </>
  );
}

interface Tile {
  labelKey: TileKey;
  value: string;
  icon: typeof TrendingUp;
  /** Null when there is nothing comparable to measure against. */
  change: number | null;
  /** Shown in place of the comparison when the figure is not a movement. */
  hintKey?: TileKey;
  negative?: boolean;
}

/**
 * The four figures at the top: what the period earned, what it kept, at what
 * margin, and what is still outstanding.
 *
 * Margin is shown without a movement — a percentage compared against a
 * percentage is a change in points, and rendering it beside three percentage
 * *changes* would invite the reader to compare two different quantities.
 * Receivables likewise: it is a level, not a rate.
 */
function buildTiles(current: ProfitSummary, previous?: ProfitSummary): Tile[] {
  const change = (field: keyof ProfitSummary) =>
    previous ? percentChange(String(current[field]), String(previous[field])) : null;

  return [
    {
      labelKey: 'profitability.tile.netRevenue',
      value: formatCurrency(current.netRevenue),
      icon: Receipt,
      change: change('netRevenue')
    },
    {
      labelKey: 'profitability.tile.grossProfit',
      value: formatCurrency(current.grossProfit),
      icon: TrendingUp,
      change: change('grossProfit'),
      negative: Number(current.grossProfit) < 0
    },
    {
      labelKey: 'profitability.tile.margin',
      value: formatPercent(current.marginPercent),
      icon: Percent,
      change: null,
      hintKey: 'profitability.tile.marginHint',
      negative: Number(current.marginPercent) < 0
    },
    {
      labelKey: 'profitability.tile.receivables',
      value: formatCurrency(current.receivables),
      icon: Wallet,
      change: null,
      hintKey: 'profitability.tile.receivablesHint'
    }
  ];
}
