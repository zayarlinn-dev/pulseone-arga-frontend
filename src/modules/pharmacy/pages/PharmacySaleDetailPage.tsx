import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Ban, Loader2, Wallet } from 'lucide-react';
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
import { pharmacySaleService, type InvoicePayPayload } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { CONFIG } from '@/config/constants';
import { currencySuffix, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { PaymentMethod } from '@/types/models';
import { SALE_STATUS_VARIANT } from './PharmacySaleListPage';

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'banking', 'e-wallet'];

/**
 * The dispensing receipt.
 *
 * It lists the batch each packet came from, which is what a recall or a return
 * is traced through — and why one medicine can appear on two lines when it was
 * filled from two batches. The batch is the one thing the 80mm copy leaves off:
 * it is for the filed sheet and the stock count, not for the patient.
 *
 * Like the bill, it prints from the route it is read on and comes off either an
 * A4 sheet or a till roll, both re-flowed from this same markup by the print
 * rules in index.css — there is no second receipt to keep in step with it.
 */
export default function PharmacySaleDetailPage() {
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
  // Taken once, when the slip is opened, so the footer does not tick over
  // while the counter is looking at it.
  const [openedAt] = useState(() => new Date().toISOString());

  const {
    data: sale,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['pharmacy-sale', id],
    enabled: !!id,
    queryFn: () => pharmacySaleService.getById(id!)
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['pharmacy-sale', id] });
    queryClient.invalidateQueries({ queryKey: ['pharmacy-sales'] });
  };

  const { mutateAsync: pay, isPending: paying } = useMutation({
    mutationFn: (payload: InvoicePayPayload) => pharmacySaleService.pay(id!, payload),
    onSuccess: () => {
      invalidate();
      toast.success(t('pharmacy.saleDetail.toast.paid'));
      setPayOpen(false);
    },
    onError: (mutationError: Error) =>
      toast.error(mutationError.message || t('pharmacy.saleDetail.toast.payFailed'))
  });

  const { mutateAsync: cancelSale, isPending: cancelling } = useMutation({
    mutationFn: () => pharmacySaleService.cancel(id!, cancelReason.trim() || null),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
      toast.success(t('pharmacy.saleDetail.toast.cancelled'));
      setCancelOpen(false);
    },
    onError: (mutationError: Error) =>
      toast.error(mutationError.message || t('pharmacy.saleDetail.toast.cancelFailed'))
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !sale) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">
          {(error as Error)?.message ?? t('pharmacy.saleDetail.notFound')}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/pharmacy/sales')}>
          {t('pharmacy.saleDetail.back')}
        </Button>
      </Card>
    );
  }

  const balance = Number(sale.issuedBalance) - Number(sale.paidAmount);
  const settled = sale.issuedStatus === 'paid';
  const voided = sale.issuedStatus === 'cancelled' || sale.issuedStatus === 'refunded';
  const lines = sale.pharmacySaleDetails ?? [];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3" data-print-hide>
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 h-8 w-8"
            onClick={() => navigate('/pharmacy/sales')}
            aria-label={t('pharmacy.saleDetail.back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
              <span className="font-mono">{sale.pharmacySaleNo}</span>
              <Badge variant={SALE_STATUS_VARIANT[sale.issuedStatus] ?? 'secondary'}>
                {t(`pharmacy.sales.status.${sale.issuedStatus}`)}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('pharmacy.saleDetail.dispensedOn', {
                date: formatDateTime(sale.issuedDate)
              })}
              {sale.createdUser
                ? ` ${t('pharmacy.saleDetail.dispensedBy', { user: sale.createdUser.username })}`
                : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PrintControls />
          {!settled && !voided && can('update-pharmacy-sale') && (
            <Button
              onClick={() => {
                setPayAmount(String(balance));
                setPayOpen(true);
              }}
            >
              <Wallet className="h-4 w-4" />
              {t('pharmacy.saleDetail.takePayment')}
            </Button>
          )}
          {!voided && can('update-pharmacy-sale') && (
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              <Ban className="h-4 w-4" />
              {t('common.action.cancel')}
            </Button>
          )}
        </div>
      </div>

      {/*
        The receipt itself — the only thing that survives printing, and the one
        block the format picker re-flows. Same construction as the bill: the
        sections are marked with data attributes and laid out by index.css from
        the chosen format, because `sm:` keys off the browser window and the
        80mm preview is a narrow box inside a wide one.
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
                {t('pharmacy.saleDetail.phone', { number: CONFIG.appPhone })}
              </p>
            )}
          </div>
          <p data-receipt-title className="text-sm font-semibold uppercase tracking-widest">
            {t('pharmacy.saleDetail.receiptTitle')}
          </p>
        </header>

        <dl data-receipt-meta className="border-b py-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t('pharmacy.saleDetail.meta.saleNo')}</dt>
            <dd className="font-mono font-medium">{sale.pharmacySaleNo}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('pharmacy.saleDetail.meta.date')}</dt>
            <dd>{formatDateTime(sale.issuedDate)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('pharmacy.saleDetail.patient')}</dt>
            <dd>{sale.patient?.patientName ?? '-'}</dd>
          </div>
          {sale.patient?.patientNo && (
            <div>
              <dt className="text-muted-foreground">{t('pharmacy.saleDetail.meta.patientNo')}</dt>
              <dd className="font-mono">{sale.patient.patientNo}</dd>
            </div>
          )}
          {sale.patient?.phoneNo && (
            <div>
              <dt className="text-muted-foreground">
                {t('pharmacy.saleDetail.meta.patientPhone')}
              </dt>
              <dd>{sale.patient.phoneNo}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">{t('pharmacy.saleDetail.prescribedBy')}</dt>
            <dd>{sale.employee?.fullName ?? t('pharmacy.saleDetail.overTheCounter')}</dd>
          </div>
          {sale.visit && (
            <div>
              <dt className="text-muted-foreground">{t('pharmacy.saleDetail.visit')}</dt>
              <dd className="font-mono">{sale.visit.visitCode}</dd>
            </div>
          )}
          {sale.createdUser && (
            <div>
              <dt className="text-muted-foreground">
                {t('pharmacy.saleDetail.meta.dispensedBy')}
              </dt>
              <dd>{sale.createdUser.username}</dd>
            </div>
          )}
        </dl>

        <table data-receipt-items className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th data-col="no" className="py-2 font-medium">
                {t('pharmacy.saleDetail.header.no')}
              </th>
              <th className="py-2 font-medium">{t('pharmacy.saleDetail.header.item')}</th>
              <th data-col="qty" className="py-2 text-right font-medium">
                {t('pharmacy.saleDetail.header.qty')}
              </th>
              <th data-col="price" className="py-2 text-right font-medium">
                {t('pharmacy.saleDetail.header.price')}
              </th>
              <th data-col="amount" className="py-2 text-right font-medium">
                {t('pharmacy.saleDetail.header.amount')}
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.id} className="border-b align-top last:border-b-0">
                <td data-col="no" className="py-2 tabular-nums text-muted-foreground">
                  {index + 1}
                </td>
                <td className="py-2">
                  <span className="block">
                    {line.itemStoreMap?.item?.itemName ??
                      t('pharmacy.saleDetail.unnamedItem', { id: line.itemStoreMapId })}
                  </span>
                  {/* Which batch a packet came from is what a recall or a
                      return is traced through, so it belongs on the sheet that
                      gets filed — not on the slip handed across the counter.
                      The expiry stays on both: that one is the patient's. */}
                  {line.itemBatch?.batchNo && (
                    <span data-line-batch className="block font-mono text-xs text-muted-foreground">
                      {t('pharmacy.saleDetail.batch', { number: line.itemBatch.batchNo })}
                    </span>
                  )}
                  {line.itemBatch?.expiryDate && (
                    <span className="block text-xs text-muted-foreground">
                      {t('pharmacy.saleDetail.expiry', {
                        date: formatDate(line.itemBatch.expiryDate)
                      })}
                    </span>
                  )}
                  {line.orderRemarks && (
                    <span className="block text-xs italic text-muted-foreground">
                      {line.orderRemarks}
                    </span>
                  )}
                </td>
                <td data-col="qty" className="py-2 text-right tabular-nums">
                  {line.qty}
                </td>
                <td data-col="price" className="py-2 text-right tabular-nums">
                  {formatCurrency(line.itemPrice, { withUnit: false })}
                </td>
                <td data-col="amount" className="py-2 text-right tabular-nums">
                  {formatCurrency(line.totalAmount, { withUnit: false })}
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr>
                <td data-col="empty" colSpan={5} className="py-6 text-center text-muted-foreground">
                  {t('pharmacy.saleDetail.noLines')}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* The line columns drop the currency to stay narrow, so it is named
            once on the subtotal and carried by every figure above it. */}
        <dl data-receipt-totals className="mt-4 space-y-1.5 border-t pt-4 text-sm">
          <div>
            <dt className="text-muted-foreground">
              {t('pharmacy.saleDetail.subtotalIn', { currency: currencySuffix() })}
            </dt>
            <dd className="tabular-nums">{formatCurrency(sale.subTotal, { withUnit: false })}</dd>
          </div>
          {Number(sale.percentageDiscountAmount) > 0 && (
            <div>
              <dt className="text-muted-foreground">
                {t('pharmacy.saleDetail.discountPercent', { rate: sale.percentageDiscount ?? 0 })}
              </dt>
              <dd className="tabular-nums">
                −{formatCurrency(sale.percentageDiscountAmount, { withUnit: false })}
              </dd>
            </div>
          )}
          {Number(sale.amountDiscount) > 0 && (
            <div>
              <dt className="text-muted-foreground">{t('pharmacy.saleDetail.discount')}</dt>
              <dd className="tabular-nums">
                −{formatCurrency(sale.amountDiscount, { withUnit: false })}
              </dd>
            </div>
          )}
          {Number(sale.taxAmount ?? 0) > 0 && (
            <div>
              <dt className="text-muted-foreground">
                {t('pharmacy.saleDetail.tax', { rate: sale.tax ?? 0 })}
              </dt>
              <dd className="tabular-nums">
                {formatCurrency(sale.taxAmount, { withUnit: false })}
              </dd>
            </div>
          )}
          <div data-total="net" className="border-t pt-1.5 text-base font-semibold">
            <dt>{t('pharmacy.saleDetail.netAmount')}</dt>
            <dd className="tabular-nums">{formatCurrency(sale.issuedBalance)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              {t('pharmacy.saleDetail.paidBy', {
                method: t(`common.paymentMethod.${sale.paidBy}`)
              })}
            </dt>
            <dd className="tabular-nums">{formatCurrency(sale.paidAmount, { withUnit: false })}</dd>
          </div>
          {Number(sale.changeAmount) > 0 && (
            <div>
              <dt className="text-muted-foreground">{t('pharmacy.saleDetail.change')}</dt>
              <dd className="tabular-nums">
                {formatCurrency(sale.changeAmount, { withUnit: false })}
              </dd>
            </div>
          )}
          {balance > 0 && !voided && (
            <div className="font-medium text-destructive">
              <dt>{t('pharmacy.saleDetail.balanceOwing')}</dt>
              <dd className="tabular-nums">{formatCurrency(balance)}</dd>
            </div>
          )}
          {sale.transactionNo && (
            <div>
              <dt className="text-muted-foreground">
                {t('pharmacy.saleDetail.meta.transactionNo')}
              </dt>
              <dd className="font-mono">{sale.transactionNo}</dd>
            </div>
          )}
        </dl>

        {voided && (
          <p
            data-receipt-void
            className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive"
          >
            {t('pharmacy.saleDetail.voided', {
              status: t(`pharmacy.sales.status.${sale.issuedStatus}`)
            })}
          </p>
        )}

        <footer
          data-receipt-foot
          className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground"
        >
          <p>{t('pharmacy.saleDetail.thanks')}</p>
          <p className="mt-1">
            {t('pharmacy.saleDetail.printedAt', { date: formatDateTime(openedAt) })}
          </p>

          {/* A signature line only means something on a sheet that gets filed;
              a till roll handed across the counter has nowhere to put one. */}
          <div data-receipt-signatures className="mt-12 flex justify-between gap-8">
            <span className="w-44 border-t pt-1">
              {t('pharmacy.saleDetail.signature.pharmacist')}
            </span>
            <span className="w-44 border-t pt-1">
              {t('pharmacy.saleDetail.signature.received')}
            </span>
          </div>
        </footer>
      </Card>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pharmacy.saleDetail.payModal.title')}</DialogTitle>
            <DialogDescription>
              {t('pharmacy.saleDetail.payModal.description', {
                amount: formatCurrency(balance),
                number: sale.pharmacySaleNo
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field
              label={t('pharmacy.saleDetail.payModal.amount')}
              htmlFor="payAmount"
              required
            >
              <MoneyInput
                id="payAmount"
                value={payAmount}
                onChange={event => setPayAmount(event.target.value)}
              />
            </Field>

            <Field
              label={t('pharmacy.saleDetail.payModal.paidBy')}
              htmlFor="payMethod"
              required
            >
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
              <Field label={t('pharmacy.saleDetail.payModal.reference')} htmlFor="payReference">
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
              {t('pharmacy.saleDetail.payModal.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('pharmacy.saleDetail.cancelModal.title')}</DialogTitle>
            <DialogDescription>
              {t('pharmacy.saleDetail.cancelModal.description', {
                number: sale.pharmacySaleNo
              })}
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
              {t('pharmacy.saleDetail.cancelModal.keep')}
            </Button>
            <Button variant="destructive" disabled={cancelling} onClick={() => void cancelSale()}>
              {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('pharmacy.saleDetail.cancelModal.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
