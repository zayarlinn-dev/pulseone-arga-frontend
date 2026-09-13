import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { ChartCard, ChartTable } from '@/components/shared/ChartCard';
import { useTranslation } from 'react-i18next';
import type { GenderCount } from '@/types/models';

interface RegistrationsChartProps {
  data: GenderCount[];
  loading: boolean;
}

/**
 * New registrations broken down by gender.
 *
 * One colour for every bar, deliberately. The axis already names each bar, so a
 * second colour per bar would encode nothing — it would just look like the bars
 * belonged to different series. Colour earns its place when it carries meaning
 * the labels cannot.
 *
 * Bars are horizontal because the category names read left-to-right at any
 * length, and there are few enough of them that vertical would waste the width.
 */
export function RegistrationsChart({ data, loading }: RegistrationsChartProps) {
  const { t } = useTranslation();

  const rows = data
    .map(row => ({
      // The API can return a gender the catalogue does not cover; falling back
      // to the raw value keeps the bar labelled rather than blank.
      label: t(`person.gender.${row.gender}` as 'person.gender.male', {
        defaultValue: row.gender
      }),
      count: row.count
    }))
    .sort((a, b) => b.count - a.count);

  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <ChartCard
      title={t('dashboard.registrations.title')}
      description={t('dashboard.registrations.subtitle', { count: total })}
      loading={loading}
      empty={rows.length === 0}
      emptyMessage={t('dashboard.registrations.empty')}
      table={
        <ChartTable
          headers={[
            t('dashboard.registrations.headerGender'),
            t('dashboard.registrations.headerPatients'),
            t('dashboard.registrations.headerShare')
          ]}
          rows={rows.map(row => [
            row.label,
            row.count.toLocaleString(),
            total > 0 ? `${Math.round((row.count / total) * 100)}%` : '-'
          ])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={Math.max(rows.length * 56, 160)}>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 0, left: 0 }}
          barCategoryGap={12}
        >
          <CartesianGrid stroke="var(--color-chart-grid)" strokeWidth={1} horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-chart-grid)' }}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 12, fill: 'var(--color-foreground)' }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-muted)' }}
            contentStyle={{
              backgroundColor: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
              fontSize: '0.75rem'
            }}
            labelStyle={{ color: 'var(--color-foreground)' }}
            formatter={value => [
              Number(value ?? 0).toLocaleString(),
              t('dashboard.registrations.headerPatients')
            ]}
          />
          {/* 4px rounded end anchored to the baseline; the bar keeps its square
              root so it reads as growing from zero. */}
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {rows.map(row => (
              <Cell key={row.label} fill="var(--color-series-1)" />
            ))}
            {/* Labelling three bars is selective, not a number on every point. */}
            <LabelList
              dataKey="count"
              position="right"
              offset={8}
              style={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
