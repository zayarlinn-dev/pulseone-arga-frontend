import { Banknote, CreditCard, Loader2, Smartphone, Trash2, UserPlus, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { cn, currencySuffix, formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { Patient, PaymentMethod } from '@/types/models';
import { TicketLines } from './TicketLines';
import { NumericKeypad } from './NumericKeypad';
import type { CounterViewMode } from '@/stores/counterViewStore';
import type { CartLine } from '../types';

/** The notes a Myanmar counter actually holds, largest last. */
const QUICK_CASH = [1000, 5000, 10000, 20000, 50000];

const PAYMENT_METHODS: {
  value: PaymentMethod;
  /** Catalogue path; the tile is short, so these are their own keys rather than
   *  the longer names used in the invoice dialogs. */
  labelKey: 'counter.panel.methodCash' | 'counter.panel.methodBanking' | 'counter.panel.methodWallet';
  icon: typeof Banknote;
}[] = [
  { value: 'cash', labelKey: 'counter.panel.methodCash', icon: Banknote },
  { value: 'banking', labelKey: 'counter.panel.methodBanking', icon: CreditCard },
  { value: 'e-wallet', labelKey: 'counter.panel.methodWallet', icon: Smartphone }
];

export interface TicketTotals {
  subTotal: number;
  percentageAmount: number;
  flatDiscount: number;
  taxAmount: number;
  netAmount: number;
  overDiscounted: boolean;
}

interface TicketPanelProps {
  lines: CartLine[];
  totals: TicketTotals;
  mode: CounterViewMode;
  patient: Patient | null;
  onOpenPatient: () => void;
  onClearPatient: () => void;
  onQtyChange: (key: string, qty: number) => void;
  /** Switches a line to another of the item's units — see setLineUnit. */
  onLineUnitChange: (key: string, uomId?: number) => void;
  onLineDiscountChange: (key: string, percentage: number) => void;
  onRemoveLine: (key: string) => void;
  onClearTicket: () => void;

  percentageDiscount: string;
  onPercentageDiscountChange: (value: string) => void;
  amountDiscount: string;
  onAmountDiscountChange: (value: string) => void;
  tax: string;
  onTaxChange: (value: string) => void;

  paidBy: PaymentMethod;
  onPaidByChange: (value: PaymentMethod) => void;
  paidAmount: string;
  onPaidAmountChange: (value: string) => void;
  transactionNo: string;
  onTransactionNoChange: (value: string) => void;

  /**
   * True for a walk-in: with no patient attached there is nobody to chase a
   * balance from, so the backend refuses anything short of payment in full and
   * the button says so rather than failing on submit.
   */
  requiresFullPayment: boolean;
  saving: boolean;
  onCharge: () => void;
}

/**
 * The right-hand half of the counter: what is being bought, and what is being
 * handed over for it.
 *
 * The order down the panel is the order the transaction happens in — who it is
 * for, what they are taking, what it comes to, what they paid — so the operator
 * never scrolls back up to finish a step they have already passed.
 */
export function TicketPanel({
  lines,
  totals,
  mode,
  patient,
  onOpenPatient,
  onClearPatient,
  onQtyChange,
  onLineUnitChange,
  onLineDiscountChange,
  onRemoveLine,
  onClearTicket,
  percentageDiscount,
  onPercentageDiscountChange,
  amountDiscount,
  onAmountDiscountChange,
  tax,
  onTaxChange,
  paidBy,
  onPaidByChange,
  paidAmount,
  onPaidAmountChange,
  transactionNo,
  onTransactionNoChange,
  requiresFullPayment,
  saving,
  onCharge
}: TicketPanelProps) {
  const { t } = useTranslation();
  const paid = Number(paidAmount) || 0;
  const change = Math.max(Math.round((paid - totals.netAmount) * 100) / 100, 0);
  const balance = Math.max(Math.round((totals.netAmount - paid) * 100) / 100, 0);
  const settled = paid >= totals.netAmount;
  const shortPaid = requiresFullPayment && !settled;
  const touch = mode === 'touch';

  const chargeLabel = shortPaid
    ? t('counter.panel.chargeFullRequired')
    : totals.netAmount > 0 && settled
      ? t('counter.panel.chargeTakePayment')
      : paid > 0
        ? t('counter.panel.chargePartPayment')
        : t('counter.panel.chargeToAccount');

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Who it is for. A walk-in needs no record, so this stays optional and
          out of the way until it is wanted. */}
      <div className={cn('flex items-center gap-2 border-b', touch ? 'p-3' : 'p-2')}>
        {patient ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{patient.patientName}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {patient.patientNo}
              </p>
            </div>
            {patient.vip && <Badge variant="warning">VIP</Badge>}
            <Button
              variant="ghost"
              size="icon"
              className={cn('shrink-0', touch ? 'h-10 w-10' : 'h-8 w-8')}
              onClick={onClearPatient}
              aria-label={t('counter.panel.clearPatient')}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            className={cn('flex-1 justify-start', touch ? 'h-11' : 'h-9')}
            onClick={onOpenPatient}
          >
            <UserPlus className="h-4 w-4" />
            {t('counter.panel.walkIn')}
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TicketLines
          lines={lines}
          mode={mode}
          onQtyChange={onQtyChange}
          onUnitChange={onLineUnitChange}
          onDiscountChange={onLineDiscountChange}
          onRemove={onRemoveLine}
        />

        {lines.length > 0 && (
          <div className={cn('border-t', touch ? 'space-y-3 p-3' : 'space-y-2 p-2')}>
            <div className={cn('grid grid-cols-3', touch ? 'gap-2' : 'gap-1.5')}>
              <Field
                label={t('counter.panel.discountPercent')}
                htmlFor="ticketPercentageDiscount"
              >
                <Input
                  id="ticketPercentageDiscount"
                  className={cn('text-center tabular-nums', touch ? 'h-11' : 'h-8')}
                  inputMode="numeric"
                  placeholder="0"
                  value={percentageDiscount}
                  onChange={event => onPercentageDiscountChange(event.target.value)}
                />
              </Field>
              <Field label={t('counter.panel.discountAmount')} htmlFor="ticketAmountDiscount">
                <MoneyInput
                  id="ticketAmountDiscount"
                  className={cn('text-center tabular-nums', touch ? 'h-11' : 'h-8')}
                  placeholder="0"
                  value={amountDiscount}
                  onChange={event => onAmountDiscountChange(event.target.value)}
                />
              </Field>
              <Field label={t('counter.panel.taxPercent')} htmlFor="ticketTax">
                <Input
                  id="ticketTax"
                  className={cn('text-center tabular-nums', touch ? 'h-11' : 'h-8')}
                  inputMode="decimal"
                  placeholder="0"
                  value={tax}
                  onChange={event => onTaxChange(event.target.value)}
                />
              </Field>
            </div>

            <dl className="space-y-1.5 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  {t('counter.panel.subtotal')}
                  <Badge variant="secondary" className="ml-2">
                    {lines.reduce((sum, line) => sum + line.qty, 0)}
                  </Badge>
                </dt>
                <dd className="tabular-nums">{formatCurrency(totals.subTotal)}</dd>
              </div>
              {totals.percentageAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {t('counter.panel.discountRate', { rate: percentageDiscount })}
                  </dt>
                  <dd className="tabular-nums text-destructive">
                    −{formatCurrency(totals.percentageAmount)}
                  </dd>
                </div>
              )}
              {totals.flatDiscount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t('counter.panel.discount')}</dt>
                  <dd className="tabular-nums text-destructive">
                    −{formatCurrency(totals.flatDiscount)}
                  </dd>
                </div>
              )}
              {totals.taxAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    {t('counter.panel.tax', { rate: tax })}
                  </dt>
                  <dd className="tabular-nums">{formatCurrency(totals.taxAmount)}</dd>
                </div>
              )}
            </dl>

            {totals.overDiscounted && (
              <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                {t('counter.panel.overDiscounted')}
              </p>
            )}

            <div
              className={cn(
                'grid grid-cols-3 border-t',
                touch ? 'gap-2 pt-3' : 'gap-1.5 pt-2'
              )}
            >
              {PAYMENT_METHODS.map(method => {
                const Icon = method.icon;
                const active = paidBy === method.value;

                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => onPaidByChange(method.value)}
                    aria-pressed={active}
                    className={cn(
                      'flex items-center justify-center rounded-lg border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      touch ? 'h-14 flex-col gap-1 text-xs' : 'h-9 gap-1.5 text-xs',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-accent'
                    )}
                  >
                    <Icon className={touch ? 'h-5 w-5' : 'h-3.5 w-3.5'} />
                    {t(method.labelKey)}
                  </button>
                );
              })}
            </div>

            {paidBy !== 'cash' && (
              <Field label={t('counter.panel.transactionRef')} htmlFor="ticketTransactionNo">
                <Input
                  id="ticketTransactionNo"
                  className={touch ? 'h-11' : 'h-8'}
                  value={transactionNo}
                  onChange={event => onTransactionNoChange(event.target.value)}
                />
              </Field>
            )}

            {/*
              The pad is the whole difference at the payment step. On a till
              there is no keyboard and the soft one would cover the total being
              read; on a PC it is a slower way to do what the number row does
              already, so the computer layout takes the amount as plain text
              and keeps only the one-tap Exact.
            */}
            {touch ? (
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('counter.panel.received')}
                </p>
                {/*
                  The keyed digits are shown as typed rather than reformatted —
                  a total that regroups itself under the operator's fingers is
                  hard to check against the cash in hand. Only the unit is
                  added.
                */}
                <p className="mb-2 text-2xl font-semibold tabular-nums">
                  {paidAmount === '' ? '0' : paidAmount}{' '}
                  <span className="text-base font-normal text-muted-foreground">
                    {currencySuffix()}
                  </span>
                </p>
                <NumericKeypad
                  value={paidAmount}
                  onChange={onPaidAmountChange}
                  quickAmounts={QUICK_CASH}
                  onQuickAmount={amount => onPaidAmountChange(String(paid + amount))}
                />
                <button
                  type="button"
                  onClick={() => onPaidAmountChange(String(totals.netAmount))}
                  className="mt-2 h-11 w-full rounded-lg border bg-card text-sm font-medium transition-colors hover:bg-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {t('counter.panel.exactWithAmount', {
                    amount: formatCurrency(totals.netAmount)
                  })}
                </button>
              </div>
            ) : (
              <div className="flex items-end gap-1.5">
                <Field
                  label={t('counter.panel.received')}
                  htmlFor="ticketPaidAmount"
                  className="flex-1"
                >
                  <MoneyInput
                    id="ticketPaidAmount"
                    className="h-8 text-right"
                    placeholder="0"
                    value={paidAmount}
                    onChange={event => onPaidAmountChange(event.target.value)}
                  />
                </Field>
                <Button
                  variant="outline"
                  className="h-8 shrink-0 px-2 text-xs"
                  onClick={() => onPaidAmountChange(String(totals.netAmount))}
                >
                  {t('counter.panel.exact')}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pinned: the total and the button that acts on it are the two things
          that must never be scrolled off a counter screen. */}
      <div className={cn('border-t bg-card', touch ? 'space-y-2 p-3' : 'space-y-1.5 p-2')}>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">{t('counter.panel.total')}</span>
          <span className={cn('font-semibold tabular-nums', touch ? 'text-2xl' : 'text-xl')}>
            {formatCurrency(totals.netAmount)}
          </span>
        </div>

        {change > 0 ? (
          <div className="flex justify-between rounded-md bg-success/10 px-3 py-2 text-sm font-medium text-success">
            <span>{t('counter.panel.changeDue')}</span>
            <span className="tabular-nums">{formatCurrency(change)}</span>
          </div>
        ) : shortPaid && lines.length > 0 ? (
          <div className="flex justify-between rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span>{t('counter.panel.stillToPay')}</span>
            <span className="font-medium tabular-nums">{formatCurrency(balance)}</span>
          </div>
        ) : balance > 0 && paid > 0 ? (
          <div className="flex justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">{t('counter.panel.balanceOwing')}</span>
            <span className="font-medium tabular-nums">{formatCurrency(balance)}</span>
          </div>
        ) : null}

        <div className={cn('flex', touch ? 'gap-2' : 'gap-1.5')}>
          <Button
            variant="outline"
            className={cn('shrink-0', touch ? 'h-14 w-14' : 'h-10 w-10')}
            disabled={lines.length === 0 || saving}
            onClick={onClearTicket}
            aria-label={t('counter.panel.clearTicket')}
          >
            <Trash2 className={touch ? 'h-5 w-5' : 'h-4 w-4'} />
          </Button>
          <Button
            className={cn('flex-1', touch ? 'h-14 text-base' : 'h-10')}
            disabled={lines.length === 0 || totals.overDiscounted || shortPaid || saving}
            onClick={onCharge}
          >
            {saving ? (
              <Loader2 className={touch ? 'h-5 w-5 animate-spin' : 'h-4 w-4 animate-spin'} />
            ) : (
              <Wallet className={touch ? 'h-5 w-5' : 'h-4 w-4'} />
            )}
            {chargeLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
