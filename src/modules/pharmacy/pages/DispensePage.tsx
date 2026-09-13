import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSubmissionKey } from '@/lib/idempotency';
import { ArrowLeft, Loader2, Pill, Plus, Trash2, Wallet } from 'lucide-react';
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
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { PatientSearchSelect } from '@/components/shared/PatientSearchSelect';
import { useDropdown } from '@/hooks/api/useDropdown';
import {
  counterSaleService,
  patientService,
  pharmacySaleService,
  type PharmacySaleCreatePayload,
  type StoreItem
} from '@/services';
import { formatCurrency } from '@/lib/utils';
import { conversionNote, formatQty, toSaleUnits } from '@/lib/uom';
import type { Patient, PaymentMethod } from '@/types/models';

const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'banking', 'e-wallet'];

const num = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const round2 = (value: number) => Math.round(value * 100) / 100;

interface DraftLine {
  key: number;
  itemId: string;
  /**
   * The unit this line is sold in. Blank means the item's own sale unit — a
   * box — which is what every line meant before items carried a unit list.
   */
  uomId: string;
  qty: string;
  percentageDiscount: string;
  orderRemarks: string;
}

const newLine = (key: number): DraftLine => ({
  key,
  itemId: '',
  uomId: '',
  qty: '1',
  percentageDiscount: '',
  orderRemarks: ''
});

/**
 * The pharmacy counter.
 *
 * Quantities are entered in the item's sale unit; the backend converts to base
 * units, picks the batches soonest-to-expire first, and refuses the whole sale
 * if any line cannot be filled — dispensing three of five boxes while charging
 * for five is worse than saying "not enough stock".
 */
