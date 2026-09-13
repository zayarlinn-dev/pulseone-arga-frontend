import { Minus, Percent, Pill, Plus, Stethoscope, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { formatQty } from '@/lib/uom';
import type { CounterViewMode } from '@/stores/counterViewStore';
import { lineTotal, type CartLine } from '../types';

interface TicketLinesProps {
  lines: CartLine[];
  mode: CounterViewMode;
  onQtyChange: (key: string, qty: number) => void;
  /** Switches a line to another of the item's units. Undefined is the sale unit. */
  onUnitChange: (key: string, uomId?: number) => void;
  onDiscountChange: (key: string, percentage: number) => void;
  onRemove: (key: string) => void;
}

/** Line discounts an operator can apply without typing a number. */
const DISCOUNT_STEPS = [0, 5, 10, 20, 50];

/**
 * Keeps a typed quantity or discount inside what the ticket can represent.
 *
 * Quantity floors at one rather than zero, so clearing the field to retype it
 * does not delete the line out from under the cursor — removing a line is what
 * the bin button is for.
 */
const clamp = (value: string, min: number, max: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
};

/**
 * The ticket itself.
 *
 * On touch, quantity is a stepper and the line discount is a row of presets:
 * the counter changes a quantity far more often than it sets one, and ±1 on a
 * 40px target beats selecting the contents of an input and retyping it.
 *
 * With a keyboard that reasoning inverts — typing 12 is one action where the
 * stepper is twelve — so the computer layout gives both a small field instead,
 * and folds the whole line onto one row.
 */
export function TicketLines({
  lines,
  mode,
  onQtyChange,
  onUnitChange,
  onDiscountChange,
  onRemove
}: TicketLinesProps) {
  const { t } = useTranslation();
  /**
   * The unit picker, shown only for a line that has a second unit to offer.
   *
   * Its value is the unit's id, and the item's own sale unit has none — so the
   * empty string stands for it, the same way a line that names no unit is read
   * as the sale unit everywhere else.
   */
  const unitPicker = (line: CartLine) => {
    if ((line.unitOptions?.length ?? 0) < 2) return null;

    return (
      <select
        value={line.uomId === undefined ? '' : String(line.uomId)}
        aria-label={t('counter.lines.unitAria', { item: line.name })}
        className="h-8 shrink-0 rounded-md border border-input bg-transparent px-1 text-xs"
        onChange={event =>
          onUnitChange(line.key, event.target.value === '' ? undefined : Number(event.target.value))
        }
      >
        {line.unitOptions!.map(option => (
          <option key={option.uomId ?? 'sale'} value={option.uomId ?? ''}>
            {option.name ?? '—'}
          </option>
        ))}
      </select>
    );
  };
  if (lines.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        {mode === 'desktop'
          ? t('counter.lines.pickPrompt')
          : t('counter.lines.tapPrompt')}
      </p>
    );
  }

  if (mode === 'desktop') {
    return (
      <ul className="divide-y">
        {lines.map(line => {
          const overStock = line.stockOnHand !== undefined && line.qty > line.stockOnHand;

          return (
            <li key={line.key} className="px-2 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm leading-tight">{line.name}</span>
                  <span className="block truncate font-mono text-[11px] leading-tight text-muted-foreground">
                    {line.code} · {formatCurrency(line.unitPrice)}
                  </span>
                </span>

                <Input
                  value={String(line.qty)}
                  inputMode="numeric"
                  aria-label={t('counter.lines.qtyAria', { item: line.name })}
                  className="h-8 w-14 px-1 text-center tabular-nums"
                  onChange={event => onQtyChange(line.key, clamp(event.target.value, 1, 9999))}
                />

                {unitPicker(line)}

                <span className="relative">
                  <Input
                    value={line.percentageDiscount === 0 ? '' : String(line.percentageDiscount)}
                    inputMode="numeric"
                    placeholder="0"
                    aria-label={t('counter.lines.discountAria', { item: line.name })}
                    className="h-8 w-14 px-1 pr-4 text-center tabular-nums"
                    onChange={event =>
                      onDiscountChange(line.key, clamp(event.target.value, 0, 100))
                    }
                  />
                  <Percent className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                </span>

                <span className="w-20 shrink-0 text-right text-sm font-medium tabular-nums">
                  {formatCurrency(lineTotal(line))}
                </span>

                <button
                  type="button"
                  onClick={() => onRemove(line.key)}
                  aria-label={`Remove ${line.name}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {overStock && (
                <p className="mt-1 text-xs text-destructive">
                  Only {formatQty(line.stockOnHand!, line.uom)} in stock — the sale will be
                  refused.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className="divide-y">
      {lines.map(line => {
        const Icon = line.kind === 'service' ? Stethoscope : Pill;
        const overStock = line.stockOnHand !== undefined && line.qty > line.stockOnHand;

        return (
          <li key={line.key} className="px-3 py-2.5">
            <div className="flex items-start gap-2">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{line.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  <span className="font-mono">{line.code}</span> ·{' '}
                  {formatCurrency(line.unitPrice)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(line.key)}
                aria-label={`Remove ${line.name}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onQtyChange(line.key, line.qty - 1)}
                  aria-label={t('counter.lines.oneFewer', { item: line.name })}
                  className="flex h-10 w-10 items-center justify-center rounded-md border transition-colors hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-base font-semibold tabular-nums">
                  {line.qty}
                </span>
                <button
                  type="button"
                  onClick={() => onQtyChange(line.key, line.qty + 1)}
                  aria-label={t('counter.lines.oneMore', { item: line.name })}
                  className="flex h-10 w-10 items-center justify-center rounded-md border transition-colors hover:bg-accent active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Plus className="h-4 w-4" />
                </button>

                {/* Next to the stepper, because "three of what" is the same
                    decision as "three". */}
                {unitPicker(line)}
              </div>

              <span className="text-right">
                <span className="block text-sm font-semibold tabular-nums">
                  {formatCurrency(lineTotal(line))}
                </span>
                {line.percentageDiscount > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    {t('counter.lines.less', { rate: line.percentageDiscount })}
                  </span>
                )}
              </span>
            </div>

            {/* Kept on the line rather than behind a dialog: a discount given
                at the counter is usually decided while the item is being added,
                and a modal per line would double the taps. */}
            <div className="mt-2 flex items-center gap-1">
              <Percent className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {DISCOUNT_STEPS.map(step => (
                <button
                  key={step}
                  type="button"
                  onClick={() => onDiscountChange(line.key, step)}
                  className={`h-8 flex-1 rounded-md border text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    line.percentageDiscount === step
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {step === 0 ? t('counter.lines.noDiscount') : `${step}%`}
                </button>
              ))}
            </div>

            {overStock && (
              <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
                {t('counter.lines.onlyInStock', { qty: line.stockOnHand ?? 0 })}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
