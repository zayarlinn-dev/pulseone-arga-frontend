import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ChartCard, ChartTable } from '@/components/shared/ChartCard';
import { formatCompactMoney, formatCurrency } from '@/lib/utils';
import { formatBucket, formatBucketTick, type Grouping } from './periods';
import type { ProfitTrendPoint } from '@/types/models';

interface RevenueCostChartProps {
  points: ProfitTrendPoint[];
  grouping: Grouping;
  loading: boolean;
}

interface Row {
  bucket: string;
  revenue: number;
  cost: number;
  profit: number;
}

/**
 * What came in against what it directly cost, over the period.
 *
 * Both series are kyat, so they share one y-axis — and that is the only reason
 * they belong on one plot. Gross profit is the gap between the two lines, which
 * is what the chart is for; it gets its own chart below rather than a third
 * line here, because a line that is the difference of two others on the same
 * scale reads as a third independent measure.
 *
 * Deductions — discounts, refunds, returns — are folded into neither series;
 * they are carried in the row so the table view can show why revenue minus cost
 * does not equal the profit chart, and so the two charts still reconcile.
 */
export function RevenueCostChart({ points, grouping, loading }: RevenueCostChartProps) {
  const { t } = useTranslation('management');

  const data = useMemo<Row[]>(
    () =>
      points.map(point => ({
        bucket: point.bucket,
        // The revenue line is net of deductions, matching the "net revenue"
        // line of the statement above it. Plotting gross here would put a
        // bigger number on the chart than the statement reports for the same
        // period, which reads as one of the two being wrong.
        revenue: Number(point.revenue) - Number(point.deductions),
        cost: Number(point.cost),
        profit: Number(point.profit)
      })),
    [points]
  );

  const totals = data.reduce(
    (sum, row) => ({ revenue: sum.revenue + row.revenue, cost: sum.cost + row.cost }),
    { revenue: 0, cost: 0 }
  );

  // A line through one point draws nothing. One bucket is a magnitude
  // comparison, not a trend, so it becomes bars — the scale, colours and
  // wording stay exactly the same.
  const singleBucket = data.length === 1;

  const grid = <CartesianGrid stroke="var(--color-chart-grid)" strokeWidth={1} vertical={false} />;

  const xAxis = (
    <XAxis
      dataKey="bucket"
      tickFormatter={value => formatBucketTick(String(value), grouping)}
      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
      tickLine={false}
      axisLine={{ stroke: 'var(--color-chart-grid)' }}
      minTickGap={24}
    />
  );

  const yAxis = (
    <YAxis
      tickFormatter={formatCompactMoney}
      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
      tickLine={false}
      axisLine={false}
      width={52}
    />
  );

  const tooltip = (
    <Tooltip
      cursor={{ stroke: 'var(--color-chart-grid)', strokeWidth: 1 }}
      contentStyle={{
        backgroundColor: 'var(--color-popover)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.5rem',
        fontSize: '0.75rem'
      }}
      labelStyle={{ color: 'var(--color-foreground)' }}
      labelFormatter={value => formatBucket(String(value), grouping)}
      formatter={(value, name) => [formatCurrency(Number(value ?? 0)), String(name)]}
    />
  );

  const legend = (
    <div className="flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-0.5 w-4 rounded-full"
          style={{ backgroundColor: 'var(--color-series-1)' }}
        />
        {t('profitability.trend.revenue')}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-0.5 w-4 rounded-full"
          style={{ backgroundColor: 'var(--color-series-3)' }}
        />
        {t('profitability.trend.cost')}
      </span>
    </div>
  );

  return (
    <ChartCard
      title={t('profitability.trend.title')}
      description={t('profitability.trend.subtitle', {
        revenue: formatCurrency(totals.revenue),
        cost: formatCurrency(totals.cost)
      })}
      legend={legend}
      loading={loading}
      empty={data.length === 0}
      emptyMessage={t('profitability.trend.empty')}
      table={
        <ChartTable
          headers={[
            t('profitability.trend.headerPeriod'),
            t('profitability.trend.revenue'),
            t('profitability.trend.cost'),
            t('profitability.trend.headerProfit')
          ]}
          rows={data.map(row => [
            formatBucket(row.bucket, grouping),
            formatCurrency(row.revenue),
            formatCurrency(row.cost),
            formatCurrency(row.profit)
          ])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={260}>
        {singleBucket ? (
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            <Bar
              dataKey="revenue"
              name={t('profitability.trend.revenue')}
              fill="var(--color-series-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={64}
            />
            <Bar
              dataKey="cost"
              name={t('profitability.trend.cost')}
              fill="var(--color-series-3)"
              radius={[4, 4, 0, 0]}
              maxBarSize={64}
            />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            <Line
              type="monotone"
              dataKey="revenue"
              name={t('profitability.trend.revenue')}
              stroke="var(--color-series-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="cost"
              name={t('profitability.trend.cost')}
              stroke="var(--color-series-3)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </ChartCard>
  );
}