export default function DispensePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const presetPatientId = searchParams.get('patientId');

  /** Matches the `lg` breakpoint the two-column layout is built around. */
  const isWide = useMediaQuery('(min-width: 1024px)');
  /** Only reachable below lg, where the summary is a sheet rather than a column. */
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [storeId, setStoreId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([newLine(0)]);
  const [percentageDiscount, setPercentageDiscount] = useState('');
  const [amountDiscount, setAmountDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [paidBy, setPaidBy] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [transactionNo, setTransactionNo] = useState('');

  const { data: stores = [] } = useDropdown('/dropdown/stores');
  const { data: doctors = [] } = useDropdown('/dropdown/employees', {
    employmentCategory: 'doctor'
  });

  const { data: presetPatient } = useQuery({
    queryKey: ['patient', presetPatientId],
    enabled: !!presetPatientId,
    queryFn: () => patientService.getById(presetPatientId!)
  });

  useEffect(() => {
    if (presetPatient) setPatient(presetPatient);
  }, [presetPatient]);

  // The list is the chosen store's stock, not the item catalogue.
  //
  // A pharmacist is handing over something that is physically on a shelf, and
  // the stock row is what carries the two things this form cannot work without:
  // how much is there, and which unit the price and the quantity box are in.
  // Stock moves under this screen all day, so it is re-read rather than cached
  // long — an item promising three boxes that are gone is worse than a spinner.
  const { data: storeItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['dispensable-items', storeId],
    enabled: !!storeId,
    staleTime: 30_000,
    queryFn: () => counterSaleService.getStoreItems(Number(storeId))
  });
  const priced = useMemo(() => {
    const map = new Map<string, StoreItem>();
    storeItems.forEach(item => map.set(String(item.itemId), item));
    return map;
  }, [storeItems]);

  // Switching store changes which items exist and what they cost, so a line
  // carrying an item the new store does not stock is cleared rather than
  // silently priced at the old store's figure.
  useEffect(() => {
    setLines(current =>
      current.map(line =>
        line.itemId && !priced.has(line.itemId) ? { ...line, itemId: '' } : line
      )
    );
  }, [priced]);

  // Default to the store marked default, so the counter does not pick one every
  // time.
  useEffect(() => {
    if (!storeId && stores.length > 0) setStoreId(String(stores[0].id));
  }, [stores, storeId]);

  const updateLine = (key: number, patch: Partial<DraftLine>) =>
    setLines(current => current.map(line => (line.key === key ? { ...line, ...patch } : line)));

  /**
   * The unit a line is priced and counted in: the chosen one, or the item's own
   * sale unit when none is chosen. The backend resolves it the same way, so the
   * total quoted here is the total charged.
   *
   * A unit's price is its own rather than the sale price scaled by the factor —
   * a loose tablet is not a tenth of a box — which is why the price travels
   * with the unit instead of being worked out here.
   */
  const unitOf = (line: DraftLine) => {
    const item = priced.get(line.itemId);
    if (!item) return null;

    const chosen = item.units?.find(unit => String(unit.uomId) === line.uomId);
    return chosen
      ? { name: chosen.name, price: Number(chosen.salePrice), factor: chosen.factorToBase }
      : { name: item.saleUom ?? null, price: Number(item.salePrice), factor: item.conversionFactor };
  };

  const lineTotal = (line: DraftLine): number => {
    const unit = unitOf(line);
    if (!unit) return 0;
    const gross = unit.price * (Number(line.qty) || 0);
    const discount = (gross * (Number(line.percentageDiscount) || 0)) / 100;
    return Math.max(round2(gross - discount), 0);
  };

  const filledLines = lines.filter(line => line.itemId);

  const totals = useMemo(() => {
    const subTotal = round2(filledLines.reduce((sum, line) => sum + lineTotal(line), 0));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, priced, percentageDiscount, amountDiscount, tax]);

  const overDiscounted = totals.discounted < 0;
  const paid = num(paidAmount);
  const change = round2(Math.max(paid - totals.netAmount, 0));

  // Keeps a retry after a dropped connection from posting the document
  // twice. Reset on success so the next one is not answered from this one.
  const idempotency = useSubmissionKey('dispense');

  const { mutateAsync: dispense, isPending: saving } = useMutation({
    mutationFn: (payload: PharmacySaleCreatePayload) =>
      pharmacySaleService.create(payload, idempotency.keyFor(payload)),
    onSuccess: sale => {
      idempotency.reset();
      queryClient.invalidateQueries({ queryKey: ['pharmacy-sales'] });
      queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
      queryClient.invalidateQueries({ queryKey: ['patient-summary'] });
      toast.success(t('pharmacy.dispense.toast.dispensed', { number: sale.pharmacySaleNo }));
      navigate(`/pharmacy/sales/${sale.id}`);
    },
    onError: (error: Error) => toast.error(error.message || t('pharmacy.dispense.toast.failed'))
  });

  const handleSubmit = () => {
    if (!patient) return toast.error(t('pharmacy.dispense.toast.selectPatient'));
    if (!storeId) return toast.error(t('pharmacy.dispense.toast.selectStore'));
    if (filledLines.length === 0) return toast.error(t('pharmacy.dispense.toast.addMedicine'));
    if (filledLines.some(line => !/^\d+$/.test(line.qty) || Number(line.qty) < 1)) {
      return toast.error(t('pharmacy.dispense.toast.wholeQty'));
    }
    if (overDiscounted) return toast.error(t('pharmacy.dispense.toast.overDiscounted'));

    return dispense({
      patientId: patient.id,
      storeId: Number(storeId),
      employeeId: employeeId ? Number(employeeId) : null,
      lines: filledLines.map(line => ({
        itemId: Number(line.itemId),
        uomId: line.uomId ? Number(line.uomId) : null,
        qty: Number(line.qty),
        percentageDiscount: line.percentageDiscount ? Number(line.percentageDiscount) : null,
        orderRemarks: line.orderRemarks.trim() || null
      })),
      percentageDiscount: percentageDiscount ? Number(percentageDiscount) : null,
      amountDiscount: amountDiscount ? String(num(amountDiscount)) : null,
      tax: tax ? String(num(tax)) : null,
      paidBy,
      paidAmount: String(paid),
      transactionNo: transactionNo.trim() || null
    });
  };

  /**
   * The totals, the payment fields and the button that commits the document.
   *
   * Named rather than written inline because below `lg` this is not a sidebar
   * at all. A phone stacks it under the lines, where it sits past however many
   * items are on the document — so there it becomes a sheet raised from a
   * fixed bottom bar, the same arrangement the counter screen uses.
   */
  const summary = (
    <>
      <p className="text-sm font-semibold">{t('pharmacy.dispense.summary')}</p>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {t('pharmacy.dispense.subtotal')}
            <Badge variant="secondary" className="ml-2">
              {filledLines.length}
            </Badge>
          </dt>
          <dd className="tabular-nums">{formatCurrency(totals.subTotal)}</dd>
        </div>
        {totals.percentageAmount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {t('pharmacy.dispense.discountRate', { rate: percentageDiscount })}
            </dt>
            <dd className="tabular-nums text-destructive">
              −{formatCurrency(totals.percentageAmount)}
            </dd>
          </div>
        )}
        {totals.flatDiscount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('pharmacy.dispense.discount')}</dt>
            <dd className="tabular-nums text-destructive">
              −{formatCurrency(totals.flatDiscount)}
            </dd>
          </div>
        )}
        {totals.taxAmount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {t('pharmacy.dispense.tax', { rate: tax })}
            </dt>
            <dd className="tabular-nums">{formatCurrency(totals.taxAmount)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>{t('pharmacy.dispense.netAmount')}</dt>
          <dd className="tabular-nums">{formatCurrency(totals.netAmount)}</dd>
        </div>
      </dl>

      {overDiscounted && (
        <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {t('pharmacy.dispense.overDiscounted')}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
        <Field
          label={t('pharmacy.dispense.discountPercentLabel')}
          htmlFor="percentageDiscount"
        >
          <Input
            id="percentageDiscount"
            inputMode="numeric"
            placeholder="0"
            value={percentageDiscount}
            onChange={event => setPercentageDiscount(event.target.value)}
          />
        </Field>
        <Field label={t('pharmacy.dispense.discountAmountLabel')} htmlFor="amountDiscount">
          <MoneyInput
            id="amountDiscount"
            placeholder="0"
            value={amountDiscount}
            onChange={event => setAmountDiscount(event.target.value)}
          />
        </Field>
        <Field label={t('pharmacy.dispense.taxPercentLabel')} htmlFor="tax">
          <Input
            id="tax"
            inputMode="decimal"
            placeholder="0"
            value={tax}
            onChange={event => setTax(event.target.value)}
          />
        </Field>
        <Field label={t('pharmacy.dispense.paidBy')} htmlFor="paidBy">
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
          label={t('pharmacy.dispense.amountReceived')}
          htmlFor="paidAmount"
          hint={t('pharmacy.dispense.amountReceivedHint')}
        >
          <MoneyInput
            id="paidAmount"
            placeholder="0"
            value={paidAmount}
            onChange={event => setPaidAmount(event.target.value)}
          />
        </Field>

        {paidBy !== 'cash' && (
          <Field label={t('pharmacy.dispense.transactionRef')} htmlFor="transactionNo">
            <Input
              id="transactionNo"
              value={transactionNo}
              onChange={event => setTransactionNo(event.target.value)}
            />
          </Field>
        )}
      </div>

      {change > 0 && (
        <div className="mt-3 flex justify-between rounded-md bg-muted/50 px-3 py-2 text-sm font-medium">
          <span>{t('pharmacy.dispense.changeDue')}</span>
          <span className="tabular-nums">{formatCurrency(change)}</span>
        </div>
      )}

      <Button
        className="mt-4 w-full"
        disabled={saving || filledLines.length === 0 || overDiscounted}
        onClick={() => void handleSubmit()}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
        {paid >= totals.netAmount && totals.netAmount > 0
          ? t('pharmacy.dispense.submitPaid')
          : t('pharmacy.dispense.submitAccount')}
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
          onClick={() => navigate('/pharmacy/sales')}
          aria-label={t('pharmacy.saleDetail.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t('pharmacy.dispense.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('pharmacy.dispense.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* The bottom bar floats over the page, so the last line needs room. */}
        <div className="space-y-4 pb-20 lg:pb-0">
          <Card className="space-y-4 p-4">
            <Field label={t('pharmacy.dispense.patient')} required>
              <PatientSearchSelect value={patient} onChange={setPatient} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('pharmacy.dispense.dispenseFrom')} htmlFor="storeId" required>
                <NativeSelect
                  id="storeId"
                  value={storeId}
                  onChange={event => setStoreId(event.target.value)}
                >
                  <option value="">{t('pharmacy.dispense.selectStore')}</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <Field
                label={t('pharmacy.dispense.prescribedBy')}
                htmlFor="employeeId"
                hint={t('pharmacy.dispense.prescribedByHint')}
              >
                <NativeSelect
                  id="employeeId"
                  value={employeeId}
                  onChange={event => setEmployeeId(event.target.value)}
                >
                  <option value="">{t('pharmacy.dispense.notRecorded')}</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Pill className="h-4 w-4" />
                {t('pharmacy.dispense.medicines')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLines(current => [...current, newLine(Date.now())])}
              >
                <Plus className="h-4 w-4" />
                {t('pharmacy.dispense.addLine')}
              </Button>
            </div>

            <div className="space-y-2 p-4">
              {lines.map(line => {
                const item = priced.get(line.itemId);
                // Everything on this row is in the line's chosen unit: the
                // price the patient is charged, the number typed, and the stock
                // figure it is checked against. The base unit only appears as
                // the note underneath, which is what the shelf gives up.
                const unit = unitOf(line);
                const onHand = item && unit ? toSaleUnits(item.totalQty, unit.factor) : 0;
                const wanted = Number(line.qty) || 0;
                const short = !!item && wanted > onHand;
                const note =
                  item && unit
                    ? conversionNote(wanted, unit.factor, unit.name, item.baseUom)
                    : null;

                return (
                  <div key={line.key} className="rounded-lg border p-3">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_70px_80px_auto]">
                      <NativeSelect
                        value={line.itemId}
                        disabled={loadingItems || !storeId}
                        onChange={event =>
                          // The previous medicine's unit means nothing on this
                          // one, so the line falls back to the new item's own
                          // sale unit rather than carrying a stale id.
                          updateLine(line.key, { itemId: event.target.value, uomId: '' })
                        }
                        aria-label={t('pharmacy.dispense.medicine')}
                      >
                        <option value="">
                          {!storeId
                            ? t('pharmacy.dispense.chooseStoreFirst')
                            : loadingItems
                              ? t('pharmacy.dispense.loadingItems')
                              : t('pharmacy.dispense.selectMedicine')}
                        </option>
                        {storeItems.map(option => (
                          <option key={option.itemId} value={option.itemId}>
                            {option.itemName} — {formatCurrency(option.salePrice)}
                            {option.saleUom ? ` / ${option.saleUom}` : ''} ·{' '}
                            {toSaleUnits(option.totalQty, option.conversionFactor)} on hand
                          </option>
                        ))}
                      </NativeSelect>

                      {/*
                        The unit sold in. A pharmacy that prices a single
                        tablet can hand one over here; without this the shelf's
                        part-boxes are stock nobody can sell.
                      */}
                      <NativeSelect
                        value={line.uomId}
                        disabled={!item || (item.units ?? []).length === 0}
                        onChange={event => updateLine(line.key, { uomId: event.target.value })}
                        aria-label={t('common.label.unit')}
                      >
                        <option value="">
                          {item?.saleUom ?? t('common.label.unit')}
                          {item ? ` — ${formatCurrency(item.salePrice)}` : ''}
                        </option>
                        {(item?.units ?? []).map(option => (
                          <option key={option.uomId} value={option.uomId}>
                            {option.name} — {formatCurrency(option.salePrice)}
                          </option>
                        ))}
                      </NativeSelect>

                      <Input
                        value={line.qty}
                        inputMode="numeric"
                        onChange={event => updateLine(line.key, { qty: event.target.value })}
                        aria-label={
                          unit?.name
                            ? t('pharmacy.dispense.quantityIn', { unit: unit.name })
                            : t('pharmacy.dispense.quantity')
                        }
                        placeholder={unit?.name ?? t('pharmacy.dispense.qty')}
                        className={short ? 'border-destructive' : undefined}
                      />

                      <Input
                        value={line.percentageDiscount}
                        inputMode="numeric"
                        onChange={event =>
                          updateLine(line.key, { percentageDiscount: event.target.value })
                        }
                        aria-label={t('pharmacy.dispense.discountAria')}
                        placeholder={t('pharmacy.dispense.discountPercent')}
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        disabled={lines.length === 1}
                        onClick={() =>
                          setLines(current => current.filter(entry => entry.key !== line.key))
                        }
                        aria-label={t('pharmacy.dispense.removeLine')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Input
                        value={line.orderRemarks}
                        onChange={event =>
                          updateLine(line.key, { orderRemarks: event.target.value })
                        }
                        placeholder={t('pharmacy.dispense.remarksPlaceholder')}
                        aria-label={t('common.label.remarks')}
                        className="flex-1"
                      />
                      {item && (
                        <span className="text-xs text-muted-foreground">
                          {t('pharmacy.dispense.lineTotal')}{' '}
                          <span className="font-medium tabular-nums text-foreground">
                            {formatCurrency(lineTotal(line))}
                          </span>
                        </span>
                      )}
                    </div>

                    {item && (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        <span className={short ? 'font-medium text-destructive' : undefined}>
                          {t('pharmacy.dispense.onHand', {
                            qty: formatQty(onHand, unit?.name)
                          })}
                          {short ? t('pharmacy.dispense.notEnough') : ''}
                        </span>
                        {note && <span> · {t('pharmacy.dispense.dispenses', { note })}</span>}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
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
          {/* The mobile stand-in for the sidebar: the figure that decides the
              transaction, and the way through to the rest of it. */}
          <div data-print-hide className="fixed inset-x-0 bottom-0 z-30 border-t bg-card p-3">
            <Button
              className="h-14 w-full justify-between text-base"
              disabled={filledLines.length === 0}
              onClick={() => setSummaryOpen(true)}
            >
              <span className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                {t('pharmacy.dispense.summary')}
                <Badge variant="secondary">{filledLines.length}</Badge>
              </span>
              <span className="tabular-nums">{formatCurrency(totals.netAmount)}</span>
            </Button>
          </div>

          <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
            <DialogContent className="max-w-lg">
              {/* The bar that opened the sheet already names it. */}
              <DialogHeader className="sr-only">
                <DialogTitle>{t('pharmacy.dispense.summary')}</DialogTitle>
              </DialogHeader>
              {summary}
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
