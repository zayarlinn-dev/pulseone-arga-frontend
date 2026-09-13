import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
import { NativeSelect } from '@/components/ui/native-select';
import { PatientSearchSelect } from '@/components/shared/PatientSearchSelect';
import { useEntityOptions } from '@/hooks/api/useEntityOptions';
import {
  returnPharmacySaleService,
  type ReturnPharmacySaleCreatePayload
} from '@/services';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Patient, ReturnableLine, ReturnPaymentMethod } from '@/types/models';

// This endpoint's enum is capitalised, unlike every other paid_by column in the
// schema. It is a legacy quirk, not a typo — lower case is rejected.
const PAYMENT_METHODS: ReturnPaymentMethod[] = ['Cash', 'Banking', 'E-Wallet'];

/**
 * The returns counter: medicine handed back against the sale that dispensed it.
 *
 * Every packet goes back into the batch it came from, so the quantity is capped
 * by what is left after any refunds of the same line through billing.
 */
export default function ReturnPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /** Matches the `lg` breakpoint the two-column layout is built around. */
  const isWide = useMediaQuery('(min-width: 1024px)');
  /** Only reachable below lg, where the summary is a sheet rather than a column. */
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [returnReasonId, setReturnReasonId] = useState('');
  const [paidBy, setPaidBy] = useState<ReturnPaymentMethod>('Cash');
  const [transactionNo, setTransactionNo] = useState('');

  const reasons = useEntityOptions('Return Reason');

  const { data: lines = [], isLoading } = useQuery({
    queryKey: ['returnable-lines', patient?.id],
    enabled: !!patient,
    queryFn: () => returnPharmacySaleService.getReturnableLines(patient!.id)
  });

  const returnable = useMemo(() => lines.filter(line => line.returnableQty > 0), [lines]);

  const qtyFor = (line: ReturnableLine) =>
    Number(quantities[line.pharmacySaleDetailId] ?? '0') || 0;

  const amountFor = (line: ReturnableLine) => {
    const qty = qtyFor(line);
    if (qty <= 0 || line.soldQty <= 0) return 0;
    return Math.round((Number(line.totalAmount) * qty * 100) / line.soldQty) / 100;
  };

  const selected = returnable.filter(line => qtyFor(line) > 0);
  /** Units across every selected line — shown beside the line count. */
  const selectedUnits: number = selected.reduce((sum, line) => sum + qtyFor(line), 0);
  const total = Math.round(selected.reduce((sum, line) => sum + amountFor(line), 0) * 100) / 100;
  const overQty = returnable.filter(line => qtyFor(line) > line.returnableQty);

  // Keeps a retry after a dropped connection from posting the document
  // twice. Reset on success so the next one is not answered from this one.
  const idempotency = useSubmissionKey('pharmacy-return');

  const { mutateAsync: recordReturn, isPending: saving } = useMutation({
    mutationFn: (payload: ReturnPharmacySaleCreatePayload) =>
      returnPharmacySaleService.create(payload, idempotency.keyFor(payload)),
    onSuccess: () => {
      idempotency.reset();
      queryClient.invalidateQueries({ queryKey: ['pharmacy-returns'] });
      queryClient.invalidateQueries({ queryKey: ['returnable-lines'] });
      queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
      toast.success(t('pharmacy.returnForm.toast.recorded'));
      navigate('/pharmacy/returns');
    },
    onError: (error: Error) =>
      toast.error(error.message || t('pharmacy.returnForm.toast.failed'))
  });

  const handleSubmit = () => {
    if (!patient) return toast.error(t('pharmacy.returnForm.toast.selectPatient'));
    if (!returnReasonId) return toast.error(t('pharmacy.returnForm.toast.selectReason'));
    if (selected.length === 0) return toast.error(t('pharmacy.returnForm.toast.enterQty'));
    if (overQty.length > 0) return toast.error(t('pharmacy.returnForm.toast.overQty'));

    return recordReturn({
      patientId: patient.id,
      returnReasonId: Number(returnReasonId),
      paidBy,
      transactionNo: transactionNo.trim() || null,
      returnPharmacySaleDetails: selected.map(line => ({
        pharmacySaleDetailId: line.pharmacySaleDetailId,
        returnQty: qtyFor(line)
      }))
    });
  };

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
        {t('pharmacy.returnForm.summary')}
      </p>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {t('pharmacy.returnForm.lines')}
            <Badge variant="secondary" className="ml-2">
              {selected.length}
            </Badge>
          </dt>
          <dd className="tabular-nums">
            {t('pharmacy.returnForm.units', { count: selectedUnits })}
          </dd>
        </div>
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>{t('pharmacy.returnForm.amountBack')}</dt>
          <dd className="tabular-nums">{formatCurrency(total)}</dd>
        </div>
      </dl>

      {overQty.length > 0 && (
        <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {t('pharmacy.returnForm.overQty')}
        </p>
      )}

      <div className="mt-4 space-y-2 border-t pt-4">
        <Field
          label={t('pharmacy.returnForm.reason')}
          htmlFor="returnReasonId"
          required
          hint={
            reasons.categoryMissing
              ? t('pharmacy.returnForm.noReasonCategory')
              : undefined
          }
        >
          <NativeSelect
            id="returnReasonId"
            value={returnReasonId}
            disabled={reasons.isLoading || reasons.categoryMissing}
            onChange={event => setReturnReasonId(event.target.value)}
          >
            <option value="">
              {reasons.isLoading
                ? t('common.label.loading')
                : t('pharmacy.returnForm.selectReason')}
            </option>
            {reasons.options.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label={t('pharmacy.returnForm.refundedBy')} htmlFor="paidBy" required>
          <NativeSelect
            id="paidBy"
            value={paidBy}
            onChange={event => setPaidBy(event.target.value as ReturnPaymentMethod)}
          >
            {PAYMENT_METHODS.map(method => (
              <option key={method} value={method}>
                {t(`common.returnPaymentMethod.${method}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>

        {paidBy !== 'Cash' && (
          <Field label={t('pharmacy.returnForm.transactionRef')} htmlFor="transactionNo">
            <Input
              id="transactionNo"
              value={transactionNo}
              onChange={event => setTransactionNo(event.target.value)}
            />
          </Field>
        )}
      </div>

      <Button
        className="mt-4 w-full"
        disabled={saving || selected.length === 0 || overQty.length > 0}
        onClick={() => void handleSubmit()}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
        {t('pharmacy.returnForm.submit')}
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
          onClick={() => navigate('/pharmacy/returns')}
          aria-label={t('pharmacy.returnForm.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t('pharmacy.returnForm.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('pharmacy.returnForm.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* The bottom bar floats over the page, so the last row needs room. */}
        <div className="space-y-4 pb-20 lg:pb-0">
          <Card className="p-4">
            <Field label={t('pharmacy.returnForm.patient')} required>
              <PatientSearchSelect value={patient} onChange={setPatient} />
            </Field>
          </Card>

          <Card>
            <div className="border-b p-4">
              <p className="text-sm font-semibold">
                {t('pharmacy.returnForm.dispensedMedicine')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('pharmacy.returnForm.dispensedHint')}
              </p>
            </div>

            {!patient ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {t('pharmacy.returnForm.findPatient')}
              </p>
            ) : isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : returnable.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {t('pharmacy.returnForm.nothingOutstanding')}
              </p>
            ) : (
              returnable.map(line => {
                const qty = qtyFor(line);
                const tooMany = qty > line.returnableQty;

                return (
                  <div
                    key={line.pharmacySaleDetailId}
                    className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{line.itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{line.itemCode}</span>
                        {line.batchNo
                          ? ` · ${t('pharmacy.returnForm.batch', { number: line.batchNo })}`
                          : ''}
                        {line.pharmacySaleNo ? ` · ${line.pharmacySaleNo}` : ''} ·{' '}
                        {formatDate(line.orderDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('pharmacy.returnForm.canReturn', {
                          left: line.returnableQty,
                          sold: line.soldQty
                        })}
                        {line.returnedQty > 0
                          ? ` · ${t('pharmacy.returnForm.alreadyBack', {
                              count: line.returnedQty
                            })}`
                          : ''}
                      </p>
                    </div>

                    <div className="w-20 shrink-0">
                      <Input
                        value={quantities[line.pharmacySaleDetailId] ?? ''}
                        inputMode="numeric"
                        placeholder="0"
                        aria-label={t('pharmacy.returnForm.qtyAria', { item: line.itemName })}
                        className={tooMany ? 'border-destructive' : undefined}
                        onChange={event =>
                          setQuantities(current => ({
                            ...current,
                            [line.pharmacySaleDetailId]: event.target.value
                          }))
                        }
                      />
                    </div>

                    <div className="w-28 shrink-0 text-right">
                      <p className="text-sm font-medium tabular-nums">
                        {formatCurrency(amountFor(line))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('pharmacy.returnForm.ofTotal', {
                          amount: formatCurrency(line.totalAmount)
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
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
                {t('pharmacy.returnForm.summary')}
                <Badge variant="secondary">{selected.length}</Badge>
              </span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </Button>
          </div>

          <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
            <DialogContent className="max-w-lg">
              {/* The bar that opened the sheet already names it. */}
              <DialogHeader className="sr-only">
                <DialogTitle>{t('pharmacy.returnForm.summary')}</DialogTitle>
              </DialogHeader>
              {summary}
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
