import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSubmissionKey } from '@/lib/idempotency';
import { ArrowLeft, ArrowRight, Loader2, Trash2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
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
import { useDropdown } from '@/hooks/api/useDropdown';
import { stockTransferService, type StockTransferCreatePayload } from '@/services';
import { formatQty } from '@/lib/uom';
import type { StockBalanceRow } from '@/types/models';
import { StockLinePicker } from '../components/StockLinePicker';

interface DraftLine {
  itemStoreMapId: number;
  itemCode: string;
  itemName: string;
  onHand: number;
  /**
   * The unit both the balance and the quantity box are in. A transfer moves
   * base units — the same tablets arrive in the other store — and converts
   * nothing, so the unit has to be on screen for the figure to mean anything.
   */
  uom?: string | null;
  qty: string;
  remarks: string;
}

/**
 * Moves stock from one store to another.
 *
 * The destination is set once for the whole document rather than per line,
 * because a transfer is a physical journey: a box goes from the main store to
 * the pharmacy, and everything on the note travels together.
 */
export default function StockTransferPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /** Matches the `lg` breakpoint the two-column layout is built around. */
  const isWide = useMediaQuery('(min-width: 1024px)');
  /** Only reachable below lg, where the summary is a sheet rather than a column. */
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);

  const { data: stores = [] } = useDropdown('/dropdown/stores');

  useEffect(() => {
    if (!fromStoreId && stores.length > 0) setFromStoreId(String(stores[0].id));
  }, [stores, fromStoreId]);

  const changeFromStore = (next: string) => {
    if (lines.length > 0 && next !== fromStoreId) {
      setLines([]);
      toast.info(t('inventory.move.linesCleared'));
    }
    setFromStoreId(next);
  };

  const addLine = (row: StockBalanceRow) =>
    setLines(current => [
      ...current,
      {
        itemStoreMapId: row.itemStoreMapId,
        itemCode: row.itemCode,
        itemName: row.itemName,
        onHand: row.totalQty,
        uom: row.baseUom,
        qty: '',
        remarks: ''
      }
    ]);

  const updateLine = (id: number, patch: Partial<DraftLine>) =>
    setLines(current =>
      current.map(line => (line.itemStoreMapId === id ? { ...line, ...patch } : line))
    );

  const filled = lines.filter(line => Number(line.qty) > 0);
  /** Units across every filled line — shown beside the line count. */
  const movedUnits: number = filled.reduce((sum, line) => sum + Number(line.qty), 0);
  const overDrawn = filled.filter(line => Number(line.qty) > line.onHand);
  const sameStore = !!fromStoreId && fromStoreId === toStoreId;

  // Keeps a retry after a dropped connection from posting the document
  // twice. Reset on success so the next one is not answered from this one.
  const idempotency = useSubmissionKey('stock-transfer');

  const { mutateAsync: post, isPending: saving } = useMutation({
    mutationFn: (payload: StockTransferCreatePayload) =>
      stockTransferService.create(payload, idempotency.keyFor(payload)),
    onSuccess: () => {
      idempotency.reset();
      queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      toast.success(t('inventory.transfer.toast.posted'));
      navigate('/inventories/stock-transfers');
    },
    onError: (error: Error) =>
      toast.error(error.message || t('inventory.transfer.toast.failed'))
  });

  const handleSubmit = () => {
    if (!fromStoreId) return toast.error(t('inventory.transfer.toast.selectFrom'));
    if (!toStoreId) return toast.error(t('inventory.transfer.toast.selectTo'));
    if (sameStore) return toast.error(t('inventory.transfer.toast.sameStore'));
    if (filled.length === 0) return toast.error(t('inventory.transfer.toast.addLine'));
    if (overDrawn.length > 0) return toast.error(t('inventory.transfer.toast.overDrawn'));

    return post({
      transferDate,
      remarks: remarks.trim() || null,
      stockTransferItems: filled.map(line => ({
        stockItemStoreMapId: line.itemStoreMapId,
        transferStoreId: Number(toStoreId),
        transferQty: Number(line.qty),
        remarks: line.remarks.trim() || null
      }))
    });
  };

  const storeName = (id: string) => stores.find(store => String(store.id) === id)?.name;

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
        <Truck className="h-4 w-4" />
        {t('inventory.move.summary')}
      </p>

      {fromStoreId && toStoreId && !sameStore && (
        <p className="mt-2 text-sm">
          {storeName(fromStoreId)} <ArrowRight className="inline h-3 w-3" />{' '}
          {storeName(toStoreId)}
        </p>
      )}

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {t('inventory.move.lines')}
            <Badge variant="secondary" className="ml-2">
              {filled.length}
            </Badge>
          </dt>
          <dd className="tabular-nums">
            {t('inventory.move.units', { count: movedUnits })}
          </dd>
        </div>
      </dl>

      {overDrawn.length > 0 && (
        <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          {t('inventory.move.overDrawn')}
        </p>
      )}

      <Field
        label={t('inventory.move.remarks')}
        htmlFor="remarks"
        className="mt-4 border-t pt-4"
      >
        <Textarea
          id="remarks"
          rows={3}
          value={remarks}
          onChange={event => setRemarks(event.target.value)}
        />
      </Field>

      <Button
        className="mt-3 w-full"
        disabled={saving || filled.length === 0 || overDrawn.length > 0 || sameStore || !toStoreId}
        onClick={() => void handleSubmit()}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
        {t('inventory.transfer.submit')}
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
          onClick={() => navigate('/inventories/stock-transfers')}
          aria-label={t('inventory.transfer.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t('inventory.transfer.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('inventory.transfer.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* The bottom bar floats over the page, so the last row needs room. */}
        <div className="space-y-4 pb-20 lg:pb-0">
          <Card className="p-4">
            <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
              <Field label={t('inventory.transfer.from')} htmlFor="fromStoreId" required>
                <NativeSelect
                  id="fromStoreId"
                  value={fromStoreId}
                  onChange={event => changeFromStore(event.target.value)}
                >
                  <option value="">Select a store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <ArrowRight className="mb-2 hidden h-4 w-4 text-muted-foreground sm:block" />

              <Field
                label={t('inventory.transfer.to')}
                htmlFor="toStoreId"
                required
                error={sameStore ? t('inventory.transfer.differentStore') : undefined}
              >
                <NativeSelect
                  id="toStoreId"
                  value={toStoreId}
                  onChange={event => setToStoreId(event.target.value)}
                >
                  <option value="">Select a store</option>
                  {stores
                    .filter(store => String(store.id) !== fromStoreId)
                    .map(store => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                </NativeSelect>
              </Field>
            </div>

            <Field
              label={t('inventory.move.date')}
              htmlFor="transferDate"
              required
              className="mt-4 max-w-xs"
            >
              <DateField
                id="transferDate"
                value={transferDate}
                onChange={event => setTransferDate(event.target.value)}
              />
            </Field>
          </Card>

          <Card className="space-y-3 p-4">
            <p className="text-sm font-semibold">{t('inventory.move.stockToMove')}</p>
            <StockLinePicker
              storeId={fromStoreId}
              chosenIds={lines.map(line => line.itemStoreMapId)}
              onPick={addLine}
            />

            {lines.length === 0 ? (
              <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                {t('inventory.move.nothingAdded')}
              </p>
            ) : (
              <div className="space-y-2">
                {lines.map(line => {
                  const tooMany = Number(line.qty) > line.onHand;

                  return (
                    <div key={line.itemStoreMapId} className="rounded-lg border p-3">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{line.itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-mono">{line.itemCode}</span> ·{' '}
                            {t('inventory.move.onHand', {
                              qty: formatQty(line.onHand, line.uom)
                            })}
                          </p>
                        </div>

                        <div className="w-24 shrink-0">
                          <Input
                            value={line.qty}
                            inputMode="numeric"
                            placeholder={line.uom ?? t('inventory.transfer.movePlaceholder')}
                            aria-label={
                              line.uom
                                ? t('inventory.transfer.qtyAriaWithUnit', {
                                    item: line.itemName,
                                    unit: line.uom
                                  })
                                : t('inventory.transfer.qtyAria', { item: line.itemName })
                            }
                            className={tooMany ? 'border-destructive' : undefined}
                            onChange={event =>
                              updateLine(line.itemStoreMapId, { qty: event.target.value })
                            }
                          />
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-destructive"
                          aria-label={t('inventory.move.removeLine')}
                          onClick={() =>
                            setLines(current =>
                              current.filter(entry => entry.itemStoreMapId !== line.itemStoreMapId)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <Input
                        value={line.remarks}
                        placeholder={t('inventory.transfer.lineNote')}
                        aria-label={t('inventory.move.lineRemarks')}
                        className="mt-2"
                        onChange={event =>
                          updateLine(line.itemStoreMapId, { remarks: event.target.value })
                        }
                      />

                      {tooMany && (
                        <p className="mt-1 text-xs text-destructive">
                          {t('inventory.move.onlyOnHand', {
                            qty: formatQty(line.onHand, line.uom)
                          })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
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
              disabled={filled.length === 0}
              onClick={() => setSummaryOpen(true)}
            >
              <span className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {t('inventory.move.summary')}
                <Badge variant="secondary">{filled.length}</Badge>
              </span>
            </Button>
          </div>

          <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
            <DialogContent className="max-w-lg">
              {/* The bar that opened the sheet already names it. */}
              <DialogHeader className="sr-only">
                <DialogTitle>{t('inventory.move.summary')}</DialogTitle>
              </DialogHeader>
              {summary}
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
