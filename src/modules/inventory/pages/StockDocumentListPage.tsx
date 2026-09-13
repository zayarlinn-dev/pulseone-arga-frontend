import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList } from '@/hooks/api/useResource';
import { useAuthStore } from '@/stores/userStore';
import { formatDate } from '@/lib/utils';

/**
 * One list for all five stock documents.
 *
 * They differ only in what their number and date columns are called, so the
 * differences live in this table rather than in five near-identical files.
 * The words themselves live in the catalogue under `inventory.document.<kind>`,
 * keyed by the same names used here.
 */
export const STOCK_DOCUMENTS = {
  'stock-opens': {
    resourceKey: 'stock-opens',
    numberField: 'openingNo',
    dateField: 'openingDate',
    linesField: 'stockOpenItems',
    createPath: null,
    permission: 'get-stock-open'
  },
  'stock-transfers': {
    resourceKey: 'stock-transfers',
    numberField: 'transferNo',
    dateField: 'transferDate',
    linesField: 'stockTransferItems',
    createPath: '/inventories/stock-transfers/new',
    permission: 'create-stock-transfer'
  },
  'stock-damages': {
    resourceKey: 'stock-damages',
    numberField: 'damageNo',
    dateField: 'damageDate',
    linesField: 'stockDamageItems',
    createPath: '/inventories/stock-damages/new',
    permission: 'create-stock-damage'
  },
  'stock-consumptions': {
    resourceKey: 'stock-consumptions',
    numberField: 'consumptionNo',
    dateField: 'consumptionDate',
    linesField: 'stockConsumptionItems',
    createPath: '/inventories/stock-consumptions/new',
    permission: 'create-stock-consumption'
  },
  'stock-adjustments': {
    resourceKey: 'stock-adjustments',
    numberField: 'adjustmentNo',
    dateField: 'adjustmentDate',
    linesField: 'stockAdjustmentItems',
    createPath: '/inventories/stock-adjustments/new',
    permission: 'create-stock-adjustment'
  }
} as const;

export type StockDocumentKind = keyof typeof STOCK_DOCUMENTS;

/** The documents share no common row type, so the table reads them loosely. */
type DocumentRow = Record<string, unknown> & { id: number };

export default function StockDocumentListPage({ kind }: { kind: StockDocumentKind }) {
  const { t } = useTranslation();
  const config = STOCK_DOCUMENTS[kind];
  const can = useAuthStore(state => state.can);
  const navigate = useNavigate();

  const list = useResourceList<DocumentRow>(
    `/inventories/${kind}`,
    config.resourceKey,
    config.dateField
  );

  const columns: Column<DocumentRow>[] = [
    {
      key: config.numberField,
      header: t(`inventory.document.${kind}.numberHeader`),
      className: 'font-mono text-xs',
      render: row => String(row[config.numberField] ?? '-')
    },
    {
      key: config.dateField,
      header: t(`inventory.document.${kind}.dateHeader`),
      render: row => formatDate(row[config.dateField] as string | undefined)
    },
    {
      hideBelow: 'sm',
      header: t('inventory.documentColumn.lines'),
      sortable: false,
      render: row => {
        const lines = row[config.linesField];
        const count = Array.isArray(lines) ? lines.length : 0;
        return count > 0 ? <Badge variant="secondary">{count}</Badge> : '-';
      }
    },
    {
      key: 'remarks',
      hideBelow: 'lg',
      header: t('common.label.remarks'),
      sortable: false,
      render: row => (row.remarks as string | null) || '-'
    },
    {
      key: 'createdAt',
      header: t('inventory.documentColumn.posted'),
      render: row => formatDate(row.createdAt as string | undefined)
    }
  ];

  return (
    <>
      <PageHeader
        title={t(`inventory.document.${kind}.title`)}
        description={t(`inventory.document.${kind}.description`)}
        actions={
          config.createPath &&
          can(config.permission) && (
            <Button onClick={() => navigate(config.createPath!)}>
              <Plus className="h-4 w-4" />
              {t(`inventory.document.${kind}.createLabel`)}
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
        emptyMessage={t(`inventory.document.${kind}.empty`)}
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
