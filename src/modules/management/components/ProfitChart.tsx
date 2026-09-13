import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ChartCard, ChartTable } from '@/components/shared/ChartCard';
import { formatCompactMoney, formatCurrency } from '@/lib/utils';
import { formatBucket, formatBucketTick, formatPercent, type Grouping } from './periods';
import type { ProfitTrendPoint } from '@/types/models';

interface ProfitChartProps {
  points: ProfitTrendPoint[];
  grouping: Grouping;
  loading: boolean;
}

interface Row {
  bucket: string;
  profit: number;
  margin: number;
}

/**
 * Gross profit per period.
 *
 * Bars rather than a line, and that is the whole point: a period can end up
 * negative, and a bar crossing the zero rule shows a loss as something that
 * dropped below the line. A line through the same points draws a loss as
 * nothing more than a dip, which is the one reading this chart must not allow.
 *
 * One series, so it carries no legend — the title names it. Losing bars are
 * drawn in the destructive token rather than a second series colour, because
 * the difference between them is a state, not an identity.
 */
export function ProfitChart({ points, grouping, loading }: ProfitChartProps) {
  const { t } = useTranslation('management');

  const data = useMemo<Row[]>(
    () =>
      points.map(point => {
        const netRevenue = Number(point.revenue) - Number(point.deductions);
        const profit = Number(point.profit);
        return {
          bucket: point.bucket,
          profit,
          margin: netRevenue > 0 ? (profit / netRevenue) * 100 : 0
        };
      }),
    [points]
  );

  const total = data.reduce((sum, row) => sum + row.profit, 0);
  const hasLoss = data.some(row => row.profit < 0);

  return (
    <ChartCard
      title={t('profitability.profitTrend.title')}
      description={t('profitability.profitTrend.subtitle', {
        total: formatCurrency(total)
      })}
      loading={loading}
      empty={data.length === 0}
      emptyMessage={t('profitability.profitTrend.empty')}
      table={
        <ChartTable
          headers={[
            t('profitability.profitTrend.headerPeriod'),
            t('profitability.profitTrend.headerProfit'),
            t('profitability.profitTrend.headerMargin')
          ]}
          rows={data.map(row => [
            formatBucket(row.bucket, grouping),
            formatCurrency(row.profit),
            formatPercent(row.margin)
          ])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--color-chart-grid)" strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="bucket"
            tickFormatter={value => formatBucketTick(String(value), grouping)}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-chart-grid)' }}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={formatCompactMoney}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={52}
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
            labelFormatter={value => formatBucket(String(value), grouping)}
            formatter={value => [
              formatCurrency(Number(value ?? 0)),
              t('profitability.profitTrend.headerProfit')
            ]}
          />
          {/* Only drawn when something actually went negative: a zero rule on an
              all-positive chart is a second baseline competing with the axis. */}
          {hasLoss && (
            <ReferenceLine y={0} stroke="var(--color-muted-foreground)" strokeWidth={1} />
          )}
          <Bar
            dataKey="profit"
            name={t('profitability.profitTrend.headerProfit')}
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          >
            {data.map(row => (
              <Cell
                key={row.bucket}
                fill={
                  row.profit < 0 ? 'var(--color-destructive)' : 'var(--color-series-4)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
