// Aliased: React's KeyboardEvent would otherwise shadow the DOM one the window
// listener below is typed against.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Pill, Search, ShoppingCart, Stethoscope, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { PatientSearchSelect } from '@/components/shared/PatientSearchSelect';
import { useDropdown } from '@/hooks/api/useDropdown';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  counterSaleService,
  serviceCatalogService,
  type CounterSaleCreatePayload
} from '@/services';
import { useCounterViewMode } from '@/stores/counterViewStore';
import { useSubmissionKey } from '@/lib/idempotency';
import { cn, formatCurrency } from '@/lib/utils';
import { toSaleUnits } from '@/lib/uom';
import type { Patient, PaymentMethod } from '@/types/models';
import { CatalogueGrid, type CatalogueTile } from '../components/CatalogueGrid';
import { TicketPanel, type TicketTotals } from '../components/TicketPanel';
import { cartKey, lineTotal, num, round2, type CartKind, type CartLine } from '../types';

/**
 * The walk-in counter.
 *
 * The other billing screens follow the patient journey — order a service, find
 * it on the cashier's list, settle it. This one does not: services and medicine
 * are tapped straight onto one ticket and paid for on the spot, which is what a
 * counter actually is. The backend raises the invoice, takes the medicine off
 * the shelf and records the payment in a single transaction.
 *
 * The same till gets worked two ways, so it draws itself two ways. On a device
 * with a coarse pointer everything is finger-sized — catalogue tiles, steppers,
 * an on-screen pad. Anywhere else the same screen is a dense list with typed
 * quantities, no pad, and the search box driving everything from the keyboard.
 * The device decides by default and the profile menu can override it; either
 * way useCounterViewMode hands down the answer, never the preference.
 *
 * Screen width is a separate question from density: below a large screen the
 * ticket becomes a full-height sheet behind a bar at the bottom either way,
 * because a split view on a phone gives neither half enough room.
 */
