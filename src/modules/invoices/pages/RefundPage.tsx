import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSubmissionKey } from '@/lib/idempotency';
import { ArrowLeft, Loader2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import {
  invoiceService,
  refundInvoiceService,
  type RefundInvoiceCreatePayload
} from '@/services';
import { formatCurrency } from '@/lib/utils';
import type { PaymentMethod, RefundableLine } from '@/types/models';

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'banking', 'e-wallet'];

/** A line's identity is whichever of the two ids it carries. */
const lineKey = (line: RefundableLine) =>
  line.invoiceDetailId ? `service-${line.invoiceDetailId}` : `medicine-${line.pharmacySaleDetailId}`;

/**
 * Refunds part or all of an invoice.
 *
 * The refund is per unit, not per line: a patient who was billed for three
 * dressings and only had one can have two given back. The amount follows
 * proportionally, and medicine refunded here goes back onto the shelf — which
 * is why the quantity cannot exceed what is left after any pharmacy-counter
 * returns of the same packet.
 */
export default function RefundPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /** Matches the `lg` breakpoint the two-column layout is built around. */
  const isWide = useMediaQuery('(min-width: 1024px)');
  /** Only reachable below lg, where the summary is a sheet rather than a column. */
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [paidBy, setPaidBy] = useState<PaymentMethod>('cash');
  const [transactionNo, setTransactionNo] = useState('');
  const [remarks, setRemarks] = useState('');

  const { data: invoice, isLoading: loadingInvoice } = useQuery({
    queryKey: ['invoice', id],
    enabled: !!id,
    queryFn: () => invoiceService.getById(id!)
  });

  const { data: lines = [], isLoading: loadingLines } = useQuery({
    queryKey: ['refundable-lines', id],
    enabled: !!id,
    queryFn: () => refundInvoiceService.getRefundableLines(id!)
  });

  const refundable = useMemo(() => lines.filter(line => line.refundableQty > 0), [lines]);

  const qtyFor = (line: RefundableLine) => Number(quantities[lineKey(line)] ?? '0') || 0;

  /** Refund amount follows the line's own total, pro rata by quantity. */
  const amountFor = (line: RefundableLine) => {
    const qty = qtyFor(line);
    if (qty <= 0 || line.soldQty <= 0) return 0;
    return Math.round((Number(line.totalAmount) * qty * 100) / line.soldQty) / 100;
  };

  const selected = refundable.filter(line => qtyFor(line) > 0);
  /** Units across every selected line — shown beside the line count. */
  const selectedUnits: number = selected.reduce((sum, line) => sum + qtyFor(line), 0);
  const total = Math.round(selected.reduce((sum, line) => sum + amountFor(line), 0) * 100) / 100;
  const overQty = refundable.filter(line => qtyFor(line) > line.refundableQty);

  // Keeps a retry after a dropped connection from posting the document
  // twice. Reset on success so the next one is not answered from this one.
  const idempotency = useSubmissionKey('refund');

  const { mutateAsync: refund, isPending: saving } = useMutation({
    mutationFn: (payload: RefundInvoiceCreatePayload) =>
      refundInvoiceService.create(payload, idempotency.keyFor(payload)),
    onSuccess: created => {
      idempotency.reset();
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['refundable-lines', id] });
      queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
      toast.success(t('refundForm.toast.recorded', { number: created.refundInvoiceNo }));
      navigate(`/billing/invoices/${id}`);
    },
    onError: (error: Error) => toast.error(error.message || t('refundForm.toast.failed'))
  });

  const handleSubmit = () => {
    if (selected.length === 0) return toast.error(t('refundForm.toast.enterQty'));
    if (overQty.length > 0) return toast.error(t('refundForm.toast.overQty'));

    return refund({
      invoiceId: Number(id),
      paidBy,
      transactionNo: transactionNo.trim() || null,
      refundRemarks: remarks.trim() || null,
      lines: selected.map(line => ({
        invoiceDetailId: line.invoiceDetailId,
        pharmacySaleDetailId: line.pharmacySaleDetailId,
        refundQty: qtyFor(line)
      }))
    });
  };

  if (loadingInvoice || loadingLines) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  /**
   * The figures and the button that commits the document.
   *
   * Named rather than written inline because below `lg` this is not a sidebar
   * at all. A phone stacks it under the lines, where it sits past however many
   * rows are on the document — so there it becomes a sheet raised from a fixed
   * bottom bar, the same arrangement the counter screen uses for its ticket.
   */
  const summary = (
    <>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Undo2 className="h-4 w-4" />
        {t('refundForm.summary')}
      </p>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t('refundForm.invoiceNet')}</dt>
          <dd className="tabular-nums">{formatCurrency(invoice?.netAmount ?? 0)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {t('refundForm.lines')}
            <Badge variant="secondary" className="ml-2">
              {selected.length}
            </Badge>
          </dt>
          <dd className="tabular-nums">
            {t('refundForm.units', { count: selectedUnits })}
          </dd>
        </div>
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>{t('refundForm.refundAmount')}</dt>
          <dd className="tabular-nums">{formatCurrency(total)}</dd>
        </div>
      </dl>

      {overQty.length > 0 && (
        <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {t('refundForm.overQty')}
        </p>
      )}

      <div className="mt-4 space-y-2 border-t pt-4">
        <Field label={t('refundForm.refundedBy')} htmlFor="paidBy" required>
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

        {paidBy !== 'cash' && (
          <Field label={t('refundForm.transactionRef')} htmlFor="transactionNo">
            <Input
              id="transactionNo"
              value={transactionNo}
              onChange={event => setTransactionNo(event.target.value)}
            />
          </Field>
        )}

        <Field label={t('refundForm.reason')} htmlFor="remarks">
          <Textarea
            id="remarks"
            rows={2}
            value={remarks}
            onChange={event => setRemarks(event.target.value)}
          />
        </Field>
      </div>

      <Button
        className="mt-4 w-full"
        disabled={saving || selected.length === 0 || overQty.length > 0}
        onClick={() => void handleSubmit()}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
        {t('refundForm.submit', { amount: formatCurrency(total) })}
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
          onClick={() => navigate(`/billing/invoices/${id}`)}
          aria-label={t('refundForm.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t('refundForm.title', { number: invoice?.invoiceNo ?? '' })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('refundForm.subtitle', {
              name: invoice?.patient?.patientName ?? t('refundForm.thisPatient')
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* The bottom bar floats over the page, so the last row needs room. */}
        <Card className="mb-20 lg:mb-0">
          <div className="border-b p-4">
            <p className="text-sm font-semibold">{t('refundForm.refundable')}</p>
            <p className="text-xs text-muted-foreground">
              {t('refundForm.refundableHint')}
            </p>
          </div>

          {refundable.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {lines.length === 0
                ? t('refundForm.nothingToRefund')
                : t('refundForm.allRefunded')}
            </p>
          ) : (
            <div>
              {refundable.map(line => {
                const key = lineKey(line);
                const qty = qtyFor(line);
                const tooMany = qty > line.refundableQty;

                return (
                  <div key={key} className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-medium">
                        {line.description}
                        <Badge variant={line.kind === 'medicine' ? 'info' : 'secondary'}>
                          {t(`refundForm.kind.${line.kind}`)}
                        </Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('refundForm.leftToRefund', {
                          left: line.refundableQty,
                          sold: line.soldQty
                        })}
                        {line.refundedQty > 0
                          ? ` · ${t('refundForm.alreadyRefunded', { count: line.refundedQty })}`
                          : ''}
                        {line.batchNo
                          ? ` · ${t('refundForm.batch', { number: line.batchNo })}`
                          : ''}
                      </p>
                    </div>

                    <div className="w-20 shrink-0">
                      <Input
                        value={quantities[key] ?? ''}
                        inputMode="numeric"
                        placeholder="0"
                        aria-label={t('refundForm.qtyAria', { item: line.description })}
                        className={tooMany ? 'border-destructive' : undefined}
                        onChange={event =>
                          setQuantities(current => ({ ...current, [key]: event.target.value }))
                        }
                      />
                    </div>

                    <div className="w-28 shrink-0 text-right">
                      <p className="text-sm font-medium tabular-nums">
                        {formatCurrency(amountFor(line))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('refundForm.ofTotal', {
                          amount: formatCurrency(line.totalAmount)
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between border-t px-4 py-2">
                <span className="text-xs text-muted-foreground">
                  {t('refundForm.refundEverything')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setQuantities(
                      Object.fromEntries(
                        refundable.map(line => [lineKey(line), String(line.refundableQty)])
                      )
                    )
                  }
                >
                  {t('refundForm.refundAll')}
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Mounted rather than hidden with a class: the summary carries `id`s
            its labels point at, and rendering it in both places at once would
            put every one of them in the document twice. */}
        {isWide && (
          <aside>
            <Card className="sticky top-20 p-4">{summary}</Card>
          </aside>
        )}
      </div>

      {!isWide && (
        <>
          {/* The mobile stand-in for the sidebar: what the document comes to,
              and the way through to the rest of it. */}
          <div data-print-hide className="fixed inset-x-0 bottom-0 z-30 border-t bg-card p-3">
            <Button
              className="h-14 w-full justify-between text-base"
              disabled={selected.length === 0}
              onClick={() => setSummaryOpen(true)}
            >
              <span className="flex items-center gap-2">
                <Undo2 className="h-5 w-5" />
                {t('refundForm.summary')}
                <Badge variant="secondary">{selected.length}</Badge>
              </span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </Button>
          </div>

          <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
            <DialogContent className="max-w-lg">
              {/* The bar that opened the sheet already names it. */}
              <DialogHeader className="sr-only">
                <DialogTitle>{t('refundForm.summary')}</DialogTitle>
              </DialogHeader>
              {summary}
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
