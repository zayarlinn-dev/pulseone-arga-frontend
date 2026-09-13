import { useTranslation } from 'react-i18next';
import { Loader2, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { formatPercent, percentChange } from './periods';
import type { ProfitSummary } from '@/types/models';

interface ProfitStatementProps {
  current?: ProfitSummary;
  previous?: ProfitSummary;
  loading: boolean;
}

/** How a line behaves: a plain figure, something taken off, or a subtotal. */
type LineKind = 'revenue' | 'deduction' | 'subtotal' | 'result';

/**
 * The statement, in the order it is read. Deductions are marked rather than
 * stored negative: the API reports what was given away as a positive amount,
 * and flipping the sign in the data would make the same number mean two things
 * depending on which screen read it. The minus belongs to the presentation.
 *
 * The keys are written out in full rather than assembled from the field name.
 * `t()` is typed against the catalogue, and a key built at runtime is just a
 * string to the compiler — spelling one wrong would ship a raw key onto the
 * screen instead of failing the build.
 */
const LINES = [
  { labelKey: 'profitability.statement.serviceRevenue', field: 'serviceRevenue', kind: 'revenue' },
  { labelKey: 'profitability.statement.medicineRevenue', field: 'medicineRevenue', kind: 'revenue' },
  { labelKey: 'profitability.statement.grossRevenue', field: 'grossRevenue', kind: 'subtotal' },
  { labelKey: 'profitability.statement.discounts', field: 'discounts', kind: 'deduction' },
  { labelKey: 'profitability.statement.refunds', field: 'refunds', kind: 'deduction' },
  { labelKey: 'profitability.statement.returns', field: 'returns', kind: 'deduction' },
  { labelKey: 'profitability.statement.netRevenue', field: 'netRevenue', kind: 'subtotal' },
  { labelKey: 'profitability.statement.medicineCost', field: 'medicineCost', kind: 'deduction' },
  { labelKey: 'profitability.statement.consultantFees', field: 'consultantFees', kind: 'deduction' },
  { labelKey: 'profitability.statement.grossProfit', field: 'grossProfit', kind: 'result' }
] as const satisfies readonly { labelKey: string; field: keyof ProfitSummary; kind: LineKind }[];

type Line = (typeof LINES)[number];

/**
 * The period's trading result as a statement rather than a chart.
 *
 * A chart shows a shape; this shows the arithmetic — every figure that goes
 * into gross profit, in order, with the comparable figure from the period
 * before it. That is what makes the headline number checkable instead of
 * something the reader has to take on trust.
 */
export function ProfitStatement({ current, previous, loading }: ProfitStatementProps) {
  const { t } = useTranslation('management');

  if (loading || !current) {
    return (
      <Card className="flex h-72 items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  const renderChange = (line: Line) => {
    if (!previous) return null;

    const change = percentChange(String(current[line.field]), String(previous[line.field]));
    if (change === null) return <span className="text-muted-foreground">-</span>;

    // Which direction is good depends on the line. More revenue is better;
    // more discount, more refund and more cost are not. Getting this backwards
    // would paint a month of runaway costs green.
    const rose = change > 0;
    const good = line.kind === 'deduction' ? !rose : rose;
    const flat = Math.abs(change) < 0.05;

    const Icon = flat ? Minus : rose ? TrendingUp : TrendingDown;

    return (
      <span
        className={cn(
          'inline-flex items-center justify-end gap-1 tabular-nums',
          flat && 'text-muted-foreground',
          !flat && good && 'text-success',
          !flat && !good && 'text-destructive'
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {formatPercent(Math.abs(change))}
      </span>
    );
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{t('profitability.statement.title')}</h2>
        <p className="text-xs text-muted-foreground">
          {t('profitability.statement.subtitle', {
            from: formatDate(current.fromDate),
            to: formatDate(current.toDate)
          })}
        </p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 text-left font-medium">{t('profitability.statement.line')}</th>
              <th className="py-2 text-right font-medium">{t('profitability.statement.amount')}</th>
              <th className="hidden py-2 text-right font-medium sm:table-cell">
                {t('profitability.statement.previous')}
              </th>
              <th className="py-2 text-right font-medium">{t('profitability.statement.change')}</th>
            </tr>
          </thead>
          <tbody>
            {LINES.map(line => {
              const amount = String(current[line.field]);
              const isTotal = line.kind === 'subtotal' || line.kind === 'result';

              return (
                <tr
                  key={line.field}
                  className={cn(
                    'border-b last:border-b-0',
                    isTotal && 'bg-muted/40 font-medium',
                    line.kind === 'result' && 'text-base'
                  )}
                >
                  <td className={cn('py-2', line.kind === 'deduction' && 'pl-4')}>
                    {t(line.labelKey)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {/* The minus is part of reading a statement, not a
                        negative amount: it says this came off the line above. */}
                    {line.kind === 'deduction' ? '−' : ''}
                    {formatCurrency(amount)}
                  </td>
                  <td className="hidden py-2 text-right tabular-nums text-muted-foreground sm:table-cell">
                    {previous ? (
                      <>
                        {line.kind === 'deduction' ? '−' : ''}
                        {formatCurrency(String(previous[line.field]))}
                      </>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-2 text-right text-xs">{renderChange(line)}</td>
                </tr>
              );
            })}

            <tr className="bg-muted/40 font-medium">
              <td className="py-2">{t('profitability.statement.margin')}</td>
              <td className="py-2 text-right tabular-nums">
                {formatPercent(current.marginPercent)}
              </td>
              <td className="hidden py-2 text-right tabular-nums text-muted-foreground sm:table-cell">
                {previous ? formatPercent(previous.marginPercent) : '-'}
              </td>
              <td className="py-2 text-right text-xs text-muted-foreground">
                {/* A percentage compared against a percentage is a change in
                    percentage points, not a percentage change — shown as points
                    so it cannot be misread as the latter. */}
                {previous
                  ? `${
                      Number(current.marginPercent) - Number(previous.marginPercent) >= 0 ? '+' : '−'
                    }${formatPercent(
                      Math.abs(Number(current.marginPercent) - Number(previous.marginPercent))
                    ).replace('%', '')} pp`
                  : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{t('profitability.statement.accrualNote')}</p>
    </Card>
  );
}
