import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useSubmissionKey } from '@/lib/idempotency';
import { ArrowLeft, ClipboardCheck, Loader2, Trash2 } from 'lucide-react';
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
import { DraftNotice } from '@/components/ui/draft-notice';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { useDropdown } from '@/hooks/api/useDropdown';
import { useFormDraft } from '@/hooks/useFormDraft';
import {
  inventoryService,
  stockAdjustmentService,
  type StockAdjustmentCreatePayload
} from '@/services';
import { cn, formatDate } from '@/lib/utils';
import { formatQty } from '@/lib/uom';
import type { StockBalanceRow } from '@/types/models';
import { StockLinePicker } from '../components/StockLinePicker';

interface DraftLine {
  /** Batch id doubles as the row key — a count is per batch, not per item. */
  itemBatchId: number;
  itemStoreMapId: number;
  itemCode: string;
  itemName: string;
  batchNo: string;
  expiryDate?: string | null;
  /**
   * Past its expiry date. A count still counts it — the packets are on the
   * shelf whether they are in date or not — but flagging it here is how the
   * storekeeper notices there is a write-off to raise.
   */
  isExpired: boolean;
  onHand: number;
  /**
   * The unit the shelf is counted in. A count writes the balance to whatever
   * is typed here, so a keeper who counts boxes into a box expecting tablets
   * does not create a small error — they replace the balance with a tenth of
   * it. Naming the unit is the cheapest guard there is.
   */
  uom?: string | null;
  salePrice: string;
  groundQty: string;
  remarks: string;
}

/** Everything the autosaved draft carries; see `useFormDraft` for the rules. */
interface CountDraft {
  storeId: string;
  adjustmentDate: string;
  remarks: string;
  lines: DraftLine[];
}

/**
 * A stock count correction.
 *
 * Counting happens batch by batch, not item by item: the backend refuses a line
 * without a batch, and rightly so — if two cartons of the same medicine expire
 * on different dates, a discrepancy has to be attributed to one of them or the
 * expiry data quietly stops meaning anything. Picking an item therefore expands
 * into a row per batch that still has stock.
 *
 * The number entered is what was actually counted, not the difference. Asking
 * for a delta is how counts get entered with the wrong sign; asking "how many
 * are there?" is a question the person holding the clipboard can answer without
 * arithmetic.
 */