export default function CounterSalePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mode = useCounterViewMode();
  const touch = mode === 'touch';

  const [tab, setTab] = useState<CartKind>('service');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const searchRef = useRef<HTMLInputElement>(null);
  const [storeId, setStoreId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const [lines, setLines] = useState<CartLine[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientOpen, setPatientOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);

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

  useEffect(() => {
    if (!storeId && stores.length > 0) setStoreId(String(stores[0].id));
  }, [stores, storeId]);

  /*
   * With a keyboard the search box is the whole interface — it is also where a
   * barcode scanner types, since a scanner is a keyboard that ends with Enter.
   * So it takes focus on arrival and "/" brings it back from anywhere on the
   * page. None of this applies on a till, where there is no keyboard to serve.
   */
  useEffect(() => {
    if (touch) return;

    searchRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (typing) return;

      event.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [touch]);

  const { data: catalogue, isLoading: loadingServices } = useQuery({
    queryKey: ['counter-services'],
    staleTime: 5 * 60_000,
    queryFn: () => serviceCatalogService.getList({ limit: 500, isActive: true })
  });

  const { data: storeItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['counter-store-items', storeId],
    enabled: !!storeId,
    // Stock moves under this screen all day, so the grid is re-read rather than
    // cached long — a tile promising three boxes that are gone is worse than a
    // brief spinner.
    staleTime: 30_000,
    queryFn: () => counterSaleService.getStoreItems(Number(storeId))
  });

  const serviceTiles = useMemo<CatalogueTile[]>(
    () =>
      (catalogue?.data ?? []).map(service => ({
        refId: service.id,
        name: service.serviceName,
        code: service.serviceCode,
        unitPrice: Number(service.servicePrice),
        subtitle: service.serviceCenter?.serviceCenterName ?? null
      })),
    [catalogue]
  );

  const itemTiles = useMemo<CatalogueTile[]>(
    () =>
      storeItems.map(item => ({
        refId: item.itemId,
        name: item.itemName,
        code: item.itemCode,
        unitPrice: Number(item.salePrice),
        subtitle: item.genericName ?? null,
        // total_qty is base units; the counter sells whole sale units, so a
        // part-box left on the shelf is not a box that can be sold.
        stockOnHand: toSaleUnits(item.totalQty, item.conversionFactor),
        uom: item.saleUom,
        factorToBase: item.conversionFactor,
        // The item's own sale unit first, then anything else it is priced in.
        // A part-box that cannot be sold as a box is sellable as tablets, and
        // this is what puts that in front of the operator.
        unitOptions: [
          {
            name: item.saleUom ?? null,
            unitPrice: Number(item.salePrice),
            factorToBase: item.conversionFactor,
            stockOnHand: toSaleUnits(item.totalQty, item.conversionFactor)
          },
          ...(item.units ?? []).map(unit => ({
            uomId: unit.uomId,
            name: unit.name,
            unitPrice: Number(unit.salePrice),
            factorToBase: unit.factorToBase,
            stockOnHand: toSaleUnits(item.totalQty, unit.factorToBase)
          }))
        ]
      })),
    [storeItems]
  );

  const source = tab === 'service' ? serviceTiles : itemTiles;

  const tiles = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return source;
    return source.filter(tile => matchesTerm(tile, term));
  }, [source, debouncedSearch]);

  const inCart = useMemo(() => {
    const counts = new Map<number, number>();
    lines
      .filter(line => line.kind === tab)
      .forEach(line => counts.set(line.refId, line.qty));
    return counts;
  }, [lines, tab]);

  const totals = useMemo<TicketTotals>(() => {
    const subTotal = round2(lines.reduce((sum, line) => sum + lineTotal(line), 0));
    const percentageAmount = round2((subTotal * num(percentageDiscount)) / 100);
    const flatDiscount = num(amountDiscount);
    const discounted = round2(subTotal - percentageAmount - flatDiscount);
    const taxAmount = discounted < 0 ? 0 : round2((discounted * num(tax)) / 100);

    return {
      subTotal,
      percentageAmount,
      flatDiscount,
      taxAmount,
      netAmount: round2(discounted + taxAmount),
      overDiscounted: discounted < 0
    };
  }, [lines, percentageDiscount, amountDiscount, tax]);

  const payload = useMemo<CounterSaleCreatePayload>(
    () => ({
      patientId: patient?.id ?? null,
      storeId: lines.some(line => line.kind === 'item') ? Number(storeId) || null : null,
      employeeId: employeeId ? Number(employeeId) : null,
      services: lines
        .filter(line => line.kind === 'service')
        .map(line => ({
          serviceId: line.refId,
          qty: line.qty,
          percentageDiscount: line.percentageDiscount || null
        })),
      items: lines
        .filter(line => line.kind === 'item')
        .map(line => ({
          itemId: line.refId,
          uomId: line.uomId ?? null,
          qty: line.qty,
          percentageDiscount: line.percentageDiscount || null
        })),
      percentageDiscount: percentageDiscount ? Number(percentageDiscount) : null,
      amountDiscount: amountDiscount ? String(num(amountDiscount)) : null,
      tax: tax ? String(num(tax)) : null,
      paidBy,
      paidAmount: String(num(paidAmount)),
      transactionNo: transactionNo.trim() || null
    }),
    [
      patient,
      lines,
      storeId,
      employeeId,
      percentageDiscount,
      amountDiscount,
      tax,
      paidBy,
      paidAmount,
      transactionNo
    ]
  );

  /**
   * Stable for as long as the ticket is: a retry after a dropped connection
   * sends the same key and gets the first receipt back rather than ringing the
   * sale up twice. Editing the ticket, or completing a sale, produces a new one.
   */
  const idempotency = useSubmissionKey('counter');

  const { mutateAsync: charge, isPending: saving } = useMutation({
    mutationFn: () => counterSaleService.create(payload, idempotency.keyFor(payload)),
    onSuccess: invoice => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['counter-store-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
      queryClient.invalidateQueries({ queryKey: ['patient-summary'] });
      idempotency.reset();
      toast.success(
        t('counter.toast.completed', {
          number: invoice.invoiceNo,
          amount: formatCurrency(invoice.netAmount)
        })
      );
      navigate(`/billing/invoices/${invoice.id}`);
    },
    onError: (error: Error) => toast.error(error.message || t('counter.toast.failed'))
  });

  const pick = (tile: CatalogueTile) => {
    const key = cartKey(tab, tile.refId);

    setLines(current => {
      const existing = current.find(line => line.key === key);
      if (existing) {
        return current.map(line =>
          line.key === key ? { ...line, qty: line.qty + 1 } : line
        );
      }

      return [
        ...current,
        {
          key,
          kind: tab,
          refId: tile.refId,
          name: tile.name,
          code: tile.code,
          unitPrice: tile.unitPrice,
          qty: 1,
          percentageDiscount: 0,
          stockOnHand: tile.stockOnHand,
          uom: tile.uom,
          factorToBase: tile.factorToBase,
          unitOptions: tile.unitOptions
        }
      ];
    });
  };

  /**
   * Enter on the search box adds the best match and clears the field, so a
   * whole ticket can be built without the hands leaving the keyboard — and so a
   * barcode scanner, which is a keyboard that finishes with Enter, works with
   * no extra plumbing. An exact code match wins over a name match, because that
   * is what a scanner sends.
   *
   * It matches on the live term rather than the debounced one the grid is
   * showing: the operator has finished typing by the time they press Enter, and
   * adding whatever the grid had a moment ago would ring up the wrong thing.
   */
  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') return setSearch('');
    if (event.key !== 'Enter') return;

    event.preventDefault();
    const term = search.trim().toLowerCase();
    if (!term) return;

    const match =
      source.find(tile => tile.code.toLowerCase() === term) ??
      source.find(tile => matchesTerm(tile, term));

    if (!match) return toast.error(t('counter.toast.noMatch', { term: search.trim() }));
    if (match.stockOnHand !== undefined && match.stockOnHand <= 0) {
      return toast.error(t('counter.toast.outOfStock', { item: match.name }));
    }

    pick(match);
    setSearch('');
  };

  // Stock is dispensed from one store per sale, so medicine already on the
  // ticket belongs to the store it was picked from.
  const changeStore = (next: string) => {
    if (next === storeId) return;
    if (lines.some(line => line.kind === 'item')) {
      toast.error(t('counter.toast.clearMedicineFirst'));
      return;
    }
    setStoreId(next);
  };

  const setQty = (key: string, qty: number) =>
    setLines(current =>
      qty <= 0
        ? current.filter(line => line.key !== key)
        : current.map(line => (line.key === key ? { ...line, qty } : line))
    );

  /**
   * Switches a line to another of the item's units.
   *
   * The price, the unit name and the stock ceiling all move together, because
   * they are three faces of the same choice: a line priced per box and counted
   * in tablets is exactly the mix-up units exist to prevent. The quantity is
   * left as typed — the operator asked for three of something, and it is three
   * of whatever they just picked.
   */
  const setLineUnit = (key: string, uomId?: number) =>
    setLines(current =>
      current.map(line => {
        if (line.key !== key) return line;

        const option = line.unitOptions?.find(unit => unit.uomId === uomId);
        if (!option) return line;

        return {
          ...line,
          uomId: option.uomId,
          uom: option.name,
          unitPrice: option.unitPrice,
          factorToBase: option.factorToBase,
          stockOnHand: option.stockOnHand
        };
      })
    );

  const setLineDiscount = (key: string, percentage: number) =>
    setLines(current =>
      current.map(line =>
        line.key === key ? { ...line, percentageDiscount: percentage } : line
      )
    );

  const clearTicket = () => {
    setLines([]);
    setPercentageDiscount('');
    setAmountDiscount('');
    setTax('');
    setPaidAmount('');
    setTransactionNo('');
    setTicketOpen(false);
  };

  const handleCharge = () => {
    if (lines.length === 0) return toast.error(t('counter.toast.emptyTicket'));
    if (totals.overDiscounted) return toast.error(t('counter.toast.overDiscounted'));
    if (lines.some(line => line.kind === 'item') && !storeId) {
      return toast.error(t('counter.toast.selectStore'));
    }
    if (!patient && num(paidAmount) < totals.netAmount) {
      return toast.error(t('counter.toast.walkInFullPayment'));
    }
    return charge();
  };

  const ticket = (
    <TicketPanel
      lines={lines}
      totals={totals}
      mode={mode}
      patient={patient}
      onOpenPatient={() => setPatientOpen(true)}
      onClearPatient={() => setPatient(null)}
      onQtyChange={setQty}
      onLineUnitChange={setLineUnit}
      onLineDiscountChange={setLineDiscount}
      onRemoveLine={key => setLines(current => current.filter(line => line.key !== key))}
      onClearTicket={clearTicket}
      percentageDiscount={percentageDiscount}
      onPercentageDiscountChange={setPercentageDiscount}
      amountDiscount={amountDiscount}
      onAmountDiscountChange={setAmountDiscount}
      tax={tax}
      onTaxChange={setTax}
      paidBy={paidBy}
      onPaidByChange={setPaidBy}
      paidAmount={paidAmount}
      onPaidAmountChange={setPaidAmount}
      transactionNo={transactionNo}
      onTransactionNoChange={setTransactionNo}
      requiresFullPayment={!patient}
      saving={saving}
      onCharge={() => void handleCharge()}
    />
  );

  const itemCount = lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <>
      {/*
        No page heading here, unlike the rest of the app. The header already
        reads "Billing / Counter" two centimetres above, and on a till the strip
        it would occupy is worth more as two extra rows of catalogue — this is
        the one screen where vertical space is the scarce resource.
      */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className={cn('min-w-0 pb-20 lg:pb-0', touch ? 'space-y-3' : 'space-y-2')}>
          <div className={touch ? 'flex gap-2' : 'flex gap-1.5'}>
            <button
              type="button"
              onClick={() => setTab('service')}
              aria-pressed={tab === 'service'}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                touch ? 'h-12' : 'h-9',
                tab === 'service'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent'
              )}
            >
              <Stethoscope className="h-4 w-4" />
              {t('counter.services')}
            </button>
            <button
              type="button"
              onClick={() => setTab('item')}
              aria-pressed={tab === 'item'}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                touch ? 'h-12' : 'h-9',
                tab === 'item'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-accent'
              )}
            >
              <Pill className="h-4 w-4" />
              {t('counter.medicines')}
            </button>
          </div>

          <div className={cn('flex flex-col sm:flex-row', touch ? 'gap-2' : 'gap-1.5')}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={event => setSearch(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={
                  touch
                    ? tab === 'service'
                      ? t('counter.searchServices')
                      : t('counter.searchMedicines')
                    : t('counter.searchScan')
                }
                className={cn('pl-9 pr-10', touch ? 'h-12' : 'h-9')}
                aria-label={t('counter.searchAria')}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label={t('counter.clearSearch')}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {tab === 'item' ? (
              <NativeSelect
                value={storeId}
                onChange={event => changeStore(event.target.value)}
                className={cn('sm:w-56', touch ? 'h-12' : 'h-9')}
                aria-label={t('counter.dispenseFrom')}
              >
                <option value="">{t('counter.selectStore')}</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </NativeSelect>
            ) : (
              <NativeSelect
                value={employeeId}
                onChange={event => setEmployeeId(event.target.value)}
                className={cn('sm:w-56', touch ? 'h-12' : 'h-9')}
                aria-label={t('counter.doctor')}
              >
                <option value="">{t('counter.noDoctor')}</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </NativeSelect>
            )}
          </div>

          <CatalogueGrid
            tiles={tiles}
            inCart={inCart}
            loading={tab === 'service' ? loadingServices : loadingItems}
            mode={mode}
            emptyMessage={
              tab === 'item' && !storeId
                ? t('counter.chooseStore')
                : debouncedSearch
                  ? t('counter.noMatch')
                  : t('counter.nothingToSell')
            }
            onPick={pick}
          />
        </div>

        {/* top-20 is the 56px header plus the 24px page padding, so the ticket
            now starts exactly where it sits and runs to the bottom padding. */}
        <Card className="sticky top-20 hidden max-h-[calc(100vh-6.5rem)] overflow-hidden p-0 lg:flex lg:flex-col">
          {ticket}
        </Card>
      </div>

      {/* Below lg the ticket is a sheet: a 400px panel and a tile grid cannot
          both be finger-sized on a phone, so only one is on screen at a time. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card p-3 lg:hidden">
        <Button
          className="h-14 w-full justify-between text-base"
          disabled={lines.length === 0}
          onClick={() => setTicketOpen(true)}
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('counter.onTicket', { count: itemCount })}
          </span>
          <span className="tabular-nums">{formatCurrency(totals.netAmount)}</span>
        </Button>
      </div>

      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        {/* `sm:p-0` as well as `p-0`: the dialog's own padding is `p-4 sm:p-6`,
            and dropping only the unprefixed half would put a 24px gutter back
            around the ticket on anything wider than a phone. */}
        <DialogContent className="flex h-[92vh] max-h-[92vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:p-0">
          <DialogHeader className="border-b p-4 pr-12">
            <DialogTitle>{t('counter.ticket')}</DialogTitle>
            <DialogDescription>
              {t('counter.ticketLines', { count: itemCount })} ·{' '}
              {formatCurrency(totals.netAmount)}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1">{ticket}</div>
        </DialogContent>
      </Dialog>

      <Dialog open={patientOpen} onOpenChange={setPatientOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('counter.attachPatient')}</DialogTitle>
            <DialogDescription>{t('counter.attachPatientHint')}</DialogDescription>
          </DialogHeader>

          <Field label={t('counter.patient')}>
            <PatientSearchSelect
              value={patient}
              onChange={next => {
                setPatient(next);
                if (next) setPatientOpen(false);
              }}
              showSummary={false}
            />
          </Field>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Whether a catalogue entry answers to a search term. `term` is lower-cased. */
function matchesTerm(tile: CatalogueTile, term: string): boolean {
  return (
    tile.name.toLowerCase().includes(term) ||
    tile.code.toLowerCase().includes(term) ||
    (tile.subtitle ?? '').toLowerCase().includes(term)
  );
}

