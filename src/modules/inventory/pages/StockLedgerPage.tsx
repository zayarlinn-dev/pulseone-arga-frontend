import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2, Printer, ScrollText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { DateField } from '@/components/ui/date-field';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { useDropdown } from '@/hooks/api/useDropdown';
import { inventoryService } from '@/services';
import { formatDate, formatDateTime } from '@/lib/utils';
import { formatQty } from '@/lib/uom';
import { LedgerItemPicker, type LedgerItem } from '@/modules/inventory/components/LedgerItemPicker';
import type {
  StockLedgerMovement,
  StockLedgerReport,
  StockLedgerUsage,
  StockReferenceType,
  TransitionType
} from '@/types/models';

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_PERIOD_DAYS = 30;

/**
 * Catalogue key per document type, spelled out rather than interpolated.
 *
 * `t()` is typed against the English catalogue, so a template-built key is not
 * checkable and a document type added to the backend enum would reach the
 * screen as a raw `inventory.ledger.referenceType.whatever`. Written this way,
 * it fails the build instead.
 */
const REFERENCE_TYPE_KEYS = {
  open: 'inventory.ledger.referenceType.open',
  grn: 'inventory.ledger.referenceType.grn',
  return_grn: 'inventory.ledger.referenceType.return_grn',
  transfer: 'inventory.ledger.referenceType.transfer',
  invoice: 'inventory.ledger.referenceType.invoice',
  refund_invoice: 'inventory.ledger.referenceType.refund_invoice',
  pharmacy: 'inventory.ledger.referenceType.pharmacy',
  damage: 'inventory.ledger.referenceType.damage',
  adjustment: 'inventory.ledger.referenceType.adjustment',
  consumption: 'inventory.ledger.referenceType.consumption'
} as const satisfies Record<StockReferenceType, string>;

const DIRECTION_KEYS = {
  in: 'inventory.ledger.direction.in',
  out: 'inventory.ledger.direction.out'
} as const satisfies Record<TransitionType, string>;

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The stock card: one item's movements in the order they happened, each with
 * the balance it left behind.
 *
 * This is the screen a stock check is done from. The balance report says how
 * much of something there is; when the shelf disagrees with it, the only
 * useful next question is how it got to that number — which document, on which
 * day, out of which batch, by whose hand. Answering that by opening the goods
 * received notes, then the transfers, then the pharmacy sales one screen at a
 * time is how it was done before, and the arithmetic was left to the person
 * doing it.
 *
 * Three things make it an audit rather than a list, and all three come from the
 * backend rather than being summed here:
 *
 *  - the opening balance, so a period that starts mid-history is still true;
 *  - the reconciliation of the whole history against the recorded balance,
 *    which is the invariant the stock design rests on;
 *  - the breakdown by document type, which is the "where did it all go"
 *    question the ledger is usually opened for.
 */