export default function StockAdjustmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /** Matches the `lg` breakpoint the two-column layout is built around. */
  const isWide = useMediaQuery('(min-width: 1024px)');
  /** Only reachable below lg, where the summary is a sheet rather than a column. */
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [adjustmentDate, setAdjustmentDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [remarks, setRemarks] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);

  const { data: stores = [] } = useDropdown('/dropdown/stores');

  useEffect(() => {
    if (!storeId && stores.length > 0) setStoreId(String(stores[0].id));
  }, [stores, storeId]);

  /*
   * A count is walked round the store room with a clipboard and takes as long
   * as it takes. Losing an hour of counting to a stray back button is the one
   * failure this page really has to survive.
   */
  const draft = useFormDraft<CountDraft>(
    'stock-count',
    { storeId, adjustmentDate, remarks, lines },
    {
      enabled: lines.length > 0 || remarks.trim().length > 0,
      onRestore: saved => {
        // Set directly rather than through changeStore, which exists to throw
        // the lines away when the store changes.
        setStoreId(saved.storeId);
        setAdjustmentDate(saved.adjustmentDate);
        setRemarks(saved.remarks);
        setLines(saved.lines);
      }
    }
  );

  const changeStore = (next: string) => {
    if (lines.length > 0 && next !== storeId) {
      setLines([]);
      toast.info(t('inventory.move.linesCleared'));
    }
    setStoreId(next);
  };

  const [loadingBatches, setLoadingBatches] = useState(false);

  const addLine = async (row: StockBalanceRow) => {
    setLoadingBatches(true);
    try {
      const batches = await inventoryService.getBatches(row.itemStoreMapId);
      if (batches.length === 0) {
        toast.error(t('inventory.count.toast.noBatches', { item: row.itemName }));
        return;
      }

      setLines(current => [
        ...current,
        ...batches
          .filter(batch => !current.some(line => line.itemBatchId === batch.id))
          .map(batch => ({
            itemBatchId: batch.id,
            itemStoreMapId: row.itemStoreMapId,
            itemCode: row.itemCode,
            itemName: row.itemName,
            batchNo: batch.batchNo,
            expiryDate: batch.expiryDate,
            isExpired: batch.isExpired,
            onHand: batch.batchQty,
            uom: row.baseUom,
            salePrice: row.salePrice,
            groundQty: '',
            remarks: ''
          }))
      ]);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoadingBatches(false);
    }
  };

  const updateLine = (batchId: number, patch: Partial<DraftLine>) =>
    setLines(current =>
      current.map(line => (line.itemBatchId === batchId ? { ...line, ...patch } : line))
    );

  const deltaOf = (line: DraftLine) =>
    line.groundQty === '' ? null : Number(line.groundQty) - line.onHand;

  // A blank line means "not counted"; a counted zero is a real correction, so
  // the two must not be conflated.
  const counted = lines.filter(line => /^\d+$/.test(line.groundQty));
  const changed = counted.filter(line => deltaOf(line) !== 0);
  const shortages = changed.filter(line => (deltaOf(line) ?? 0) < 0);
  const surpluses = changed.filter(line => (deltaOf(line) ?? 0) > 0);

  // Keeps a retry after a dropped connection from posting the document
  // twice. Reset on success so the next one is not answered from this one.
  const idempotency = useSubmissionKey('stock-adjustment');

  const { mutateAsync: post, isPending: saving } = useMutation({
    mutationFn: (payload: StockAdjustmentCreatePayload) =>
      stockAdjustmentService.create(payload, idempotency.keyFor(payload)),
    onSuccess: () => {
      idempotency.reset();
      draft.clear();
      queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      toast.success(t('inventory.count.toast.posted'));
      navigate('/inventories/stock-adjustments');
    },
    onError: (error: Error) => toast.error(error.message || t('inventory.count.toast.failed'))
  });

  const handleSubmit = () => {
    if (!storeId) return toast.error(t('inventory.count.toast.selectStore'));
    if (counted.length === 0) return toast.error(t('inventory.count.toast.enterCount'));

    return post({
      adjustmentDate,
      remarks: remarks.trim() || null,
      stockAdjustmentItems: counted.map(line => ({
        itemStoreMapId: line.itemStoreMapId,
        itemBatchId: line.itemBatchId,
        groundQty: Number(line.groundQty),
        itemPrice: line.salePrice,
        remarks: line.remarks.trim() || null
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
        <ClipboardCheck className="h-4 w-4" />
        {t('inventory.count.summary')}
      </p>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t('inventory.count.counted')}</dt>
          <dd className="tabular-nums">
            {t('inventory.count.countedOf', {
              counted: counted.length,
              total: lines.length
            })}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t('inventory.count.shortages')}</dt>
          <dd className="tabular-nums text-destructive">{shortages.length}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t('inventory.count.surpluses')}</dt>
          <dd className="tabular-nums text-info">{surpluses.length}</dd>
        </div>
        <div className="flex justify-between border-t pt-2 font-medium">
          <dt>{t('inventory.count.linesChanging')}</dt>
          <dd className="tabular-nums">{changed.length}</dd>
        </div>
      </dl>

      {counted.length > 0 && changed.length === 0 && (
        <p className="mt-2 rounded-md bg-success/10 px-2 py-1.5 text-xs text-success">
          {t('inventory.count.allMatch')}
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
        disabled={saving || counted.length === 0}
        onClick={() => void handleSubmit()}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ClipboardCheck className="h-4 w-4" />
        )}
        {t('inventory.count.submit')}
      </Button>

      {/* No relative time here: nothing re-renders while the form sits
          idle, so it would freeze at "1 second ago" and read as a lie. */}
      {draft.savedAt && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t('inventory.count.draftSaved')}
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
          onClick={() => navigate('/inventories/stock-adjustments')}
          aria-label={t('inventory.count.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t('inventory.count.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('inventory.count.subtitle')}</p>
        </div>
      </div>

      <DraftNotice
        savedAt={draft.offeredAt}
        description={t('inventory.count.draftDescription')}
        onRestore={draft.restore}
        onDiscard={draft.discard}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* The bottom bar floats over the page, so the last row needs room. */}
        <div className="space-y-4 pb-20 lg:pb-0">
          <Card className="grid gap-4 p-4 sm:grid-cols-2">
            <Field label={t('inventory.issue.store')} htmlFor="storeId" required>
              <NativeSelect
                id="storeId"
                value={storeId}
                onChange={event => changeStore(event.target.value)}
              >
                <option value="">{t('inventory.move.selectStore')}</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label={t('inventory.count.countDate')} htmlFor="adjustmentDate" required>
              <DateField
                id="adjustmentDate"
                value={adjustmentDate}
                onChange={event => setAdjustmentDate(event.target.value)}
              />
            </Field>
          </Card>

          <Card className="space-y-3 p-4">
            <p className="text-sm font-semibold">{t('inventory.count.countedStock')}</p>
            <StockLinePicker
              storeId={storeId}
              chosenIds={[...new Set(lines.map(line => line.itemStoreMapId))]}
              onPick={row => void addLine(row)}
            />

            {loadingBatches && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('inventory.count.loadingBatches')}
              </p>
            )}

            {lines.length === 0 ? (
              <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                {t('inventory.count.nothingAdded')}
              </p>
            ) : (
              <div className="space-y-2">
                {lines.map(line => {
                  const delta = deltaOf(line);

                  return (
                    <div key={line.itemBatchId} className="rounded-lg border p-3">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{line.itemName}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('inventory.count.batch')}{' '}
                            <span className="font-mono">{line.batchNo}</span>
                            {line.expiryDate
                              ? ` · ${t('inventory.count.expiry', {
                                  date: formatDate(line.expiryDate)
                                })}`
                              : ''}{' '}
                            ·{' '}
                            {t('inventory.count.systemSays', {
                              qty: formatQty(line.onHand, line.uom)
                            })}
                            {line.isExpired && (
                              <span className="ml-1 rounded bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive">
                                {t('inventory.count.expired')}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="w-24 shrink-0">
                          <Input
                            value={line.groundQty}
                            inputMode="numeric"
                            placeholder={line.uom ?? t('inventory.count.countedPlaceholder')}
                            aria-label={
                              line.uom
                                ? t('inventory.count.qtyAriaWithUnit', {
                                    item: line.itemName,
                                    batch: line.batchNo,
                                    unit: line.uom
                                  })
                                : t('inventory.count.qtyAria', {
                                    item: line.itemName,
                                    batch: line.batchNo
                                  })
                            }
                            onChange={event =>
                              updateLine(line.itemBatchId, { groundQty: event.target.value })
                            }
                          />
                        </div>

                        <div className="w-20 shrink-0 text-right">
                          {delta === null ? (
                            <span className="text-xs text-muted-foreground">
                              {t('inventory.count.notCounted')}
                            </span>
                          ) : delta === 0 ? (
                            <Badge variant="success">{t('inventory.count.matches')}</Badge>
                          ) : (
                            <span
                              className={cn(
                                'text-sm font-medium tabular-nums',
                                delta > 0 ? 'text-info' : 'text-destructive'
                              )}
                            >
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-destructive"
                          aria-label={t('inventory.move.removeLine')}
                          onClick={() =>
                            setLines(current =>
                              current.filter(entry => entry.itemBatchId !== line.itemBatchId)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <Input
                        value={line.remarks}
                        placeholder={t('inventory.count.lineNote')}
                        aria-label={t('inventory.move.lineRemarks')}
                        className="mt-2"
                        onChange={event =>
                          updateLine(line.itemBatchId, { remarks: event.target.value })
                        }
                      />
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
              disabled={counted.length === 0}
              onClick={() => setSummaryOpen(true)}
            >
              <span className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                {t('inventory.count.summary')}
                <Badge variant="secondary">{counted.length}</Badge>
              </span>
            </Button>
          </div>

          <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
            <DialogContent className="max-w-lg">
              {/* The bar that opened the sheet already names it. */}
              <DialogHeader className="sr-only">
                <DialogTitle>{t('inventory.count.summary')}</DialogTitle>
              </DialogHeader>
              {summary}
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
