import { useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { formatCompactMoney, formatCurrency, formatDate } from '@/lib/utils';
import type { PharmacySalePoint, RevenuePoint } from '@/types/models';

interface TakingsChartProps {
  revenue: RevenuePoint[];
  pharmacy: PharmacySalePoint[];
  loading: boolean;
}

interface Point {
  date: string;
  invoices: number;
  pharmacy: number;
}

/**
 * Invoiced revenue and pharmacy takings over time.
 *
 * Both series are money in the same currency, so they share one y-axis. That is
 * the whole reason they can live on one chart: a second y-scale would let the
 * two lines cross wherever the scales happened to put them, which reads as a
 * relationship that is not in the data.
 */
export function TakingsChart({ revenue, pharmacy, loading }: TakingsChartProps) {
  const { t } = useTranslation();

  const data = useMemo<Point[]>(() => {
    // The two endpoints only return days that had activity, and not the same
    // days, so they are merged on the date rather than zipped by index.
    //
    // The key is the date part alone: the API returns a full timestamp, and
    // keying on the whole string would split one day into two points if the
    // two endpoints ever disagreed about the time or the zone offset.
    const byDate = new Map<string, Point>();

    const at = (timestamp: string) => {
      const date = timestamp.slice(0, 10);
      const existing = byDate.get(date);
      if (existing) return existing;
      const created: Point = { date, invoices: 0, pharmacy: 0 };
      byDate.set(date, created);
      return created;
    };

    revenue.forEach(point => {
      at(point.date).invoices = Number(point.invoiceTotal);
    });
    pharmacy.forEach(point => {
      at(point.date).pharmacy = Number(point.saleTotal);
    });

    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [revenue, pharmacy]);

  const totals = data.reduce(
    (sum, point) => ({
      invoices: sum.invoices + point.invoices,
      pharmacy: sum.pharmacy + point.pharmacy
    }),
    { invoices: 0, pharmacy: 0 }
  );

  // A line needs two points to be a line. Below that the form changes, but
  // nothing else about the chart does.
  const singleDay = data.length === 1;

  // Shared so the two forms cannot drift apart in scale, colour or wording —
  // the axis a reader compares against must not depend on which one rendered.
  const grid = (
    <CartesianGrid stroke="var(--color-chart-grid)" strokeWidth={1} vertical={false} />
  );

  const xAxis = (
    <XAxis
      dataKey="date"
      tickFormatter={value => formatDate(value).slice(0, 6)}
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
      width={48}
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
      labelFormatter={value => formatDate(String(value))}
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
        {t('dashboard.takings.invoices')}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-0.5 w-4 rounded-full"
          style={{ backgroundColor: 'var(--color-series-2)' }}
        />
        {t('dashboard.takings.pharmacy')}
      </span>
    </div>
  );

  return (
    <ChartCard
      title={t('dashboard.takings.title')}
      description={t('dashboard.takings.subtitle', {
        invoiced: formatCurrency(totals.invoices),
        dispensed: formatCurrency(totals.pharmacy)
      })}
      legend={legend}
      loading={loading}
      empty={data.length === 0}
      emptyMessage={t('dashboard.takings.empty')}
      table={
        <ChartTable
          headers={[
            t('dashboard.takings.headerDate'),
            t('dashboard.takings.invoices'),
            t('dashboard.takings.pharmacy')
          ]}
          rows={data.map(point => [
            formatDate(point.date),
            formatCurrency(point.invoices),
            formatCurrency(point.pharmacy)
          ])}
        />
      }
    >
      {/* The container is tall enough to hold the plot and its axis band —
          sizing it to the plot alone clips the dates. */}
      <ResponsiveContainer width="100%" height={260}>
        {singleDay ? (
          /*
           * One day in range is not a trend, and a line through a single point
           * draws nothing at all — the chart came out as two stray dots. With
           * one day the question is "how much of each?", which is a magnitude
           * comparison, so it gets bars.
           */
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            {grid}
            {xAxis}
            {yAxis}
            {tooltip}
            <Bar
              dataKey="invoices"
              name={t('dashboard.takings.invoices')}
              fill="var(--color-series-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={64}
            />
            <Bar
              dataKey="pharmacy"
              name={t('dashboard.takings.pharmacy')}
              fill="var(--color-series-2)"
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
              dataKey="invoices"
              name={t('dashboard.takings.invoices')}
              stroke="var(--color-series-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="pharmacy"
              name={t('dashboard.takings.pharmacy')}
              stroke="var(--color-series-2)"
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
