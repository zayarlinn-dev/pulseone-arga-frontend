import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Table2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ChartCardProps {
  title: string;
  description?: string;
  /** Rendered beside the title — the legend, so identity is never colour-alone. */
  legend?: ReactNode;
  loading?: boolean;
  /** True only on first load; a refetch keeps the old chart on screen. */
  empty?: boolean;
  emptyMessage?: string;
  /** The same numbers as a table, for screen readers and for exact values. */
  table: ReactNode;
  children: ReactNode;
}

/**
 * The shell every chart on the dashboard sits in.
 *
 * It carries the two things that are easy to skip and matter most: a legend
 * next to the title, and a table view of the same numbers. A tooltip must never
 * be the only way to read a value — that leaves keyboard and screen-reader
 * users with nothing, and makes exact figures unobtainable on a touch screen.
 *
 * Its own strings stay under `dashboard.chart.*` even though it is shared now:
 * they are the chart/table toggle, identical on every screen that uses it, and
 * moving them would churn two catalogues to relabel one button.
 */
export function ChartCard({
  title,
  description,
  legend,
  loading = false,
  empty = false,
  emptyMessage,
  table,
  children
}: ChartCardProps) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {legend}
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={showTable}
            onClick={() => setShowTable(value => !value)}
          >
            <Table2 className="h-4 w-4" />
            {t(showTable ? 'dashboard.chart.showChart' : 'dashboard.chart.showTable')}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : empty ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            {emptyMessage ?? t('dashboard.chart.empty')}
          </div>
        ) : showTable ? (
          <div className="max-h-64 overflow-auto">{table}</div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

/** Shared table styling, so the table view looks the same on every card. */
export function ChartTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-card">
        <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
          {headers.map((header, index) => (
            <th key={header} className={index === 0 ? 'py-2 font-medium' : 'py-2 text-right font-medium'}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-b last:border-b-0">
            {row.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className={cellIndex === 0 ? 'py-1.5' : 'py-1.5 text-right tabular-nums'}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
