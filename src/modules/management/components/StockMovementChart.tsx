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
import type { MovementPoint } from '@/types/models';

interface StockMovementChartProps {
  points: MovementPoint[];
  grouping: Grouping;
  loading: boolean;
}

interface Row {
  bucket: string;
  in: number;
  out: number;
}

/**
 * Stock value arriving against stock value leaving.
 *
 * Both series are the same money — cost — so they share one axis, and the gap
 * between them is the shelf growing or shrinking. That reading is the point of
 * the chart: a store whose "in" line sits above its "out" line for a month is
 * buying faster than it is selling, and the capital figure above will have
 * climbed to match.
 *
 * Slot 1 is what came in and slot 3 is what it cost to be there, the same
 * assignment the profit trend uses, so a reader moving between the two screens
 * does not have to relearn which colour is which.
 */
export function StockMovementChart({ points, grouping, loading }: StockMovementChartProps) {
  const { t } = useTranslation('management');

  const data: Row[] = points.map(point => ({
    bucket: point.bucket,
    in: Number(point.in),
    out: Number(point.out)
  }));

  const totals = data.reduce(
    (sum, row) => ({ in: sum.in + row.in, out: sum.out + row.out }),
    { in: 0, out: 0 }
  );

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
        {t('inventory.movement.in')}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-0.5 w-4 rounded-full"
          style={{ backgroundColor: 'var(--color-series-3)' }}
        />
        {t('inventory.movement.out')}
      </span>
    </div>
  );

  return (
    <ChartCard
      title={t('inventory.movement.title')}
      description={t('inventory.movement.subtitle', {
        in: formatCurrency(totals.in),
        out: formatCurrency(totals.out)
      })}
      legend={legend}
      loading={loading}
      empty={data.length === 0}
      emptyMessage={t('inventory.movement.empty')}
      table={
        <ChartTable
          headers={[
            t('inventory.movement.headerPeriod'),
            t('inventory.movement.in'),
            t('inventory.movement.out')
          ]}
          rows={data.map(row => [
            formatBucket(row.bucket, grouping),
            formatCurrency(row.in),
            formatCurrency(row.out)
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
              dataKey="in"
              name={t('inventory.movement.in')}
              fill="var(--color-series-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={64}
            />
            <Bar
              dataKey="out"
              name={t('inventory.movement.out')}
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
              dataKey="in"
              name={t('inventory.movement.in')}
              stroke="var(--color-series-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="out"
              name={t('inventory.movement.out')}
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
