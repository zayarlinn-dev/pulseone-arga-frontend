import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, PackageMinus, Trash2 } from 'lucide-react';
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
import {
  stockConsumptionService,
  stockDamageService,
  type StockIssueLinePayload
} from '@/services';
import { formatCurrency } from '@/lib/utils';
import { formatQty } from '@/lib/uom';
import type { StockBalanceRow } from '@/types/models';
import { StockLinePicker } from '../components/StockLinePicker';

interface DraftLine {
  itemStoreMapId: number;
  itemCode: string;
  itemName: string;
  onHand: number;
  /**
   * The unit onHand is counted in and the quantity box is keyed in. Damage and
   * consumption are base units end to end — this document converts nothing —
   * so naming the unit is what tells the keeper whether "6" is six tablets or
   * six boxes.
   */
  uom?: string | null;
  salePrice: string;
  qty: string;
  remarks: string;
}

/**
 * Damage and consumption are the same document with a different reason, so they
 * share a screen: pick a store, pick what is leaving it, say how much.
 *
 * They differ only in what the movement means — stock written off as unusable
 * versus stock used internally by a ward — which is why the wording, the
 * endpoint and the ledger reference change but nothing else does.
 */
const KINDS = {
  damage: {
    listPath: '/inventories/stock-damages',
    service: stockDamageService,
    build: (date: string, remarks: string | null, lines: StockIssueLinePayload[]) => ({
      damageDate: date,
      remarks,
      stockDamageItems: lines
    })
  },
  consumption: {
    listPath: '/inventories/stock-consumptions',
    service: stockConsumptionService,
    build: (date: string, remarks: string | null, lines: StockIssueLinePayload[]) => ({
      consumptionDate: date,
      remarks,
      stockConsumptionItems: lines
    })
  }
} as const;

export type StockIssueKind = keyof typeof KINDS;

export default function StockIssuePage({ kind }: { kind: StockIssueKind }) {
  const { t } = useTranslation();
  // The two documents differ only in wording; both strings are needed in several
  // places, so they are resolved once per render.
  const qtyLabel = t(`inventory.issue.kind.${kind}.qtyLabel`);
  const actionLabel = t(`inventory.issue.kind.${kind}.action`);
  const config = KINDS[kind];
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  /** Matches the `lg` breakpoint the two-column layout is built around. */
  const isWide = useMediaQuery('(min-width: 1024px)');
  /** Only reachable below lg, where the summary is a sheet rather than a column. */
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [documentDate, setDocumentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);

  const { data: stores = [] } = useDropdown('/dropdown/stores');

  useEffect(() => {
    if (!storeId && stores.length > 0) setStoreId(String(stores[0].id));
  }, [stores, storeId]);

  // The lines belong to the store they were picked from; changing it would
  // leave rows pointing at stock that is somewhere else.
  const changeStore = (next: string) => {
    if (lines.length > 0 && next !== storeId) {
      setLines([]);
      toast.info(t('inventory.move.linesCleared'));
    }
    setStoreId(next);
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
        salePrice: row.salePrice,
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
  const issuedUnits: number = filled.reduce((sum, line) => sum + Number(line.qty), 0);
  const overDrawn = filled.filter(line => Number(line.qty) > line.onHand);
  const totalValue = filled.reduce(
    (sum, line) => sum + Number(line.qty) * Number(line.salePrice),
    0
  );

  const { mutateAsync: post, isPending: saving } = useMutation({
    // The two payload shapes differ only in their field names, so the config
    // builds it and the mutation stays one function.
    mutationFn: (payload: ReturnType<(typeof config)['build']>) =>
      (config.service.create as (body: unknown) => Promise<unknown>)(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
      queryClient.invalidateQueries({ queryKey: [config.listPath] });
      toast.success(t('inventory.issue.toast.recorded', { action: actionLabel }));
      navigate(config.listPath);
    },
    onError: (error: Error) => toast.error(error.message || t('inventory.issue.toast.failed'))
  });

  const handleSubmit = () => {
    if (!storeId) return toast.error(t('inventory.issue.toast.selectStore'));
    if (filled.length === 0) return toast.error(t('inventory.issue.toast.addLine'));
    if (overDrawn.length > 0) return toast.error(t('inventory.issue.toast.overDrawn'));

    return post(
      config.build(
        documentDate,
        remarks.trim() || null,
        filled.map(line => ({
          itemStoreMapId: line.itemStoreMapId,
          qty: Number(line.qty),
          itemPrice: line.salePrice,
          remarks: line.remarks.trim() || null
        }))
      )
    );
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
        <PackageMinus className="h-4 w-4" />
        {t('inventory.move.summary')}
      </p>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            {t('inventory.move.lines')}
            <Badge variant="secondary" className="ml-2">
              {filled.length}
            </Badge>
          </dt>
          <dd className="tabular-nums">
            {t('inventory.move.units', { count: issuedUnits })}
          </dd>
        </div>
        <div className="flex justify-between border-t pt-2 font-medium">
          <dt>{t('inventory.issue.valueAtSalePrice')}</dt>
          <dd className="tabular-nums">{formatCurrency(totalValue)}</dd>
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
        disabled={saving || filled.length === 0 || overDrawn.length > 0}
        onClick={() => void handleSubmit()}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <PackageMinus className="h-4 w-4" />
        )}
        {actionLabel}
      </Button>

      <p className="mt-2 text-xs text-muted-foreground">
        {t('inventory.issue.noEditNote')}
      </p>
    </>
  );

  return (
    <>
      <div className="mb-4 flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 h-8 w-8"
          onClick={() => navigate(config.listPath)}
          aria-label={t('inventory.issue.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t(`inventory.issue.kind.${kind}.title`)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t(`inventory.issue.kind.${kind}.lede`)}
          </p>
        </div>
      </div>

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

            <Field label={t('inventory.move.date')} htmlFor="documentDate" required>
              <DateField
                id="documentDate"
                value={documentDate}
                onChange={event => setDocumentDate(event.target.value)}
              />
            </Field>
          </Card>

          <Card className="space-y-3 p-4">
            <p className="text-sm font-semibold">{t('inventory.move.addStock')}</p>
            <StockLinePicker
              storeId={storeId}
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
                            {formatQty(line.onHand, line.uom)} on hand
                          </p>
                        </div>

                        <div className="w-24 shrink-0">
                          <Input
                            value={line.qty}
                            inputMode="numeric"
                            placeholder={line.uom ?? qtyLabel}
                            aria-label={
                              line.uom
                                ? t('inventory.issue.qtyAriaWithUnit', {
                                    label: qtyLabel,
                                    item: line.itemName,
                                    unit: line.uom
                                  })
                                : t('inventory.issue.qtyAria', {
                                    label: qtyLabel,
                                    item: line.itemName
                                  })
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
                              current.filter(
                                entry => entry.itemStoreMapId !== line.itemStoreMapId
                              )
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <Input
                        value={line.remarks}
                        placeholder={t('inventory.issue.lineReason')}
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
                <PackageMinus className="h-5 w-5" />
                {t('inventory.move.summary')}
                <Badge variant="secondary">{filled.length}</Badge>
              </span>
              <span className="tabular-nums">{formatCurrency(totalValue)}</span>
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