export default function StockLedgerPage() {
  const { t } = useTranslation();
  const { data: stores = [] } = useDropdown('/dropdown/stores');

  // The item and store come off the query string so the ledger can be linked
  // to: the stock balance sends a row straight here, which is the path someone
  // checking a suspicious figure actually takes.
  const [searchParams, setSearchParams] = useSearchParams();

  const [item, setItem] = useState<LedgerItem | null>(null);
  const [storeFilter, setStoreFilter] = useState(searchParams.get('storeId') ?? '');
  const [fromDate, setFromDate] = useState(() => isoDaysAgo(DEFAULT_PERIOD_DAYS));
  const [toDate, setToDate] = useState(isoToday);
  const [referenceType, setReferenceType] = useState<StockReferenceType | ''>('');
  const [transitionType, setTransitionType] = useState<TransitionType | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const linkedItemId = searchParams.get('itemId');
  const itemId = item?.id ?? (linkedItemId ? Number(linkedItemId) : null);

  const filters = useMemo(
    () => ({
      itemId: itemId ?? 0,
      ...(storeFilter ? { storeId: storeFilter } : {}),
      fromDate,
      toDate,
      ...(referenceType ? { referenceType } : {}),
      ...(transitionType ? { transitionType } : {}),
      page,
      limit: pageSize
    }),
    [itemId, storeFilter, fromDate, toDate, referenceType, transitionType, page, pageSize]
  );

  const {
    data: report,
    isLoading,
    isFetching,
    error
  } = useQuery({
    queryKey: ['stock-ledger', filters],
    enabled: Boolean(itemId),
    placeholderData: keepPreviousData,
    queryFn: () => inventoryService.getStockLedger(filters)
  });

  // A ledger arrived at by link knows the item number and nothing else; the
  // report carries the code and name, so the picker is filled in from the
  // answer. Guarded on the id in the URL still matching, or clearing the item
  // would be undone by the response that was already in flight.
  useEffect(() => {
    if (!item && report && String(report.itemId) === linkedItemId) {
      setItem({ id: report.itemId, itemCode: report.itemCode, itemName: report.itemName });
    }
  }, [report, item, linkedItemId]);

  // Any change to what is being asked about starts the ledger at the top again:
  // page four of the previous item's history is not an answer to this question.
  const resetPage = () => setPage(1);

  /** Keeps the address bar saying what the screen is showing, so it can be sent. */
  const syncUrl = (nextItemId: number | null, nextStoreId: string) => {
    const params: Record<string, string> = {};
    if (nextItemId) params.itemId = String(nextItemId);
    if (nextStoreId) params.storeId = nextStoreId;
    setSearchParams(params, { replace: true });
  };

  const chooseItem = (next: LedgerItem | null) => {
    setItem(next);
    syncUrl(next?.id ?? null, storeFilter);
    setReferenceType('');
    setTransitionType('');
    resetPage();
  };

  const chooseStore = (next: string) => {
    setStoreFilter(next);
    syncUrl(itemId, next);
    resetPage();
  };

  if (!itemId) {
    return (
      <>
        <LedgerHeader />
        <Card className="mx-auto max-w-xl p-6 text-center">
          <ScrollText className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h2 className="text-sm font-semibold">{t('inventory.ledger.pickItem')}</h2>
          <p className="mx-auto mb-4 mt-1 max-w-sm text-xs text-muted-foreground">
            {t('inventory.ledger.pickItemHint')}
          </p>
          <div className="text-left">
            <LedgerItemPicker value={null} onChange={chooseItem} />
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <LedgerHeader />

      <Card className="mb-4 grid gap-4 p-4 lg:grid-cols-4" data-print-hide>
        <Field label={t('inventory.balance.column.item')} className="lg:col-span-2">
          <LedgerItemPicker value={item} onChange={chooseItem} />
        </Field>

        <Field
          label={t('inventory.balance.column.store')}
          htmlFor="ledgerStore"
          hint={storeFilter ? undefined : t('inventory.ledger.allStoresNote')}
        >
          <NativeSelect
            id="ledgerStore"
            value={storeFilter}
            onChange={event => chooseStore(event.target.value)}
          >
            <option value="">{t('inventory.ledger.allStores')}</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('common.label.from')} htmlFor="ledgerFrom">
            <DateField
              id="ledgerFrom"
              value={fromDate}
              max={toDate}
              onChange={event => {
                setFromDate(event.target.value);
                resetPage();
              }}
            />
          </Field>
          <Field label={t('common.label.to')} htmlFor="ledgerTo">
            <DateField
              id="ledgerTo"
              value={toDate}
              min={fromDate}
              onChange={event => {
                setToDate(event.target.value);
                resetPage();
              }}
            />
          </Field>
        </div>
      </Card>

      {error ? (
        <Card className="p-6 text-center text-sm text-destructive">
          {(error as Error).message || t('inventory.ledger.failed')}
        </Card>
      ) : isLoading || !report ? (
        <div className="flex h-40 items-center justify-center rounded-lg border">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <LedgerBody
          report={report}
          fetching={isFetching}
          referenceType={referenceType}
          transitionType={transitionType}
          onFilter={(nextReference, nextTransition) => {
            setReferenceType(nextReference);
            setTransitionType(nextTransition);
            resetPage();
          }}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={size => {
            setPageSize(size);
            resetPage();
          }}
        />
      )}
    </>
  );
}

function LedgerHeader() {
  const { t } = useTranslation();

  return (
    <PageHeader
      title={t('inventory.ledger.title')}
      description={t('inventory.ledger.description')}
      actions={
        <Button variant="outline" onClick={() => window.print()} data-print-hide>
          <Printer className="size-4" />
          {t('common.action.print')}
        </Button>
      }
    />
  );
}

