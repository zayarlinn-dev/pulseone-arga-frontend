import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ChartCard, ChartTable } from '@/components/shared/ChartCard';
import { formatCompactMoney, formatCurrency } from '@/lib/utils';
import { formatPercent } from './periods';
import type { ExpiryBucket, ExpiryBucketName } from '@/types/models';

interface ExpiryExposureChartProps {
  buckets: ExpiryBucket[];
  loading: boolean;
}

/**
 * The bands the chart draws, in shelf-life order, each with its step of the
 * ordinal ramp.
 *
 * "none" is deliberately absent: stock with no expiry date is not a point on a
 * shelf-life axis, and giving it a bar would put a category into a scale. Its
 * value is stated under the chart instead, so the number is still reachable
 * without pretending it belongs on the axis.
 *
 * The ramp runs dark at "expired" to light at "over 180 days" — the ordinal
 * encoding is doing the work a status colour would otherwise be borrowed for,
 * and the urgency reads from the weight rather than from red meaning bad.
 */
const BANDS: { name: Exclude<ExpiryBucketName, 'none'>; color: string }[] = [
  { name: 'expired', color: 'var(--color-scale-5)' },
  { name: 'days30', color: 'var(--color-scale-4)' },
  { name: 'days90', color: 'var(--color-scale-3)' },
  { name: 'days180', color: 'var(--color-scale-2)' },
  { name: 'beyond', color: 'var(--color-scale-1)' }
];

interface Row {
  name: ExpiryBucketName;
  label: string;
  value: number;
  qty: number;
  batches: number;
  color: string;
}

/**
 * What is on the shelf, by how long it has left to sell.
 *
 * Bands rather than a cumulative curve: "how much expires eventually" is all of
 * it, and the only actionable question is how much has to move this month as
 * against next quarter. Each batch lands in exactly one band, so the bars add
 * up to the stock figure above them.
 */
export function ExpiryExposureChart({ buckets, loading }: ExpiryExposureChartProps) {
  const { t } = useTranslation('management');

  const byName = new Map(buckets.map(bucket => [bucket.bucket, bucket]));
  const label = (name: ExpiryBucketName) => t(`inventory.expiry.band.${name}`);

  const rows: Row[] = BANDS.map(band => {
    const bucket = byName.get(band.name);
    return {
      name: band.name,
      label: label(band.name),
      value: Number(bucket?.value ?? 0),
      qty: bucket?.qty ?? 0,
      batches: bucket?.batches ?? 0,
      color: band.color
    };
  });

  const undated = byName.get('none');
  const undatedValue = Number(undated?.value ?? 0);
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  // The table carries every band including the undated one, so the exact
  // figures are all reachable even though the chart shows five bars.
  const tableRows = [...BANDS.map(band => band.name), 'none' as const].map(name => {
    const bucket = byName.get(name);
    return [
      label(name),
      (bucket?.batches ?? 0).toLocaleString(),
      (bucket?.qty ?? 0).toLocaleString(),
      formatCurrency(bucket?.value ?? 0)
    ];
  });

  return (
    <ChartCard
      title={t('inventory.expiry.title')}
      description={t('inventory.expiry.subtitle')}
      loading={loading}
      empty={total === 0 && undatedValue === 0}
      emptyMessage={t('inventory.expiry.empty')}
      table={
        <ChartTable
          headers={[
            t('inventory.expiry.headerBand'),
            t('inventory.expiry.headerBatches'),
            t('inventory.expiry.headerQty'),
            t('inventory.expiry.headerValue')
          ]}
          rows={tableRows}
        />
      }
    >
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
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
            width={116}
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
            formatter={(value, _name, entry) => {
              const row = entry?.payload as Row | undefined;
              const share = total > 0 ? (Number(value ?? 0) / total) * 100 : 0;
              return [
                `${formatCurrency(Number(value ?? 0))} · ${formatPercent(share)} · ${
                  row?.batches ?? 0
                }`,
                t('inventory.expiry.headerValue')
              ];
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={26}>
            {rows.map(row => (
              <Cell key={row.name} fill={row.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {undatedValue > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t('inventory.expiry.noneNote', { value: formatCurrency(undatedValue) })}
        </p>
      )}
    </ChartCard>
  );
}
