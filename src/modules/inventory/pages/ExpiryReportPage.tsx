import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList } from '@/hooks/api/useResource';
import { useDropdown } from '@/hooks/api/useDropdown';
import { formatCurrency, formatDate } from '@/lib/utils';
import { formatQty } from '@/lib/uom';
import type { ExpiringBatch, ExpiryStatus } from '@/types/models';

/**
 * The stock that is about to become worthless, and the stock that already has.
 *
 * Expired batches are at the top of the list rather than filtered out. They are
 * the part someone has to act on today: every one of them is money already lost
 * that is still being counted as stock, and the only way it leaves the system
 * is a damage note somebody has to raise. A report that only looked forward
 * would never show them.
 *
 * The windows come from the inventory settings, so "expiring soon" means the
 * same thing here, on the dashboard and in the settings screen. The day switch
 * below overrides it for this look without saving anything.
 */
export default function ExpiryReportPage() {
  const { t } = useTranslation();
  const { data: stores = [] } = useDropdown('/dropdown/stores');

  const [storeFilter, setStoreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [days, setDays] = useState('');

  const extraParams = useMemo(
    () => ({
      ...(storeFilter ? { storeId: storeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(days ? { days } : {})
    }),
    [storeFilter, statusFilter, days]
  );

  // Ordered soonest-expiry-first server-side, which is the only order this
  // report is useful in, so there is no sortable header to offer.
  const list = useResourceList<ExpiringBatch>(
    '/administration/items/expiry-alerts',
    'expiry-alerts',
    null,
    extraParams
  );

  const columns: Column<ExpiringBatch>[] = [
    {
      header: t('inventory.expiry.column.expiry'),
      sortable: false,
      render: row => (
        <span className="flex items-center gap-2">
          {row.expiryDate ? formatDate(row.expiryDate) : '-'}
          <ExpiryBadge status={row.expiryStatus} days={row.daysToExpiry} />
        </span>
      )
    },
    {
      hideBelow: 'md',
      header: t('inventory.expiry.column.itemCode'),
      sortable: false,
      className: 'font-mono text-xs',
      render: row => row.itemCode
    },
    {
      header: t('inventory.expiry.column.item'),
      sortable: false,
      className: 'font-medium',
      render: row => row.itemName
    },
    {
      hideBelow: 'lg',
      header: t('inventory.expiry.column.batchNo'),
      sortable: false,
      className: 'font-mono text-xs',
      // Straight to the recall screen: a batch number on this report is
      // usually the start of "where else is this lot, and who got some".
      render: row => (
        <Link to={`/inventories/lots/${row.itemBatchId}`} className="hover:underline">
          {row.batchNo}
        </Link>
      )
    },
    { hideBelow: 'md', header: t('inventory.expiry.column.store'), sortable: false, render: row => row.storeName },
    {
      header: t('inventory.expiry.column.qty'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => formatQty(row.qty, row.baseUom)
    },
    {
      // What this batch is worth is what walking away from it costs, which is
      // the number that decides whether it is worth chasing.
      hideBelow: 'sm',
      header: t('inventory.expiry.column.atRisk'),
      sortable: false,
      className: 'text-right tabular-nums font-medium',
      render: row =>
        Number(row.costPrice) === 0 ? (
          <span className="text-xs text-muted-foreground">
            {t('inventory.batches.unvalued')}
          </span>
        ) : (
          formatCurrency(row.stockCost)
        )
    }
  ];

  const filtered = storeFilter || statusFilter || days;

  return (
    <>
      <PageHeader
        title={t('inventory.expiry.title')}
        description={t('inventory.expiry.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('inventory.expiry.searchPlaceholder')}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NativeSelect
          value={storeFilter}
          onChange={event => setStoreFilter(event.target.value)}
          className="h-8 w-auto min-w-44 text-xs"
          aria-label={t('inventory.expiry.filterStore')}
        >
          <option value="">{t('inventory.balance.allStores')}</option>
          {stores.map(store => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className="h-8 w-auto min-w-40 text-xs"
          aria-label={t('inventory.expiry.filterStatus')}
        >
          <option value="">{t('inventory.expiry.allStatuses')}</option>
          <option value="expired">{t('inventory.expiry.status.expired')}</option>
          <option value="critical">{t('inventory.expiry.status.critical')}</option>
          <option value="warning">{t('inventory.expiry.status.warning')}</option>
        </NativeSelect>

        <NativeSelect
          value={days}
          onChange={event => setDays(event.target.value)}
          className="h-8 w-auto min-w-36 text-xs"
          aria-label={t('inventory.expiry.filterWindow')}
        >
          <option value="">{t('inventory.expiry.defaultWindow')}</option>
          <option value="30">{t('inventory.expiry.window', { days: 30 })}</option>
          <option value="90">{t('inventory.expiry.window', { days: 90 })}</option>
          <option value="180">{t('inventory.expiry.window', { days: 180 })}</option>
          <option value="365">{t('inventory.expiry.window', { days: 365 })}</option>
        </NativeSelect>

        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStoreFilter('');
              setStatusFilter('');
              setDays('');
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
        rowKey={row => row.itemBatchId}
        emptyMessage={t('inventory.expiry.empty')}
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

/**
 * How near the date is, in words.
 *
 * "in 12 days" beats a colour on its own: the colour says how alarmed to be and
 * the number says how long there is to do something about it, and only the
 * second one survives being printed in black and white.
 */
function ExpiryBadge({ status, days }: { status: ExpiryStatus; days?: number | null }) {
  const { t } = useTranslation();

  if (status === 'expired') {
    return (
      <Badge variant="destructive">
        {days != null
          ? t('inventory.expiry.expiredDays', { days: Math.abs(days) })
          : t('inventory.batches.expired')}
      </Badge>
    );
  }
  if (status === 'critical') {
    return <Badge variant="destructive">{t('inventory.batches.inDays', { days: days ?? 0 })}</Badge>;
  }
  if (status === 'warning') {
    return <Badge variant="warning">{t('inventory.batches.inDays', { days: days ?? 0 })}</Badge>;
  }
  return null;
}
