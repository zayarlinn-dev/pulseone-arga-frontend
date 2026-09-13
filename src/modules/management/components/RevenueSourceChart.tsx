import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ChartCard, ChartTable } from '@/components/shared/ChartCard';
import { formatCompactMoney, formatCurrency } from '@/lib/utils';
import { formatPercent } from './periods';
import type { RevenueSource } from '@/types/models';

interface RevenueSourceChartProps {
  sources: RevenueSource[];
  loading: boolean;
}

interface Row {
  label: string;
  revenue: number;
  cost: number;
  profit: number;
  share: number;
}

/** How many bars fit before the labels start colliding. The rest fold into one. */
const MAX_BARS = 8;

/**
 * Where the money came from, largest first.
 *
 * Horizontal bars because the categories are names — a service centre called
 * "Radiology & Imaging" needs a full line to itself, and rotating a vertical
 * axis' labels to fit is how a chart becomes unreadable. One series, so one
 * colour for every bar: shading them by size would encode the bar's length a
 * second time and burn the only free channel to say nothing new.
 *
 * Past eight sources the tail becomes a single "Other" bar rather than a
 * ninth colour or a squeezed row — the exact figures for every source are in
 * the table view either way.
 */
export function RevenueSourceChart({ sources, loading }: RevenueSourceChartProps) {
  const { t } = useTranslation('management');

  const label = (source: RevenueSource) => {
    if (source.kind === 'pharmacy') return t('profitability.sources.pharmacy');
    if (source.kind === 'unassigned' || !source.source) {
      return t('profitability.sources.unassigned');
    }
    return source.source;
  };

  // Computed on every render rather than memoised: it is a map and a reduce
  // over at most a couple of dozen rows, and a memo here would have to carry
  // `t` in its dependencies to keep the labels following a language switch —
  // more to get wrong than the work it saves.
  const total = sources.reduce((sum, source) => sum + Number(source.revenue), 0);
  const share = (value: number) => (total > 0 ? (value / total) * 100 : 0);

  const mapped: Row[] = sources.map(source => ({
    label: label(source),
    revenue: Number(source.revenue),
    cost: Number(source.cost),
    profit: Number(source.profit),
    share: share(Number(source.revenue))
  }));

  const rows: Row[] =
    mapped.length <= MAX_BARS
      ? mapped
      : [
          ...mapped.slice(0, MAX_BARS - 1),
          mapped.slice(MAX_BARS - 1).reduce(
            (sum, row) => ({
              label: sum.label,
              revenue: sum.revenue + row.revenue,
              cost: sum.cost + row.cost,
              profit: sum.profit + row.profit,
              share: sum.share + row.share
            }),
            {
              label: t('profitability.sources.other'),
              revenue: 0,
              cost: 0,
              profit: 0,
              share: 0
            }
          )
        ];

  // Every source, not just the eight on the chart: the table is the exact
  // record, and folding rows away there would make the figures unobtainable.
  const tableRows = sources.map(source => [
    label(source),
    formatCurrency(source.revenue),
    formatCurrency(source.cost),
    formatCurrency(source.profit),
    formatPercent(share(Number(source.revenue)))
  ]);

  return (
    <ChartCard
      title={t('profitability.sources.title')}
      description={t('profitability.sources.subtitle')}
      loading={loading}
      empty={rows.length === 0}
      emptyMessage={t('profitability.sources.empty')}
      table={
        <ChartTable
          headers={[
            t('profitability.sources.headerSource'),
            t('profitability.sources.headerRevenue'),
            t('profitability.sources.headerCost'),
            t('profitability.sources.headerProfit'),
            t('profitability.sources.headerShare')
          ]}
          rows={tableRows}
        />
      }
    >
      {/* Grows with the number of bars instead of squeezing them into a fixed
          box, plus a band for the value axis underneath. */}
      <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 34 + 40)}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="var(--color-chart-grid)" strokeWidth={1} horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatCompactMoney}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={132}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-muted)', fillOpacity: 0.4 }}
            contentStyle={{
              backgroundColor: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              fontSize: '0.75rem'
            }}
            labelStyle={{ color: 'var(--color-foreground)' }}
            formatter={(value, _name, entry) => [
              // The share is read off the row rather than recomputed here: the
              // tooltip must agree with the table, and the table's percentages
              // are the ones computed against every source, not just the eight
              // bars on screen.
              `${formatCurrency(Number(value ?? 0))} · ${formatPercent(
                (entry?.payload as Row | undefined)?.share ?? 0
              )}`,
              t('profitability.sources.headerRevenue')
            ]}
          />
          <Bar
            dataKey="revenue"
            name={t('profitability.sources.headerRevenue')}
            fill="var(--color-series-1)"
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
