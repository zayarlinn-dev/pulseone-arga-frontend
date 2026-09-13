import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList } from '@/hooks/api/useResource';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { PharmacySale } from '@/types/models';

export const SALE_STATUS_VARIANT: Record<PharmacySale['issuedStatus'], BadgeProps['variant']> = {
  paid: 'success',
  unpaid: 'destructive',
  cancelled: 'secondary',
  refunded: 'info'
};

export default function PharmacySaleListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState('');
  const extraParams = useMemo(
    () => (statusFilter ? { issuedStatus: statusFilter } : {}),
    [statusFilter]
  );

  const list = useResourceList<PharmacySale>(
    '/pharmacy/sales',
    'pharmacy-sales',
    'issuedDate',
    extraParams
  );

  const columns: Column<PharmacySale>[] = [
    {
      key: 'pharmacySaleNo',
      header: t('pharmacy.sales.column.saleNo'),
      className: 'font-mono text-xs'
    },
    {
      header: t('pharmacy.sales.column.patient'),
      sortable: false,
      className: 'font-medium',
      render: row =>
        row.patient ? (
          <span className="flex flex-col">
            <span>{row.patient.patientName}</span>
            <span className="font-mono text-xs text-muted-foreground">{row.patient.patientNo}</span>
          </span>
        ) : (
          '-'
        )
    },
    {
      hideBelow: 'lg',
      header: t('pharmacy.sales.column.prescribedBy'),
      sortable: false,
      render: row => row.employee?.fullName ?? '-'
    },
    {
      key: 'issuedBalance',
      header: t('pharmacy.sales.column.net'),
      className: 'text-right tabular-nums',
      render: row => formatCurrency(row.issuedBalance)
    },
    {
      key: 'paidAmount',
      hideBelow: 'md',
      header: t('pharmacy.sales.column.paid'),
      className: 'text-right tabular-nums',
      render: row => {
        const balance = Number(row.issuedBalance) - Number(row.paidAmount);
        return (
          <span className="flex flex-col items-end">
            <span>{formatCurrency(row.paidAmount)}</span>
            {balance > 0 && row.issuedStatus !== 'cancelled' && (
              <span className="text-xs text-destructive">
                {t('pharmacy.sales.owing', { amount: formatCurrency(balance) })}
              </span>
            )}
          </span>
        );
      }
    },
    {
      key: 'paidBy',
      hideBelow: 'lg',
      header: t('pharmacy.sales.column.method'),
      render: row => t(`common.paymentMethod.${row.paidBy}`)
    },
    {
      key: 'issuedStatus',
      header: t('common.label.status'),
      render: row => (
        <Badge variant={SALE_STATUS_VARIANT[row.issuedStatus] ?? 'secondary'}>
          {t(`pharmacy.sales.status.${row.issuedStatus}`)}
        </Badge>
      )
    },
    {
      key: 'issuedDate',
      hideBelow: 'md',
      header: t('pharmacy.sales.column.dispensed'),
      render: row => formatDateTime(row.issuedDate)
    }
  ];

  return (
    <>
      <PageHeader
        title={t('pharmacy.sales.title')}
        description={t('pharmacy.sales.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('pharmacy.sales.searchPlaceholder')}
        actions={
          can('create-pharmacy-sale') && (
            <Button onClick={() => navigate('/pharmacy/dispense')}>
              <Plus className="h-4 w-4" />
              {t('pharmacy.sales.dispense')}
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NativeSelect
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className="h-8 w-auto min-w-40 text-xs"
          aria-label={t('pharmacy.sales.filter.label')}
        >
          <option value="">{t('pharmacy.sales.filter.all')}</option>
          <option value="paid">{t('pharmacy.sales.status.paid')}</option>
          <option value="unpaid">{t('pharmacy.sales.status.unpaid')}</option>
          <option value="cancelled">{t('pharmacy.sales.status.cancelled')}</option>
          <option value="refunded">{t('pharmacy.sales.status.refunded')}</option>
        </NativeSelect>
        {statusFilter && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('')}>
            {t('common.action.clear')}
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        onRowClick={row => navigate(`/pharmacy/sales/${row.id}`)}
        emptyMessage={t('pharmacy.sales.empty')}
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
