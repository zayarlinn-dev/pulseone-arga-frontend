import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSubmissionKey } from '@/lib/idempotency';
import { ArrowLeft, Loader2, PackagePlus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
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
import { DraftNotice } from '@/components/ui/draft-notice';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { useDropdown } from '@/hooks/api/useDropdown';
import { useEntityOptions } from '@/hooks/api/useEntityOptions';
import { useFormDraft } from '@/hooks/useFormDraft';
import { grnService, itemService, type GRNCreatePayload } from '@/services';
import { formatCurrency } from '@/lib/utils';
import { conversionNote } from '@/lib/uom';
import type { Item, ItemUOM } from '@/types/models';

const num = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const round2 = (value: number) => Math.round(value * 100) / 100;

interface DraftBatch {
  key: number;
  batchNo: string;
  qty: string;
  expiryDate: string;
}

interface DraftLine {
  key: number;
  itemId: string;
  storeId: string;
  /**
   * The unit this line is keyed in, chosen from the item's units. Blank means
   * the item's sale unit, which is what a line meant before items had a unit
   * list — and what a draft saved before this field existed still says.
   */
  uomId: string;
  qty: string;
  itemPrice: string;
  amountDiscount: string;
  batches: DraftBatch[];
}

const newBatch = (key: number): DraftBatch => ({ key, batchNo: '', qty: '', expiryDate: '' });

/** Everything the autosaved draft carries; see `useFormDraft` for the rules. */
interface GRNDraft {
  vendorId: string;
  grnCategoryId: string;
  invoiceNo: string;
  invoiceDate: string;
  amountDiscount: string;
  tax: string;
  defaultStoreId: string;
  lines: DraftLine[];
}

const newLine = (key: number, storeId = ''): DraftLine => ({
  key,
  itemId: '',
  storeId,
  uomId: '',
  qty: '',
  itemPrice: '',
  amountDiscount: '',
  batches: []
});

/**
 * Receiving a delivery against a vendor invoice.
 *
 * Batches are optional per line: an item with no expiry can be received as a
 * single anonymous lot, while medicine is split into the batches printed on the
 * cartons, because that is what FEFO dispensing and expiry alerts read later.
 * When batches are given, their quantities must add up to the line — receiving
 * 100 boxes but only accounting for 80 of them would leave 20 untraceable.
 */
export default function GRNFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /** Matches the `lg` breakpoint the two-column layout is built around. */
  const isWide = useMediaQuery('(min-width: 1024px)');
  /** Only reachable below lg, where the summary is a sheet rather than a column. */
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [vendorId, setVendorId] = useState('');
  const [grnCategoryId, setGrnCategoryId] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amountDiscount, setAmountDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [defaultStoreId, setDefaultStoreId] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([newLine(0)]);

  const { data: vendors = [] } = useDropdown('/dropdown/vendors');
  const { data: stores = [] } = useDropdown('/dropdown/stores');
  const categories = useEntityOptions('GRN Category');

  const { data: catalogue, isLoading: loadingItems } = useQuery({
    queryKey: ['grn-items'],
    staleTime: 5 * 60_000,
    queryFn: () => itemService.getList({ limit: 500, isActive: true })
  });
  const items = useMemo(() => catalogue?.data ?? [], [catalogue]);
  const byId = useMemo(() => {
    const map = new Map<string, Item>();
    items.forEach(item => map.set(String(item.id), item));
    return map;
  }, [items]);

  /*
   * The units of the items actually on the note, and only those: a delivery has
   * a handful of lines while the catalogue has hundreds, so the unit lists are
   * fetched per chosen item rather than shipped with the catalogue. They change
   * about as often as an item is set up, hence the long stale time.
   */
  const chosenItemIds = useMemo(
    () => [...new Set(lines.map(line => line.itemId).filter(Boolean))],
    [lines]
  );
  const unitQueries = useQueries({
    queries: chosenItemIds.map(itemId => ({
      queryKey: ['item-units', Number(itemId)],
      queryFn: () => itemService.getUnits(itemId),
      staleTime: 5 * 60_000
    }))
  });
  const unitsByItem = useMemo(() => {
    const map = new Map<string, ItemUOM[]>();
    chosenItemIds.forEach((itemId, index) => map.set(itemId, unitQueries[index]?.data ?? []));
    return map;
  }, [chosenItemIds, unitQueries]);

  /**
   * Picks the unit a line should open on: the item's purchase unit if it has
   * one, and otherwise nothing — which the backend reads as the sale unit, the
   * same thing this form did before units existed.
   */
  const defaultUomFor = (itemId: string): string => {
    const purchase = unitsByItem.get(itemId)?.find(unit => unit.isPurchaseDefault);
    return purchase ? String(purchase.uomId) : '';
  };

  // Most deliveries land in one store, so choosing it once seeds every line.
  useEffect(() => {
    if (!defaultStoreId && stores.length > 0) setDefaultStoreId(String(stores[0].id));
  }, [stores, defaultStoreId]);

  useEffect(() => {
    if (!defaultStoreId) return;
    setLines(current =>
      current.map(line => (line.storeId ? line : { ...line, storeId: defaultStoreId }))
    );
  }, [defaultStoreId]);

  /*
   * A delivery is transcribed off a paper invoice a line at a time, and the
   * phone rings. Nothing here goes stale while it waits — the numbers come from
   * the vendor's invoice, not from the system — so an interrupted GRN is worth
   * keeping rather than retyping.
   */
  const draft = useFormDraft<GRNDraft>(
    'grn',
    { vendorId, grnCategoryId, invoiceNo, invoiceDate, amountDiscount, tax, defaultStoreId, lines },
    {
      // The store on a blank line is seeded automatically, so it does not count
      // as the user having entered anything.
      enabled:
        Boolean(vendorId || grnCategoryId || invoiceNo.trim() || amountDiscount || tax) ||
        lines.some(line => line.itemId || line.qty || line.itemPrice || line.batches.length > 0),
      onRestore: saved => {
        setVendorId(saved.vendorId);
        setGrnCategoryId(saved.grnCategoryId);
        setInvoiceNo(saved.invoiceNo);
        setInvoiceDate(saved.invoiceDate);
        setAmountDiscount(saved.amountDiscount);
        setTax(saved.tax);
        setDefaultStoreId(saved.defaultStoreId);
        setLines(saved.lines.length > 0 ? saved.lines : [newLine(0)]);
      }
    }
  );

  const updateLine = (key: number, patch: Partial<DraftLine>) =>
    setLines(current => current.map(line => (line.key === key ? { ...line, ...patch } : line)));

  const updateBatch = (lineKey: number, batchKey: number, patch: Partial<DraftBatch>) =>
    setLines(current =>
      current.map(line =>
        line.key === lineKey
          ? {
              ...line,
              batches: line.batches.map(batch =>
                batch.key === batchKey ? { ...batch, ...patch } : batch
              )
            }
          : line
      )
    );

  const lineTotal = (line: DraftLine) =>
    round2(Math.max(num(line.qty) * num(line.itemPrice) - num(line.amountDiscount), 0));

  const filledLines = lines.filter(line => line.itemId && num(line.qty) > 0);

  const totals = useMemo(() => {
    const subTotal = round2(filledLines.reduce((sum, line) => sum + lineTotal(line), 0));
    const discounted = round2(subTotal - num(amountDiscount));
    const taxAmount = discounted < 0 ? 0 : round2((discounted * num(tax)) / 100);
    return { subTotal, discounted, taxAmount, netAmount: round2(discounted + taxAmount) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, amountDiscount, tax]);

  const overDiscounted = totals.discounted < 0;

  /** A line with batches must have them add up to the line quantity. */
  const batchMismatch = (line: DraftLine) => {
    if (line.batches.length === 0) return false;
    const sum = line.batches.reduce((total, batch) => total + num(batch.qty), 0);
    return sum !== num(line.qty);
  };
  const mismatched = filledLines.filter(batchMismatch);

  // Keeps a retry after a dropped connection from posting the document
  // twice. Reset on success so the next one is not answered from this one.
  const idempotency = useSubmissionKey('grn');

  const { mutateAsync: receive, isPending: saving } = useMutation({
    mutationFn: (payload: GRNCreatePayload) =>
      grnService.create(payload, idempotency.keyFor(payload)),
    onSuccess: grn => {
      idempotency.reset();
      draft.clear();
      queryClient.invalidateQueries({ queryKey: ['grns'] });
      queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
      toast.success(t('grn.form.toast.received', { number: grn.grnNo }));
      navigate(`/procurement/grns/${grn.id}`);
    },
    onError: (error: Error) => toast.error(error.message || t('grn.form.toast.failed'))
  });

  const handleSubmit = () => {
    if (!vendorId) return toast.error(t('grn.form.toast.selectVendor'));
    if (!grnCategoryId) return toast.error(t('grn.form.toast.selectCategory'));
    if (!invoiceNo.trim()) return toast.error(t('grn.form.toast.enterInvoiceNo'));
    if (filledLines.length === 0) return toast.error(t('grn.form.toast.addLine'));
    if (filledLines.some(line => !line.storeId)) return toast.error(t('grn.form.toast.needStore'));
    if (mismatched.length > 0) {
      return toast.error(t('grn.form.toast.batchMismatch'));
    }
    if (overDiscounted) return toast.error(t('grn.form.toast.overDiscounted'));

    return receive({
      vendorId: Number(vendorId),
      grnCategoryId: Number(grnCategoryId),
      invoiceNo: invoiceNo.trim(),
      invoiceDate,
      amountDiscount: amountDiscount ? String(num(amountDiscount)) : null,
      tax: tax ? String(num(tax)) : null,
      grnItems: filledLines.map(line => ({
        itemId: Number(line.itemId),
        storeId: Number(line.storeId),
        uomId: line.uomId ? Number(line.uomId) : null,
        qty: num(line.qty),
        itemPrice: String(num(line.itemPrice)),
        amountDiscount: line.amountDiscount ? String(num(line.amountDiscount)) : null,
        itemBatches: line.batches
          .filter(batch => batch.batchNo.trim() && num(batch.qty) > 0)
          .map(batch => ({
            batchNo: batch.batchNo.trim(),
            qty: num(batch.qty),
            expiryDate: batch.expiryDate || null
          }))
      }))
    });
  };

  /**
   * The totals, the discount fields and the button that posts the receipt.
   *
   * Named rather than written inline because below `lg` this is not a sidebar
   * at all. A phone stacks it under the lines, where it sits past however many
   * items were received — so there it becomes a sheet raised from a fixed
   * bottom bar, the same arrangement the counter screen uses.
   */
  const summary = (
    <>
      <p className="text-sm font-semibold">{t('grn.form.summary')}</p>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {t('grn.detail.subtotal')}
            <Badge variant="secondary" className="ml-2">
              {filledLines.length}
            </Badge>
          </dt>
          <dd className="tabular-nums">{formatCurrency(totals.subTotal)}</dd>
        </div>
        {num(amountDiscount) > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('grn.form.discount')}</dt>
            <dd className="tabular-nums text-destructive">
              −{formatCurrency(num(amountDiscount))}
            </dd>
          </div>
        )}
        {totals.taxAmount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('grn.detail.tax', { rate: tax })}</dt>
            <dd className="tabular-nums">{formatCurrency(totals.taxAmount)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>{t('grn.detail.netAmount')}</dt>
          <dd className="tabular-nums">{formatCurrency(totals.netAmount)}</dd>
        </div>
      </dl>

      {overDiscounted && (
        <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {t('grn.form.overDiscounted')}
        </p>
      )}
      {mismatched.length > 0 && (
        <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {t(
            mismatched.length === 1 ? 'grn.form.mismatchOne' : 'grn.form.mismatchMany'
          )}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4">
        <Field label={t('grn.form.discount')} htmlFor="amountDiscount">
          <MoneyInput
            id="amountDiscount"
            placeholder="0"
            value={amountDiscount}
            onChange={event => setAmountDiscount(event.target.value)}
          />
        </Field>
        <Field label={t('grn.form.taxPercent')} htmlFor="tax">
          <Input
            id="tax"
            inputMode="decimal"
            placeholder="0"
            value={tax}
            onChange={event => setTax(event.target.value)}
          />
        </Field>
      </div>

      <Button
        className="mt-4 w-full"
        disabled={saving || filledLines.length === 0 || overDiscounted || mismatched.length > 0}
        onClick={() => void handleSubmit()}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PackagePlus className="h-4 w-4" />
        )}
        {t('grn.form.submit')}
      </Button>

      {/* No relative time here: nothing re-renders while the form sits
          idle, so it would freeze at "1 second ago" and read as a lie. */}
      {draft.savedAt && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t('grn.form.draftSaved')}
        </p>
      )}
    </>
  );

  return (
    <>
      <div className="mb-4 flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 h-8 w-8"
          onClick={() => navigate('/procurement/grns')}
          aria-label={t('grn.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t('grn.form.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('grn.form.subtitle')}</p>
        </div>
      </div>

      <DraftNotice
        savedAt={draft.offeredAt}
        description={t('grn.form.draftDescription')}
        onRestore={draft.restore}
        onDiscard={draft.discard}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* The bottom bar floats over the page, so the last line needs room. */}
        <div className="space-y-4 pb-20 lg:pb-0">
          <Card className="space-y-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('grn.form.vendor')} htmlFor="vendorId" required>
                <NativeSelect
                  id="vendorId"
                  value={vendorId}
                  onChange={event => setVendorId(event.target.value)}
                >
                  <option value="">{t('grn.form.selectVendor')}</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <Field
                label={t('common.label.category')}
                htmlFor="grnCategoryId"
                required
                hint={
                  categories.categoryMissing
                    ? 'No "GRN Category" category configured yet.'
                    : undefined
                }
              >
                <NativeSelect
                  id="grnCategoryId"
                  value={grnCategoryId}
                  disabled={categories.isLoading || categories.categoryMissing}
                  onChange={event => setGrnCategoryId(event.target.value)}
                >
                  <option value="">
                    {categories.isLoading
                      ? t('common.label.loading')
                      : t('grn.form.selectCategory')}
                  </option>
                  {categories.options.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label={t('grn.form.invoiceNo')}
                htmlFor="invoiceNo"
                required
                hint={t('grn.form.invoiceNoHint')}
              >
                <Input
                  id="invoiceNo"
                  maxLength={20}
                  value={invoiceNo}
                  onChange={event => setInvoiceNo(event.target.value)}
                />
              </Field>

              <Field label={t('grn.form.invoiceDate')} htmlFor="invoiceDate" required>
                <DateField
                  id="invoiceDate"
                  value={invoiceDate}
                  onChange={event => setInvoiceDate(event.target.value)}
                />
              </Field>

              <Field
                label={t('grn.form.receiveInto')}
                htmlFor="defaultStoreId"
                hint={t('grn.form.receiveIntoHint')}
              >
                <NativeSelect
                  id="defaultStoreId"
                  value={defaultStoreId}
                  onChange={event => setDefaultStoreId(event.target.value)}
                >
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <PackagePlus className="h-4 w-4" />
                {t('grn.form.receivedLines')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setLines(current => [...current, newLine(Date.now(), defaultStoreId)])
                }
              >
                <Plus className="h-4 w-4" />
                {t('grn.form.addLine')}
              </Button>
            </div>

            <div className="space-y-3 p-4">
              {lines.map(line => {
                const item = byId.get(line.itemId);
                const mismatch = batchMismatch(line);
                const batchSum = line.batches.reduce((sum, batch) => sum + num(batch.qty), 0);

                // The unit this line is keyed in, and what it converts by. A
                // line that names none is read as the item's sale unit — the
                // backend does the same — so both halves fall back together.
                const units = unitsByItem.get(line.itemId) ?? [];
                const chosen = units.find(unit => String(unit.uomId) === line.uomId);
                const factor = chosen?.factorToBase ?? item?.conversionFactor ?? 1;
                const unitName = chosen?.uom?.entityName ?? item?.saleUom?.entityName;

                // What the line will actually put on the shelf. Showing the
                // result is how a wrong unit is caught before the stock is
                // booked rather than at the next count.
                const stocked = item
                  ? conversionNote(
                      num(line.qty) || 0,
                      factor,
                      unitName,
                      item.baseUom?.entityName
                    )
                  : null;

                return (
                  <div key={line.key} className="rounded-lg border p-3">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
                      <NativeSelect
                        value={line.itemId}
                        disabled={loadingItems}
                        onChange={event =>
                          updateLine(line.key, {
                            itemId: event.target.value,
                            // The previous item's unit means nothing on this
                            // one, so it is replaced rather than carried over.
                            uomId: defaultUomFor(event.target.value)
                          })
                        }
                        aria-label={t('grn.form.item')}
                      >
                        <option value="">
                          {loadingItems ? t('common.label.loading') : t('grn.form.selectItem')}
                        </option>
                        {items.map(option => (
                          <option key={option.id} value={option.id}>
                            {option.itemName}
                          </option>
                        ))}
                      </NativeSelect>

                      <NativeSelect
                        value={line.storeId}
                        onChange={event => updateLine(line.key, { storeId: event.target.value })}
                        aria-label={t('grn.form.store')}
                      >
                        <option value="">{t('grn.form.store')}</option>
                        {stores.map(store => (
                          <option key={store.id} value={store.id}>
                            {store.name}
                          </option>
                        ))}
                      </NativeSelect>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        disabled={lines.length === 1}
                        onClick={() =>
                          setLines(current => current.filter(entry => entry.key !== line.key))
                        }
                        aria-label={t('grn.form.removeLine')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-2 grid gap-2 sm:grid-cols-5">
                      <Input
                        value={line.qty}
                        inputMode="numeric"
                        placeholder={unitName ?? t('grn.form.qty')}
                        aria-label={
                          unitName
                            ? t('grn.form.quantityIn', { unit: unitName })
                            : t('grn.form.quantity')
                        }
                        className={mismatch ? 'border-destructive' : undefined}
                        onChange={event => updateLine(line.key, { qty: event.target.value })}
                      />

                      {/*
                        The unit the delivery is counted in — a carton where the
                        item is bought by the carton. It is what the quantity,
                        the cost and every batch below are keyed in, so it sits
                        next to the quantity rather than under the item.
                      */}
                      <NativeSelect
                        value={line.uomId}
                        disabled={!item || units.length === 0}
                        onChange={event => updateLine(line.key, { uomId: event.target.value })}
                        aria-label={t('common.label.unit')}
                      >
                        <option value="">
                          {item?.saleUom?.entityName ?? t('common.label.unit')}
                        </option>
                        {units
                          // The sale unit is already the blank option, which is
                          // also what an unnamed line means; offering it twice
                          // would be two ways to say the same thing.
                          .filter(unit => unit.uomId !== item?.saleUomId)
                          .map(unit => (
                            <option key={unit.id} value={unit.uomId}>
                              {unit.uom?.entityName ?? `#${unit.uomId}`} (×{unit.factorToBase})
                            </option>
                          ))}
                      </NativeSelect>

                      <MoneyInput
                        value={line.itemPrice}
                        placeholder={
                          unitName ? t('grn.form.costPer', { unit: unitName }) : t('grn.form.costPrice')
                        }
                        aria-label={
                          unitName ? t('grn.form.costPer', { unit: unitName }) : t('grn.form.costPrice')
                        }
                        onChange={event => updateLine(line.key, { itemPrice: event.target.value })}
                      />
                      <MoneyInput
                        value={line.amountDiscount}
                        placeholder={t('grn.form.discount')}
                        aria-label={t('grn.form.lineDiscount')}
                        onChange={event =>
                          updateLine(line.key, { amountDiscount: event.target.value })
                        }
                      />
                      <div className="flex items-center justify-end text-sm">
                        <span className="font-medium tabular-nums">
                          {formatCurrency(lineTotal(line))}
                        </span>
                      </div>
                    </div>

                    {item && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sells at {formatCurrency(item.salePrice)}
                        {item.saleUom ? ` / ${item.saleUom.entityName}` : ''}
                        {stocked ? ` · ${t('grn.form.addsToStock', { qty: stocked })}` : ''}
                      </p>
                    )}

                    <div className="mt-3 border-t pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t('grn.form.batches')}
                          {line.batches.length > 0 && (
                            <span className={mismatch ? 'ml-2 text-destructive' : 'ml-2'}>
                              {t('grn.form.batchesAccounted', {
                                sum: batchSum,
                                total: num(line.qty) || 0
                              })}
                            </span>
                          )}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateLine(line.key, {
                              batches: [...line.batches, newBatch(Date.now())]
                            })
                          }
                        >
                          <Plus className="h-4 w-4" />
                          {t('grn.form.addBatch')}
                        </Button>
                      </div>

                      {line.batches.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {t('grn.form.noBatches')}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {line.batches.map(batch => (
                            <div
                              key={batch.key}
                              className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_80px_minmax(0,1fr)_auto]"
                            >
                              <Input
                                value={batch.batchNo}
                                placeholder={t('grn.form.batchNo')}
                                aria-label={t('grn.form.batchNumber')}
                                onChange={event =>
                                  updateBatch(line.key, batch.key, { batchNo: event.target.value })
                                }
                              />
                              <Input
                                value={batch.qty}
                                inputMode="numeric"
                                placeholder={t('grn.form.qty')}
                                aria-label={t('grn.form.batchQty')}
                                onChange={event =>
                                  updateBatch(line.key, batch.key, { qty: event.target.value })
                                }
                              />
                              <DateField
                                value={batch.expiryDate}
                                aria-label={t('grn.form.expiryDate')}
                                onChange={event =>
                                  updateBatch(line.key, batch.key, {
                                    expiryDate: event.target.value
                                  })
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive"
                                aria-label={t('grn.form.removeBatch')}
                                onClick={() =>
                                  updateLine(line.key, {
                                    batches: line.batches.filter(entry => entry.key !== batch.key)
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
              document, and the way through to the rest of it. */}
          <div data-print-hide className="fixed inset-x-0 bottom-0 z-30 border-t bg-card p-3">
            <Button
              className="h-14 w-full justify-between text-base"
              disabled={filledLines.length === 0}
              onClick={() => setSummaryOpen(true)}
            >
              <span className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5" />
                {t('grn.form.summary')}
                <Badge variant="secondary">{filledLines.length}</Badge>
              </span>
              <span className="tabular-nums">{formatCurrency(totals.netAmount)}</span>
            </Button>
          </div>

          <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
            <DialogContent className="max-w-lg">
              {/* The bar that opened the sheet already names it. */}
              <DialogHeader className="sr-only">
                <DialogTitle>{t('grn.form.summary')}</DialogTitle>
              </DialogHeader>
              {summary}
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
