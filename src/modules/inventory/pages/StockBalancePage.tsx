import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList } from '@/hooks/api/useResource';
import { useDropdown } from '@/hooks/api/useDropdown';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency } from '@/lib/utils';
import { formatQty } from '@/lib/uom';
import { BatchBreakdown } from '@/modules/inventory/components/BatchBreakdown';
import type { StockBalanceRow } from '@/types/models';

export default function StockBalancePage() {
  const { t } = useTranslation();
  const { data: stores = [] } = useDropdown('/dropdown/stores');
  const canReadLedger = useAuthStore(state => state.can)('get-stock-ledger');

  const [storeFilter, setStoreFilter] = useState('');
  const [belowReorder, setBelowReorder] = useState(false);

  // One row open at a time. Several open panels turn the report into a wall of
  // batch tables and lose the comparison between items that the report is for;
  // and the batches are fetched per row, so an "expand all" would fire a
  // request for every line on the page.
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const extraParams = useMemo(
    () => ({
      ...(storeFilter ? { storeId: storeFilter } : {}),
      ...(belowReorder ? { belowReorder: 'true' } : {})
    }),
    [storeFilter, belowReorder]
  );

  // The report is always ordered by item name server-side, so there is no sort
  // key to pass and no sortable header to offer.
  const list = useResourceList<StockBalanceRow>(
    '/inventories/stock-balance',
    'stock-balance',
    null,
    extraParams
  );

  const columns: Column<StockBalanceRow>[] = [
    {
      // The chevron is its own column rather than being bolted onto the item
      // name: the whole cell is the hit target, and it stays in one place down
      // the page instead of shifting with the length of each item's name.
      header: '',
      sortable: false,
      className: 'w-8',
      render: row => {
        const open = expandedRow === row.itemStoreMapId;
        return (
          <button
            type="button"
            onClick={() => setExpandedRow(open ? null : row.itemStoreMapId)}
            aria-expanded={open}
            aria-label={t(open ? 'inventory.balance.hideBatches' : 'inventory.balance.showBatches')}
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        );
      }
    },
    {
      hideBelow: 'md',
      header: t('inventory.balance.column.itemCode'),
      sortable: false,
      className: 'font-mono text-xs',
      render: row => row.itemCode
    },
    {
      header: t('inventory.balance.column.item'),
      sortable: false,
      className: 'font-medium',
      render: row => row.itemName
    },
    { hideBelow: 'md', header: t('inventory.balance.column.store'), sortable: false, render: row => row.storeName },
    {
      header: t('inventory.balance.column.onHand'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => {
        const isLow = row.reorderQty != null && row.totalQty <= row.reorderQty;
        // Base units, and the report says so: the same figure is the number a
        // transfer or a count is keyed in, while the sale price beside it is
        // quoted per sale unit. Two units in one row is only safe if both are
        // named.
        return (
          <span className="flex items-center justify-end gap-2">
            {formatQty(row.totalQty, row.baseUom)}
            {isLow && <Badge variant="warning">{t('inventory.balance.low')}</Badge>}
          </span>
        );
      }
    },
    {
      hideBelow: 'lg',
      header: t('inventory.balance.column.reorderAt'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => (row.reorderQty != null ? row.reorderQty.toLocaleString() : '-')
    },
    {
      hideBelow: 'lg',
      header: t('inventory.balance.column.salePrice'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => (
        <span>
          {formatCurrency(row.salePrice)}
          {row.saleUom && (
            <span className="text-xs text-muted-foreground"> / {row.saleUom}</span>
          )}
        </span>
      )
    },
    {
      // What was paid for what is still on the shelf, summed off the batches.
      // Shown next to the retail figure because the gap between them is the
      // margin, and because a store whose cost reads as zero is usually a store
      // whose batches were never valued rather than one holding free stock.
      hideBelow: 'xl',
      header: t('inventory.balance.column.stockCost'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => {
        if (row.unvaluedQty === 0) {
          return formatCurrency(row.stockCost);
        }

        // Part of the balance has no cost recorded, so the total below it is
        // understated. Saying by how much is more use than a footnote.
        return (
          <span className="flex items-center justify-end gap-2">
            {formatCurrency(row.stockCost)}
            <Badge
              variant="warning"
              title={t('inventory.balance.unvaluedHint', {
                qty: formatQty(row.unvaluedQty, row.baseUom)
              })}
            >
              {t(
                row.unvaluedQty === row.totalQty
                  ? 'inventory.balance.unvalued'
                  : 'inventory.balance.partial'
              )}
            </Badge>
          </span>
        );
      }
    },
    {
      hideBelow: 'sm',
      header: t('inventory.balance.column.stockValue'),
      sortable: false,
      className: 'text-right tabular-nums font-medium',
      render: row => formatCurrency(row.stockValue)
    },
    // The way out of the report, and the reason it is a link rather than
    // another expanding panel: "this figure is wrong" is answered by the
    // movements behind it, and that is a screen of its own.
    ...(canReadLedger
      ? [
          {
            header: '',
            sortable: false,
            className: 'w-8',
            render: (row: StockBalanceRow) => (
              <Link
                to={`/inventories/stock-ledger?itemId=${row.itemId}&storeId=${row.storeId}`}
                title={t('inventory.ledger.title')}
                aria-label={t('inventory.ledger.title')}
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ScrollText className="size-4" />
              </Link>
            )
          }
        ]
      : [])
  ];

  return (
    <>
      <PageHeader
        title={t('inventory.balance.title')}
        description={t('inventory.balance.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('inventory.balance.searchPlaceholder')}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NativeSelect
          value={storeFilter}
          onChange={event => setStoreFilter(event.target.value)}
          className="h-8 w-auto min-w-44 text-xs"
          aria-label={t('inventory.balance.filterStore')}
        >
          <option value="">{t('inventory.balance.allStores')}</option>
          {stores.map(store => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </NativeSelect>

        <Button
          variant={belowReorder ? 'default' : 'outline'}
          size="sm"
          onClick={() => setBelowReorder(current => !current)}
          aria-pressed={belowReorder}
        >
          {t('inventory.balance.belowReorder')}
        </Button>

        {(storeFilter || belowReorder) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStoreFilter('');
              setBelowReorder(false);
            }}
          >
            {t('common.action.clear')}
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.itemStoreMapId}
        emptyMessage={t('inventory.balance.empty')}
        expandedRowKey={expandedRow}
        renderExpanded={row => (
          <BatchBreakdown itemStoreMapId={row.itemStoreMapId} baseUom={row.baseUom} />
        )}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />
    </>
  );
}
