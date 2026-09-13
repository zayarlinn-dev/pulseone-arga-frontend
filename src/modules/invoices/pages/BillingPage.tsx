import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Receipt, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { PatientSearchSelect } from '@/components/shared/PatientSearchSelect';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { invoiceService, patientService, type InvoiceCreatePayload } from '@/services';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { InvoiceDetail, Patient, PaymentMethod } from '@/types/models';

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'banking', 'e-wallet'];

/** Parses a money field, treating anything unparseable as zero. */
const num = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * The cashier's screen: pick a patient, tick what they are paying for, take the
 * money.
 *
 * The totals shown here mirror the backend's arithmetic exactly — discounts off
 * the subtotal, then tax on what is left — so the figure the patient is quoted
 * is the figure that gets stored. The backend recomputes it all regardless; it
 * never trusts a total from the browser.
 */
export default function BillingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const presetPatientId = searchParams.get('patientId');

  /** Matches the `lg` breakpoint the two-column layout is built around. */
  const isWide = useMediaQuery('(min-width: 1024px)');

  const [patient, setPatient] = useState<Patient | null>(null);
  /** Only reachable below lg, where the summary is a sheet rather than a column. */
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [percentageDiscount, setPercentageDiscount] = useState('');
  const [amountDiscount, setAmountDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [paidBy, setPaidBy] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [transactionNo, setTransactionNo] = useState('');

  // Arriving from an order row, the patient is already known.
  const { data: presetPatient } = useQuery({
    queryKey: ['patient', presetPatientId],
    enabled: !!presetPatientId,
    queryFn: () => patientService.getById(presetPatientId!)
  });

  useEffect(() => {
    if (presetPatient) setPatient(presetPatient);
  }, [presetPatient]);

  const {
    data: lines = [],
    isLoading: loadingLines,
    isFetching
  } = useQuery({
    queryKey: ['billable-lines', patient?.id],
    enabled: !!patient,
    queryFn: () => invoiceService.getBillableLines(patient!.id)
  });

  // Everything outstanding is billed by default — the common case is "settle
  // the whole visit", and unticking is quicker than ticking ten lines.
  useEffect(() => {
    setSelectedIds(new Set(lines.map(line => line.id)));
  }, [lines]);

  const selectedLines = useMemo(
    () => lines.filter(line => selectedIds.has(line.id)),
    [lines, selectedIds]
  );

  const totals = useMemo(() => {
    const subTotal = round2(
      selectedLines.reduce((sum, line) => sum + Number(line.totalAmount), 0)
    );
    const percentageAmount = round2((subTotal * num(percentageDiscount)) / 100);
    const flatDiscount = num(amountDiscount);
    const discounted = round2(subTotal - percentageAmount - flatDiscount);
    const taxAmount = discounted < 0 ? 0 : round2((discounted * num(tax)) / 100);

    return {
      subTotal,
      percentageAmount,
      flatDiscount,
      discounted,
      taxAmount,
      netAmount: round2(discounted + taxAmount)
    };
  }, [selectedLines, percentageDiscount, amountDiscount, tax]);

  const overDiscounted = totals.discounted < 0;
  const paid = num(paidAmount);
  const change = round2(Math.max(paid - totals.netAmount, 0));
  const balance = round2(Math.max(totals.netAmount - paid, 0));

  const { mutateAsync: createInvoice, isPending: saving } = useMutation({
    mutationFn: (payload: InvoiceCreatePayload) => invoiceService.create(payload),
    onSuccess: invoice => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['billable-lines'] });
      queryClient.invalidateQueries({ queryKey: ['patient-summary'] });
      toast.success(t('newBill.toast.created', { number: invoice.invoiceNo }));
      navigate(`/billing/invoices/${invoice.id}`);
    },
    onError: (error: Error) => toast.error(error.message || t('newBill.toast.failed'))
  });

  const toggleLine = (id: number) =>
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const handleSubmit = () => {
    if (selectedLines.length === 0) {
      toast.error(t('newBill.toast.selectCharge'));
      return;
    }
    if (overDiscounted) {
      toast.error(t('newBill.toast.overDiscounted'));
      return;
    }

    return createInvoice({
      invoiceDetailIds: selectedLines.map(line => line.id),
      percentageDiscount: percentageDiscount ? Number(percentageDiscount) : null,
      amountDiscount: amountDiscount ? String(num(amountDiscount)) : null,
      tax: tax ? String(num(tax)) : null,
      paidBy,
      paidAmount: String(paid),
      transactionNo: transactionNo.trim() || null
    });
  };

  const renderLine = (line: InvoiceDetail) => {
    const checked = selectedIds.has(line.id);

    return (
      <label
        key={line.id}
        className="flex cursor-pointer items-start gap-3 border-b px-3 py-2.5 last:border-b-0 hover:bg-accent/40"
      >
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 accent-primary"
          checked={checked}
          onChange={() => toggleLine(line.id)}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {line.service?.serviceName ?? t('newBill.unnamedService', { id: line.serviceId })}
          </span>
          <span className="block text-xs text-muted-foreground">
            {formatCurrency(line.servicePrice)} × {line.qty}
            {line.employee ? ` · ${line.employee.fullName}` : ''}
            {line.order ? ` · ${line.order.orderNo}` : ''} · {formatDate(line.orderDate)}
          </span>
          {line.orderRemarks && (
            <span className="block text-xs italic text-muted-foreground">{line.orderRemarks}</span>
          )}
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-medium tabular-nums">
            {formatCurrency(line.totalAmount)}
          </span>
          {Number(line.percentageDiscountAmount) + Number(line.amountDiscount) > 0 && (
            <span className="block text-xs text-muted-foreground">
              {t('newBill.less', {
                amount: formatCurrency(
                  Number(line.percentageDiscountAmount) + Number(line.amountDiscount)
                )
              })}
            </span>
          )}
        </span>
      </label>
    );
  };

  /**
   * Totals, the discount and payment fields, and the button that takes the
   * money.
   *
   * Named rather than written inline because below `lg` this is not a sidebar
   * at all. A phone stacks it under the line items, where the cashier would
   * have to scroll past every service on the bill to reach the amount and the
   * pay button — so there it becomes a sheet raised from a fixed bottom bar,
   * the same arrangement the counter screen uses for its ticket.
   */
  const summary = (
    <>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Receipt className="h-4 w-4" />
        {t('newBill.summary')}
      </p>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {t('newBill.subtotal')}
            <Badge variant="secondary" className="ml-2">
              {selectedLines.length}
            </Badge>
          </dt>
          <dd className="tabular-nums">{formatCurrency(totals.subTotal)}</dd>
        </div>
        {totals.percentageAmount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {t('newBill.discountPercent', { rate: percentageDiscount })}
            </dt>
            <dd className="tabular-nums text-destructive">
              −{formatCurrency(totals.percentageAmount)}
            </dd>
          </div>
        )}
        {totals.flatDiscount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('newBill.discount')}</dt>
            <dd className="tabular-nums text-destructive">
              −{formatCurrency(totals.flatDiscount)}
            </dd>
          </div>
        )}
        {totals.taxAmount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('newBill.tax', { rate: tax })}</dt>
            <dd className="tabular-nums">{formatCurrency(totals.taxAmount)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>{t('newBill.netAmount')}</dt>
          <dd className="tabular-nums">{formatCurrency(totals.netAmount)}</dd>
        </div>
      </dl>

      {overDiscounted && (
        <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {t('newBill.overDiscounted')}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
        <Field label={t('newBill.discountPercentLabel')} htmlFor="percentageDiscount">
          <Input
            id="percentageDiscount"
            inputMode="numeric"
            placeholder="0"
            value={percentageDiscount}
            onChange={event => setPercentageDiscount(event.target.value)}
          />
        </Field>
        <Field label={t('newBill.discountAmountLabel')} htmlFor="amountDiscount">
          <MoneyInput
            id="amountDiscount"
            placeholder="0"
            value={amountDiscount}
            onChange={event => setAmountDiscount(event.target.value)}
          />
        </Field>
        <Field label={t('newBill.taxPercentLabel')} htmlFor="tax">
          <Input
            id="tax"
            inputMode="decimal"
            placeholder="0"
            value={tax}
            onChange={event => setTax(event.target.value)}
          />
        </Field>
        <Field label={t('newBill.paidBy')} htmlFor="paidBy">
          <NativeSelect
            id="paidBy"
            value={paidBy}
            onChange={event => setPaidBy(event.target.value as PaymentMethod)}
          >
            {PAYMENT_METHODS.map(method => (
              <option key={method} value={method}>
                {t(`common.paymentMethod.${method}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <div className="mt-2 space-y-2">
        <Field
          label={t('newBill.amountReceived')}
          htmlFor="paidAmount"
          hint={t('newBill.amountReceivedHint')}
        >
          <MoneyInput
            id="paidAmount"
            placeholder="0"
            value={paidAmount}
            onChange={event => setPaidAmount(event.target.value)}
          />
        </Field>

        {paidBy !== 'cash' && (
          <Field label={t('newBill.transactionRef')} htmlFor="transactionNo">
            <Input
              id="transactionNo"
              value={transactionNo}
              onChange={event => setTransactionNo(event.target.value)}
            />
          </Field>
        )}
      </div>

      <div className="mt-3 space-y-1 rounded-md bg-muted/50 px-3 py-2 text-sm">
        {change > 0 ? (
          <div className="flex justify-between font-medium">
            <span>{t('newBill.changeDue')}</span>
            <span className="tabular-nums">{formatCurrency(change)}</span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t('newBill.balanceOwing')}</span>
            <span className="tabular-nums font-medium">{formatCurrency(balance)}</span>
          </div>
        )}
      </div>

      <Button
        className="mt-4 w-full"
        disabled={saving || selectedLines.length === 0 || overDiscounted}
        onClick={() => void handleSubmit()}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
        {paid >= totals.netAmount && totals.netAmount > 0
          ? t('newBill.submitPaid')
          : paid > 0
            ? t('newBill.submitPart')
            : t('newBill.submitUnpaid')}
      </Button>
    </>
  );

  return (
    <>
      <div className="mb-4 flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 h-8 w-8"
          onClick={() => navigate('/billing/invoices')}
          aria-label={t('invoices.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t('newBill.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('newBill.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* The bottom bar floats over the page, so the last line needs room. */}
        <div className="space-y-4 pb-20 lg:pb-0">
          <Card className="p-4">
            <Field label={t('newBill.patient')} required>
              <PatientSearchSelect value={patient} onChange={setPatient} />
            </Field>
            {patient?.visit?.visitCode && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t('newBill.currentVisit')}{' '}
                <span className="font-mono">{patient.visit.visitCode}</span>
              </p>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <p className="text-sm font-semibold">{t('newBill.outstanding')}</p>
                <p className="text-xs text-muted-foreground">{t('newBill.outstandingHint')}</p>
              </div>
              {lines.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedIds(
                      selectedIds.size === lines.length
                        ? new Set()
                        : new Set(lines.map(line => line.id))
                    )
                  }
                >
                  {t(
                    selectedIds.size === lines.length ? 'newBill.clearAll' : 'newBill.selectAll'
                  )}
                </Button>
              )}
            </div>

            {!patient ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {t('newBill.findPatient')}
              </p>
            ) : loadingLines || isFetching ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : lines.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {t('newBill.nothingOutstanding')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate('/orders')}
                >
                  {t('newBill.orderService')}
                </Button>
              </div>
            ) : (
              <div>{lines.map(renderLine)}</div>
            )}
          </Card>
        </div>

        {/* Mounted rather than hidden with a class: the summary carries `id`s
            its labels point at, and rendering it in both places at once would
            put every one of them in the document twice. */}
        {isWide && (
          <aside>
            <Card className="sticky top-20 p-4">{summary}</Card>
          </aside>
        )}
      </div>

      {/* The mobile stand-in for that sidebar: the figure that decides the
          transaction, and the way through to the rest of it. */}
      {!isWide && (
        <>
          <div
            data-print-hide
            className="fixed inset-x-0 bottom-0 z-30 border-t bg-card p-3"
          >
            <Button
              className="h-14 w-full justify-between text-base"
              disabled={selectedLines.length === 0}
              onClick={() => setSummaryOpen(true)}
            >
              <span className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                {t('newBill.summary')}
                <Badge variant="secondary">{selectedLines.length}</Badge>
              </span>
              <span className="tabular-nums">{formatCurrency(totals.netAmount)}</span>
            </Button>
          </div>

          <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
            <DialogContent className="max-w-lg">
              {/* The bar that opened the sheet already names it. */}
              <DialogHeader className="sr-only">
                <DialogTitle>{t('newBill.summary')}</DialogTitle>
              </DialogHeader>
              {summary}
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
