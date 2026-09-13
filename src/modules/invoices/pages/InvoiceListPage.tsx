import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import type { Invoice } from '@/types/models';

export const INVOICE_STATUS_VARIANT: Record<Invoice['invoiceStatus'], BadgeProps['variant']> = {
  paid: 'success',
  pending: 'warning',
  unpaid: 'destructive',
  cancelled: 'secondary',
  refunded: 'info'
};

export default function InvoiceListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState('');

  // Arrived at from a patient's chart: ?patientId= narrows the list to that
  // patient's bills. It lives in the URL rather than in state so the link is
  // shareable and the back button returns to the same list.
  const [searchParams, setSearchParams] = useSearchParams();
  const patientFilter = searchParams.get('patientId') ?? '';

  const extraParams = useMemo(
    () => ({
      ...(statusFilter ? { invoiceStatus: statusFilter } : {}),
      ...(patientFilter ? { patientId: patientFilter } : {})
    }),
    [statusFilter, patientFilter]
  );

  const list = useResourceList<Invoice>('/invoices', 'invoices', 'invoiceDate', extraParams);

  const columns: Column<Invoice>[] = [
    { key: 'invoiceNo', header: t('invoices.column.invoiceNo'), className: 'font-mono text-xs' },
    {
      header: t('invoices.column.patient'),
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
      header: t('invoices.column.visit'),
      sortable: false,
      className: 'font-mono text-xs',
      render: row => row.visit?.visitCode ?? '-'
    },
    {
      key: 'netAmount',
      header: t('invoices.column.net'),
      className: 'text-right tabular-nums',
      render: row => formatCurrency(row.netAmount)
    },
    {
      key: 'paidAmount',
      hideBelow: 'md',
      header: t('invoices.column.paid'),
      className: 'text-right tabular-nums',
      render: row => {
        const balance = Number(row.netAmount) - Number(row.paidAmount);
        return (
          <span className="flex flex-col items-end">
            <span>{formatCurrency(row.paidAmount)}</span>
            {balance > 0 && row.invoiceStatus !== 'cancelled' && (
              <span className="text-xs text-destructive">
                {t('invoices.owing', { amount: formatCurrency(balance) })}
              </span>
            )}
          </span>
        );
      }
    },
    {
      key: 'paidBy',
      hideBelow: 'lg',
      header: t('invoices.column.method'),
      render: row => t(`common.paymentMethod.${row.paidBy}`)
    },
    {
      key: 'invoiceStatus',
      header: t('common.label.status'),
      render: row => (
        <Badge variant={INVOICE_STATUS_VARIANT[row.invoiceStatus] ?? 'secondary'}>
          {t(`invoices.status.${row.invoiceStatus}`)}
        </Badge>
      )
    },
    {
      key: 'invoiceDate',
      hideBelow: 'md',
      header: t('invoices.column.billed'),
      render: row => formatDateTime(row.invoiceDate)
    }
  ];

  return (
    <>
      <PageHeader
        title={t('invoices.title')}
        description={t('invoices.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('invoices.searchPlaceholder')}
        actions={
          can('create-invoice') && (
            <Button onClick={() => navigate('/billing/new')}>
              <Plus className="h-4 w-4" />
              {t('newBill.newBillButton')}
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NativeSelect
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className="h-8 w-auto min-w-40 text-xs"
          aria-label={t('invoices.filter.label')}
        >
          <option value="">{t('invoices.filter.all')}</option>
          <option value="paid">{t('invoices.status.paid')}</option>
          <option value="pending">{t('invoices.status.pending')}</option>
          <option value="unpaid">{t('invoices.status.unpaid')}</option>
          <option value="cancelled">{t('invoices.status.cancelled')}</option>
          <option value="refunded">{t('invoices.status.refunded')}</option>
        </NativeSelect>
        {patientFilter && (
          <Badge variant="secondary" className="h-8 gap-2 px-3">
            {list.items[0]?.patient?.patientName ?? t('invoices.filter.patient')}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setSearchParams({})}
              aria-label={t('common.action.clear')}
            >
              ×
            </button>
          </Badge>
        )}
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
        onRowClick={row => navigate(`/billing/invoices/${row.id}`)}
        emptyMessage={t('invoices.empty')}
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
