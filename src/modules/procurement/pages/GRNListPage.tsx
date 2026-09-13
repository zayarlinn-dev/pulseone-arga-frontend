import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PackagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList } from '@/hooks/api/useResource';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { GRN } from '@/types/models';

export default function GRNListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const navigate = useNavigate();
  const list = useResourceList<GRN>('/procurement/grns', 'grns', 'invoiceDate');

  const columns: Column<GRN>[] = [
    { key: 'grnNo', header: t('grn.column.grnNo'), className: 'font-mono text-xs' },
    {
      header: t('grn.column.vendor'),
      sortable: false,
      className: 'font-medium',
      render: row => row.vendor?.vendorName ?? '-'
    },
    {
      key: 'invoiceNo',
      hideBelow: 'lg',
      header: t('grn.column.theirInvoice'),
      className: 'font-mono text-xs',
      render: row => row.invoiceNo
    },
    {
      hideBelow: 'md',
      header: t('common.label.category'),
      sortable: false,
      render: row => row.grnCategory?.entityName ?? '-'
    },
    {
      key: 'netAmount',
      header: t('grn.column.net'),
      className: 'text-right tabular-nums',
      render: row => formatCurrency(row.netAmount)
    },
    {
      key: 'invoiceDate',
      hideBelow: 'lg',
      header: t('grn.column.invoiceDate'),
      render: row => formatDate(row.invoiceDate)
    },
    { key: 'createdAt', hideBelow: 'md', header: t('grn.column.received'), render: row => formatDate(row.createdAt) }
  ];

  return (
    <>
      <PageHeader
        title={t('grn.title')}
        description={t('grn.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('grn.searchPlaceholder')}
        actions={
          can('create-grn') && (
            <Button onClick={() => navigate('/procurement/grns/new')}>
              <PackagePlus className="h-4 w-4" />
              {t('grn.receive')}
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        onRowClick={row => navigate(`/procurement/grns/${row.id}`)}
        emptyMessage={t('grn.empty')}
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