interface LedgerBodyProps {
  report: StockLedgerReport;
  fetching: boolean;
  referenceType: StockReferenceType | '';
  transitionType: TransitionType | '';
  onFilter: (referenceType: StockReferenceType | '', transitionType: TransitionType | '') => void;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function LedgerBody({
  report,
  fetching,
  referenceType,
  transitionType,
  onFilter,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange
}: LedgerBodyProps) {
  const { t } = useTranslation();
  const unit = report.baseUom;
  const qty = (value: number) => formatQty(value, unit);

  const usageGroups = useMemo(() => groupUsage(report.usage), [report.usage]);
  const movements = report.movements ?? [];

  const columns: Column<StockLedgerMovement>[] = [
    {
      header: t('inventory.ledger.column.date'),
      sortable: false,
      className: 'whitespace-nowrap',
      // The time is part of the answer, not decoration: several documents a day
      // against one item is normal, and their order within the day is the only
      // thing that makes the balance column reconstructable.
      render: row => formatDateTime(row.transitionDate)
    },
    {
      hideBelow: 'sm',
      header: t('inventory.ledger.column.document'),
      sortable: false,
      render: row => <ReferenceBadge referenceType={row.referenceType} />
    },
    {
      hideBelow: 'lg',
      header: t('inventory.ledger.column.reference'),
      sortable: false,
      className: 'font-mono text-xs',
      render: row => row.referenceNo || '—'
    },
    {
      hideBelow: 'md',
      header: t('inventory.ledger.column.store'),
      sortable: false,
      render: row => row.storeName || '—'
    },
    {
      hideBelow: 'lg',
      header: t('inventory.ledger.column.batch'),
      sortable: false,
      render: row =>
        row.itemBatchId ? (
          // Straight through to the recall screen: a ledger line is often read
          // because of the batch on it, and the lot trace is the next question.
          <Link
            to={`/inventories/lots/${row.itemBatchId}`}
            title={t('inventory.ledger.traceLot')}
            className="inline-flex flex-col hover:underline"
          >
            <span className="font-mono text-xs">{row.batchNo || `#${row.itemBatchId}`}</span>
            {row.expiryDate && (
              <span className="text-xs text-muted-foreground">
                {t('inventory.count.expiry', { date: formatDate(row.expiryDate) })}
              </span>
            )}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
    },
    {
      header: t('inventory.ledger.column.in'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row =>
        row.inQty > 0 ? (
          <span className="font-medium text-success">+{row.inQty.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
    },
    {
      header: t('inventory.ledger.column.out'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row =>
        row.outQty > 0 ? (
          <span className="font-medium text-destructive">−{row.outQty.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
    },
    // Withdrawn while a filter is on. See balanceApplicable: a balance down a
    // selection of lines is a figure the item never actually stood at.
    ...(report.balanceApplicable
      ? [
          {
            header: t('inventory.ledger.column.balance'),
            sortable: false,
            className: 'text-right tabular-nums font-semibold',
            render: (row: StockLedgerMovement) => row.balance.toLocaleString()
          }
        ]
      : [])
  ];

  const filterLabel = transitionType
    ? t(DIRECTION_KEYS[transitionType])
    : referenceType
      ? t(REFERENCE_TYPE_KEYS[referenceType])
      : '';

  return (
    <>
      {report.drift === 0 ? (
        <Card className="mb-4 flex items-start gap-3 border-success/40 bg-success/5 p-3">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          <p className="text-sm">
            <span className="font-medium">{t('inventory.ledger.reconciled')}</span>{' '}
            <span className="text-muted-foreground">
              {t('inventory.ledger.reconciledHint')}
            </span>
          </p>
        </Card>
      ) : (
        <Card className="mb-4 flex items-start gap-3 border-destructive/40 bg-destructive/5 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm">
            <span className="font-medium">{t('inventory.ledger.driftTitle')}</span>{' '}
            <span className="text-muted-foreground">
              {t('inventory.ledger.driftBody', {
                recorded: qty(report.recordedQty),
                ledger: qty(report.ledgerBalance),
                drift: qty(report.drift)
              })}
            </span>
          </p>
        </Card>
      )}

      {/*
        Four figures, not five. "On hand now" used to sit permanently beside the
        closing balance, and on the default period — which runs to today — it is
        the same number twice. It appears only when the two actually differ,
        which is the case it was there for: stock that moved after the period
        being read.
      */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label={t('inventory.ledger.openingBalance')} value={qty(report.openingBalance)} />
        <SummaryCard
          label={t('inventory.ledger.received')}
          value={`+${qty(report.totalIn)}`}
          tone="in"
        />
        <SummaryCard
          label={t('inventory.ledger.issued')}
          value={`−${qty(report.totalOut)}`}
          tone="out"
        />
        <SummaryCard
          label={t('inventory.ledger.closingBalance')}
          value={qty(report.closingBalance)}
          strong
          note={
            report.closingBalance !== report.recordedQty
              ? t('inventory.ledger.onHandNote', { qty: qty(report.recordedQty) })
              : undefined
          }
        />
      </div>

      <section className="mb-6">
        {/* The heading carries the instruction. It used to have an explanatory
            line of its own underneath, which cost a third row of vertical space
            to say what pressing a chip already demonstrates. */}
        <h2 className="mb-2 text-sm font-semibold">
          {t('inventory.ledger.usageTitle')}{' '}
          <span className="font-normal text-muted-foreground">
            {t('inventory.ledger.usageHint')}
          </span>
        </h2>

        {usageGroups.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            {t('inventory.ledger.usageEmpty')}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {usageGroups.map(group => (
              <UsageChip
                key={group.referenceType}
                group={group}
                unit={unit}
                active={referenceType === group.referenceType && !transitionType}
                onSelect={() =>
                  onFilter(referenceType === group.referenceType ? '' : group.referenceType, '')
                }
              />
            ))}
          </div>
        )}
      </section>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {t('inventory.ledger.linesTitle')}
          <span className="font-normal text-muted-foreground">
            {t('inventory.ledger.period', {
              from: formatDate(report.fromDate),
              to: formatDate(report.toDate)
            })}
          </span>
          {fetching && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
        </h2>

        <div className="flex flex-wrap items-center gap-2" data-print-hide>
          {/* Direction is a separate axis from the document type, and picking
              one clears the other: "issues only" and "goods received only" are
              questions that cannot both be asked of the same list. */}
          {(['in', 'out'] as const).map(direction => (
            <Button
              key={direction}
              variant={transitionType === direction ? 'default' : 'outline'}
              size="sm"
              aria-pressed={transitionType === direction}
              onClick={() => onFilter('', transitionType === direction ? '' : direction)}
            >
              {t(DIRECTION_KEYS[direction])}
            </Button>
          ))}

          {!report.balanceApplicable && (
            <>
              <Badge variant="info">{t('inventory.ledger.filtered', { type: filterLabel })}</Badge>
              <Button variant="ghost" size="sm" onClick={() => onFilter('', '')}>
                {t('inventory.ledger.showAll')}
              </Button>
            </>
          )}
        </div>
      </div>

      {!report.balanceApplicable && (
        <p className="mb-2 text-xs text-muted-foreground">
          {t('inventory.ledger.filteredBalanceNote')}
        </p>
      )}

      {/* The brought-forward line is what makes page two readable: without it
          the first balance on the page appears out of nowhere. */}
      {report.balanceApplicable && movements.length > 0 && (
        <p className="mb-2 flex items-baseline justify-between rounded-md border border-dashed px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {page > 1
              ? t('inventory.ledger.broughtForward')
              : t('inventory.ledger.openingBalance')}
          </span>
          <span className="font-semibold tabular-nums">{qty(report.pageOpening)}</span>
        </p>
      )}

      <DataTable
        columns={columns}
        rows={movements}
        rowKey={row => row.id}
        emptyMessage={t('inventory.ledger.empty')}
      />

      {report.balanceApplicable && movements.length > 0 && (
        <p className="mt-2 flex items-baseline justify-between rounded-md border px-3 py-2 text-sm">
          <span className="text-muted-foreground">
            {page < report.totalPages
              ? t('inventory.ledger.carriedForward')
              : t('inventory.ledger.closingBalance')}
          </span>
          <span className="font-semibold tabular-nums">
            {qty(movements[movements.length - 1].balance)}
          </span>
        </p>
      )}

      <div data-print-hide>
        <Pagination
          currentPage={page}
          totalPages={report.totalPages}
          pageSize={pageSize}
          totalCount={report.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  strong,
  note
}: {
  label: string;
  value: string;
  tone?: 'in' | 'out';
  strong?: boolean;
  /** Shown under the figure only when there is something extra to say. */
  note?: string;
}) {
  return (
    <Card className="p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={[
          'mt-1 truncate text-lg tabular-nums',
          strong ? 'font-semibold' : 'font-medium',
          tone === 'in' ? 'text-success' : '',
          tone === 'out' ? 'text-destructive' : ''
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {value}
      </p>
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
    </Card>
  );
}

/**
 * One document type's effect on the period, both directions folded together.
 *
 * The API reports usage per (document type, direction), which is the right
 * shape for a report and the wrong one for a row of filters: a transfer moves
 * stock both ways, so it arrived here as two chips reading "+60" and "−60" —
 * and because the chip filters on the document type alone, both of them did
 * exactly the same thing when clicked. Nine document types produced twelve
 * controls, three of which were duplicates of another.
 */
interface UsageGroup {
  referenceType: StockReferenceType;
  in: number;
  out: number;
  movements: number;
}

function groupUsage(usage: StockLedgerUsage[] | null | undefined): UsageGroup[] {
  const groups = new Map<StockReferenceType, UsageGroup>();

  // Defended rather than trusted: this is a network boundary, and a period an
  // item did not move in is an ordinary thing to ask about.
  for (const entry of usage ?? []) {
    const group = groups.get(entry.referenceType) ?? {
      referenceType: entry.referenceType,
      in: 0,
      out: 0,
      movements: 0
    };
    if (entry.transitionType === 'in') group.in += entry.qty;
    else group.out += entry.qty;
    group.movements += entry.movements;
    groups.set(entry.referenceType, group);
  }

  // Largest effect first, so whatever moved the most stock is read first
  // regardless of which direction it moved it in.
  return [...groups.values()].sort(
    (a, b) => Math.abs(b.in - b.out) - Math.abs(a.in - a.out)
  );
}

function UsageChip({
  group,
  unit,
  active,
  onSelect
}: {
  group: UsageGroup;
  unit?: string | null;
  active: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();

  const net = group.in - group.out;
  // A document type that only ever moves stock one way needs no split: the net
  // is the whole story, and printing "+300 in · 0 out" beside it is noise.
  const bothWays = group.in > 0 && group.out > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={[
        'flex flex-col gap-0.5 rounded-md border px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent',
        active ? 'border-primary bg-accent' : ''
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="flex items-center gap-2">
        <span className="font-medium">{t(REFERENCE_TYPE_KEYS[group.referenceType])}</span>
        <span
          className={[
            'tabular-nums',
            net > 0 ? 'text-success' : net < 0 ? 'text-destructive' : 'text-muted-foreground'
          ].join(' ')}
        >
          {net > 0 ? '+' : net < 0 ? '−' : ''}
          {formatQty(Math.abs(net), unit)}
        </span>
      </span>
      <span className="text-xs text-muted-foreground">
        {bothWays && (
          <>
            {t('inventory.ledger.usageSplit', {
              in: formatQty(group.in, unit),
              out: formatQty(group.out, unit)
            })}
            {' · '}
          </>
        )}
        {t('inventory.ledger.movements', { count: group.movements })}
      </span>
    </button>
  );
}

/** The document that caused a movement, tinted by which way the stock went. */
function ReferenceBadge({ referenceType }: { referenceType: StockReferenceType }) {
  const { t } = useTranslation();
  const label = t(REFERENCE_TYPE_KEYS[referenceType]);

  // Transfers and stock counts go both ways, so they stay neutral; the rest are
  // one direction by nature and the tint saves reading the columns.
  const incoming: StockReferenceType[] = ['open', 'grn', 'refund_invoice'];
  const outgoing: StockReferenceType[] = [
    'invoice',
    'pharmacy',
    'damage',
    'consumption',
    'return_grn'
  ];

  const variant = incoming.includes(referenceType)
    ? 'success'
    : outgoing.includes(referenceType)
      ? 'warning'
      : 'secondary';

  return <Badge variant={variant}>{label}</Badge>;
}
