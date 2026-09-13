import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList } from '@/hooks/api/useResource';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { RefundInvoice } from '@/types/models';

export default function RefundListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const list = useResourceList<RefundInvoice>(
    '/refund-invoices',
    'refund-invoices',
    'invoiceRefundDate'
  );

  const columns: Column<RefundInvoice>[] = [
    {
      key: 'refundInvoiceNo',
      header: t('refunds.column.refundNo'),
      className: 'font-mono text-xs'
    },
    {
      hideBelow: 'md',
      header: t('refunds.column.againstInvoice'),
      sortable: false,
      className: 'font-mono text-xs',
      render: row => row.invoice?.invoiceNo ?? '-'
    },
    {
      header: t('refunds.column.patient'),
      sortable: false,
      className: 'font-medium',
      render: row => row.invoice?.patient?.patientName ?? '-'
    },
    {
      key: 'refundAmount',
      header: t('refunds.column.refunded'),
      className: 'text-right tabular-nums',
      render: row => formatCurrency(row.refundAmount)
    },
    {
      key: 'paidBy',
      hideBelow: 'lg',
      header: t('refunds.column.method'),
      render: row => t(`common.paymentMethod.${row.paidBy}`)
    },
    {
      key: 'invoiceRefundDate',
      hideBelow: 'md',
      header: t('refunds.column.refundedOn'),
      render: row => formatDateTime(row.invoiceRefundDate)
    },
    {
      hideBelow: 'lg',
      header: t('refunds.column.reason'),
      sortable: false,
      render: row => row.refundRemarks || '-'
    }
  ];

  return (
    <>
      <PageHeader
        title={t('refunds.title')}
        description={t('refunds.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('refunds.searchPlaceholder')}
      />

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        onRowClick={row => row.invoiceId && navigate(`/billing/invoices/${row.invoiceId}`)}
        emptyMessage={t('refunds.empty')}
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
