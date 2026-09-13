import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Ban, Loader2, Undo2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { PrintControls } from '@/components/ui/print-controls';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { invoiceService, type InvoicePayPayload } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { CONFIG } from '@/config/constants';
import { currencySuffix, formatCurrency, formatDateTime } from '@/lib/utils';
import type { PaymentMethod } from '@/types/models';
import { INVOICE_STATUS_VARIANT } from './InvoiceListPage';

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'banking', 'e-wallet'];

/**
 * The receipt.
 *
 * It doubles as the payment screen because that is how the counter works: the
 * cashier has the bill on screen, the patient hands over money against it, and
 * the same page prints. `@media print` in index.css strips the app chrome, so
 * Print produces the receipt alone with no separate print route to keep in sync.
 *
 * The A4 / 80mm choice keeps that arrangement: both come off this same markup,
 * re-flowed by the print rules, so a counter on a till roll and an office on a
 * laser are never reading two receipts that can disagree.
 */
export default function InvoiceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const can = useAuthStore(state => state.can);

  const [payOpen, setPayOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payReference, setPayReference] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  // The footer stamp is taken once, when the bill is opened, so it does not
  // tick over while the cashier is looking at the screen.
  const [openedAt] = useState(() => new Date().toISOString());

  const {
    data: invoice,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['invoice', id],
    enabled: !!id,
    queryFn: () => invoiceService.getById(id!)
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  };

  const { mutateAsync: pay, isPending: paying } = useMutation({
    mutationFn: (payload: InvoicePayPayload) => invoiceService.pay(id!, payload),
    onSuccess: () => {
      invalidate();
      toast.success(t('invoices.detail.toast.paid'));
      setPayOpen(false);
      setPayAmount('');
    },
    onError: (mutationError: Error) =>
      toast.error(mutationError.message || t('invoices.detail.toast.payFailed'))
  });

  const { mutateAsync: cancelInvoice, isPending: cancelling } = useMutation({
    mutationFn: () => invoiceService.cancel(id!, cancelReason.trim() || null),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['billable-lines'] });
      toast.success(t('invoices.detail.toast.cancelled'));
      setCancelOpen(false);
    },
    onError: (mutationError: Error) =>
      toast.error(mutationError.message || t('invoices.detail.toast.cancelFailed'))
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">
          {(error as Error)?.message ?? t('invoices.detail.notFound')}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/billing/invoices')}>
          {t('invoices.back')}
        </Button>
      </Card>
    );
  }

  const balance = Number(invoice.netAmount) - Number(invoice.paidAmount);
  const settled = invoice.invoiceStatus === 'paid';
  const voided = invoice.invoiceStatus === 'cancelled' || invoice.invoiceStatus === 'refunded';

  /*
   * The bill prints in two banded sections, services then medicine.
   *
   * They arrive as two collections because they draw down different things — a
   * service against a schedule, a medicine against a batch — and that is the
   * split everyone at the counter asks about: what was done, then what was
   * dispensed. Keeping the two banded costs a heading and answers the question
   * without anyone having to add the lines up themselves. A section with
   * nothing in it is dropped rather than printed empty, and the heading names
   * the kind, so the lines beneath it no longer repeat it. Medicine quantities
   * are in base units, matching the batch each row drew down.
   */
  const groups = [
    {
      key: 'service',
      title: t('invoices.detail.services'),
      rows: (invoice.invoiceDetails ?? []).map(line => ({
        key: `service-${line.id}`,
        name: line.service?.serviceName ?? `#${line.serviceId}`,
        note: line.employee?.fullName ?? null,
        batch: null,
        remarks: line.orderRemarks,
        qty: line.qty,
        price: line.servicePrice,
        amount: line.totalAmount
      }))
    },
    {
      key: 'medicine',
      title: t('invoices.detail.medicine'),
      rows: (invoice.pharmacySaleDetails ?? []).map(line => ({
        key: `medicine-${line.id}`,
        name:
          line.itemStoreMap?.item?.itemName ??
          t('invoices.detail.unnamedItem', { id: line.itemStoreMapId }),
        note: null,
        // Carried as its own field, not folded into the note, so the roll can
        // drop it without taking anything else with it.
        batch: line.itemBatch?.batchNo
          ? t('invoices.detail.batch', { number: line.itemBatch.batchNo })
          : null,
        remarks: line.orderRemarks,
        qty: line.qty,
        price: line.itemPrice,
        amount: line.totalAmount
      }))
    }
  ].filter(group => group.rows.length > 0);

  return (
    <>
      <div
        className="mb-4 flex flex-wrap items-start justify-between gap-3"
        data-print-hide
      >
        <div className="flex items-start gap-3">
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
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <span className="font-mono">{invoice.invoiceNo}</span>
              <Badge variant={INVOICE_STATUS_VARIANT[invoice.invoiceStatus] ?? 'secondary'}>
                {t(`invoices.status.${invoice.invoiceStatus}`)}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('invoices.detail.billedOn', { date: formatDateTime(invoice.invoiceDate) })}
              {invoice.createdUser
                ? ` ${t('invoices.detail.billedBy', { user: invoice.createdUser.username })}`
                : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrintControls />
          {!settled && !voided && can('update-invoice') && (
            <Button
              onClick={() => {
                setPayAmount(String(balance));
                setPayOpen(true);
              }}
            >
              <Wallet className="h-4 w-4" />
              {t('invoices.detail.takePayment')}
            </Button>
          )}
          {/* Refunding is only meaningful once money has actually changed
              hands; an unpaid bill is cancelled instead. */}
          {!voided && Number(invoice.paidAmount) > 0 && can('create-refund-invoice') && (
            <Button variant="outline" onClick={() => navigate(`/billing/invoices/${id}/refund`)}>
              <Undo2 className="h-4 w-4" />
              {t('invoices.detail.refund')}
            </Button>
          )}
          {!voided && can('update-invoice') && (
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              <Ban className="h-4 w-4" />
              {t('common.action.cancel')}
            </Button>
          )}
        </div>
      </div>

      {/*
        The receipt itself — the only thing that survives printing, and the one
        block the format picker re-flows.

        Its sections are marked with data attributes rather than laid out with
        responsive classes, because `sm:` keys off the browser window and the
        80mm preview is a narrow box inside a wide one: those utilities would
        keep the two-column sheet layout at 80mm and the preview would be a
        lie. index.css drives the layout off the chosen format instead, so what
        is on screen is what comes out of the printer.
      */}
      <Card data-receipt className="mx-auto p-6">
        <header data-receipt-head className="border-b pb-4">
          <div>
            <p data-receipt-brand className="text-lg font-semibold tracking-tight">
              {CONFIG.appName}
            </p>
            {CONFIG.appAddress && (
              <p className="text-xs text-muted-foreground">{CONFIG.appAddress}</p>
            )}
            {CONFIG.appPhone && (
              <p className="text-xs text-muted-foreground">
                {t('invoices.detail.phone', { number: CONFIG.appPhone })}
              </p>
            )}
          </div>
          <p data-receipt-title className="text-sm font-semibold uppercase tracking-widest">
            {t('invoices.detail.receiptTitle')}
          </p>
        </header>

        {/* Label/value rows read the same at 80mm and at 210mm; the sheet only
            sets them in two columns. */}
        <dl data-receipt-meta className="border-b py-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t('invoices.detail.meta.invoiceNo')}</dt>
            <dd className="font-mono font-medium">{invoice.invoiceNo}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('invoices.detail.meta.date')}</dt>
            <dd>{formatDateTime(invoice.invoiceDate)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('invoices.detail.patient')}</dt>
            <dd>{invoice.patient?.patientName ?? t('invoices.detail.walkIn')}</dd>
          </div>
          {invoice.patient?.patientNo && (
            <div>
              <dt className="text-muted-foreground">{t('invoices.detail.meta.patientNo')}</dt>
              <dd className="font-mono">{invoice.patient.patientNo}</dd>
            </div>
          )}
          {invoice.patient?.phoneNo && (
            <div>
              <dt className="text-muted-foreground">{t('invoices.detail.meta.patientPhone')}</dt>
              <dd>{invoice.patient.phoneNo}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">{t('invoices.detail.visit')}</dt>
            <dd className="font-mono">{invoice.visit?.visitCode ?? '-'}</dd>
          </div>
          {invoice.order && (
            <div>
              <dt className="text-muted-foreground">{t('invoices.detail.meta.orderNo')}</dt>
              <dd className="font-mono">{invoice.order.orderNo}</dd>
            </div>
          )}
          {invoice.createdUser && (
            <div>
              <dt className="text-muted-foreground">{t('invoices.detail.meta.cashier')}</dt>
              <dd>{invoice.createdUser.username}</dd>
            </div>
          )}
        </dl>

        <table data-receipt-items className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th data-col="no" className="py-2 font-medium">
                {t('invoices.detail.header.no')}
              </th>
              <th className="py-2 font-medium">{t('invoices.detail.header.item')}</th>
              <th data-col="qty" className="py-2 text-right font-medium">
                {t('invoices.detail.header.qty')}
              </th>
              <th data-col="price" className="py-2 text-right font-medium">
                {t('invoices.detail.header.price')}
              </th>
              <th data-col="amount" className="py-2 text-right font-medium">
                {t('invoices.detail.header.amount')}
              </th>
            </tr>
          </thead>
          {/* One tbody per section: the grouping is in the markup rather than
              in a run of heading rows, so a page break lands between sections
              and a screen reader is told where each one starts and ends.
              Numbering restarts per section — it counts what is in that
              section, which is the only thing anyone counts it for. */}
          {groups.map(group => (
            <tbody key={group.key}>
              <tr data-group-head>
                <td
                  data-col="group"
                  colSpan={5}
                  className="pt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {group.title}
                </td>
              </tr>
              {group.rows.map((row, index) => (
                <tr key={row.key} className="border-b align-top last:border-b-0">
                  <td data-col="no" className="py-2 tabular-nums text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="py-2">
                    <span className="block">{row.name}</span>
                    {(row.note || row.batch) && (
                      <span className="block text-xs text-muted-foreground">
                        {row.note}
                        {/* Which batch was drawn down is for whoever
                            reconciles the stock against the filed sheet, not
                            for the patient holding the slip. */}
                        {row.batch && (
                          <span data-line-batch>
                            {row.note ? ' · ' : ''}
                            {row.batch}
                          </span>
                        )}
                      </span>
                    )}
                    {row.remarks && (
                      <span className="block text-xs italic text-muted-foreground">
                        {row.remarks}
                      </span>
                    )}
                  </td>
                  <td data-col="qty" className="py-2 text-right tabular-nums">
                    {row.qty}
                  </td>
                  <td data-col="price" className="py-2 text-right tabular-nums">
                    {formatCurrency(row.price, { withUnit: false })}
                  </td>
                  <td data-col="amount" className="py-2 text-right tabular-nums">
                    {formatCurrency(row.amount, { withUnit: false })}
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
          {groups.length === 0 && (
            <tbody>
              <tr>
                <td data-col="empty" colSpan={5} className="py-6 text-center text-muted-foreground">
                  {t('invoices.detail.noLines')}
                </td>
              </tr>
            </tbody>
          )}
        </table>

        {/* The line columns drop the currency to stay narrow, so it is named
            once on the subtotal and carried by every figure above it. */}
        <dl data-receipt-totals className="mt-4 space-y-1.5 border-t pt-4 text-sm">
          <div>
            <dt className="text-muted-foreground">
              {t('invoices.detail.subtotalIn', { currency: currencySuffix() })}
            </dt>
            <dd className="tabular-nums">{formatCurrency(invoice.subTotal, { withUnit: false })}</dd>
          </div>
          {Number(invoice.percentageDiscountAmount) > 0 && (
            <div>
              <dt className="text-muted-foreground">
                {t('invoices.detail.discountPercent', { rate: invoice.percentageDiscount ?? 0 })}
              </dt>
              <dd className="tabular-nums">
                −{formatCurrency(invoice.percentageDiscountAmount, { withUnit: false })}
              </dd>
            </div>
          )}
          {Number(invoice.amountDiscount) > 0 && (
            <div>
              <dt className="text-muted-foreground">{t('invoices.detail.discount')}</dt>
              <dd className="tabular-nums">
                −{formatCurrency(invoice.amountDiscount, { withUnit: false })}
              </dd>
            </div>
          )}
          {Number(invoice.taxAmount ?? 0) > 0 && (
            <div>
              <dt className="text-muted-foreground">
                {t('invoices.detail.tax', { rate: invoice.tax ?? 0 })}
              </dt>
              <dd className="tabular-nums">
                {formatCurrency(invoice.taxAmount, { withUnit: false })}
              </dd>
            </div>
          )}
          <div data-total="net" className="border-t pt-1.5 text-base font-semibold">
            <dt>{t('invoices.detail.netAmount')}</dt>
            <dd className="tabular-nums">{formatCurrency(invoice.netAmount)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              {t('invoices.detail.paidBy', {
                method: t(`common.paymentMethod.${invoice.paidBy}`)
              })}
            </dt>
            <dd className="tabular-nums">
              {formatCurrency(invoice.paidAmount, { withUnit: false })}
            </dd>
          </div>
          {Number(invoice.changeAmount) > 0 && (
            <div>
              <dt className="text-muted-foreground">{t('invoices.detail.change')}</dt>
              <dd className="tabular-nums">
                {formatCurrency(invoice.changeAmount, { withUnit: false })}
              </dd>
            </div>
          )}
          {balance > 0 && !voided && (
            <div className="font-medium text-destructive">
              <dt>{t('invoices.detail.balanceOwing')}</dt>
              <dd className="tabular-nums">{formatCurrency(balance)}</dd>
            </div>
          )}
          {invoice.transactionNo && (
            <div>
              <dt className="text-muted-foreground">{t('invoices.detail.meta.transactionNo')}</dt>
              <dd className="font-mono">{invoice.transactionNo}</dd>
            </div>
          )}
        </dl>

        {voided && (
          <p
            data-receipt-void
            className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive"
          >
            {t('invoices.detail.voided', {
              status: t(`invoices.status.${invoice.invoiceStatus}`)
            })}
          </p>
        )}

        <footer
          data-receipt-foot
          className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground"
        >
          <p>{t('invoices.detail.thanks')}</p>
          <p className="mt-1">
            {t('invoices.detail.printedAt', { date: formatDateTime(openedAt) })}
          </p>

          {/* A signature line only means something on a sheet that gets filed;
              a till roll handed across the counter has nowhere to put one. */}
          <div data-receipt-signatures className="mt-12 flex justify-between gap-8">
            <span className="w-44 border-t pt-1">{t('invoices.detail.signature.cashier')}</span>
            <span className="w-44 border-t pt-1">{t('invoices.detail.signature.received')}</span>
          </div>
        </footer>
      </Card>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('invoices.detail.payModal.title')}</DialogTitle>
            <DialogDescription>
              {t('invoices.detail.payModal.description', {
                amount: formatCurrency(balance),
                number: invoice.invoiceNo
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label={t('invoices.detail.payModal.amount')} htmlFor="payAmount" required>
              <MoneyInput
                id="payAmount"
                value={payAmount}
                onChange={event => setPayAmount(event.target.value)}
              />
            </Field>

            <Field label={t('invoices.detail.payModal.paidBy')} htmlFor="payMethod" required>
              <NativeSelect
                id="payMethod"
                value={payMethod}
                onChange={event => setPayMethod(event.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>
                    {t(`common.paymentMethod.${method}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            {payMethod !== 'cash' && (
              <Field label={t('invoices.detail.payModal.reference')} htmlFor="payReference">
                <Input
                  id="payReference"
                  value={payReference}
                  onChange={event => setPayReference(event.target.value)}
                />
              </Field>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)} disabled={paying}>
              {t('common.action.cancel')}
            </Button>
            <Button
              disabled={paying || !(Number(payAmount) > 0)}
              onClick={() =>
                void pay({
                  paidAmount: String(Number(payAmount)),
                  paidBy: payMethod,
                  transactionNo: payReference.trim() || null
                })
              }
            >
              {paying && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('invoices.detail.payModal.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('invoices.detail.cancelModal.title')}</DialogTitle>
            <DialogDescription>
              {t('invoices.detail.cancelModal.description', { number: invoice.invoiceNo })}
            </DialogDescription>
          </DialogHeader>

          <Field label={t('common.label.reason')} htmlFor="cancelReason">
            <Textarea
              id="cancelReason"
              value={cancelReason}
              onChange={event => setCancelReason(event.target.value)}
            />
          </Field>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>
              {t('invoices.detail.cancelModal.keep')}
            </Button>
            <Button variant="destructive" disabled={cancelling} onClick={() => void cancelInvoice()}>
              {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('invoices.detail.cancelModal.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
