import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList } from '@/hooks/api/useResource';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { ReturnPharmacySale } from '@/types/models';

export default function ReturnListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const navigate = useNavigate();
  const list = useResourceList<ReturnPharmacySale>(
    '/pharmacy/returns',
    'pharmacy-returns',
    'returnedDate'
  );

  const columns: Column<ReturnPharmacySale>[] = [
    {
      header: t('pharmacy.returns.column.patient'),
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
      header: t('pharmacy.returns.column.reason'),
      sortable: false,
      render: row => row.returnReason?.entityName ?? '-'
    },
    {
      key: 'subTotal',
      header: t('pharmacy.returns.column.value'),
      className: 'text-right tabular-nums',
      render: row => formatCurrency(row.subTotal)
    },
    {
      key: 'paidAmount',
      header: t('pharmacy.returns.column.refunded'),
      className: 'text-right tabular-nums',
      render: row => formatCurrency(row.paidAmount)
    },
    {
      key: 'paidBy',
      hideBelow: 'md',
      header: t('pharmacy.returns.column.method'),
      render: row => t(`common.returnPaymentMethod.${row.paidBy}`)
    },
    {
      key: 'returnedDate',
      hideBelow: 'sm',
      header: t('pharmacy.returns.column.returned'),
      render: row => formatDateTime(row.returnedDate)
    }
  ];

  return (
    <>
      <PageHeader
        title={t('pharmacy.returns.title')}
        description={t('pharmacy.returns.description')}
        actions={
          can('create-return-pharmacy-sale') && (
            <Button onClick={() => navigate('/pharmacy/returns/new')}>
              <Plus className="h-4 w-4" />
              {t('pharmacy.returns.newReturn')}
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
        emptyMessage={t('pharmacy.returns.empty')}
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
