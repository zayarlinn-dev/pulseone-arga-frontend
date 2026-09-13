import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { itemService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency } from '@/lib/utils';
import type { Item } from '@/types/models';
import { ItemModal } from '../components/ItemModal';

export default function ItemListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const list = useResourceList<Item>('/administration/items', 'items', 'itemName');

  const [editing, setEditing] = useState<Item | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Item | null>(null);

  const mutations = useResourceMutations(itemService, 'items', t('items.entity'), {
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setDeleting(null);
    }
  });

  const columns: Column<Item>[] = [
    { key: 'itemCode', hideBelow: 'md', header: t('items.column.code'), className: 'font-mono text-xs' },
    { key: 'itemName', header: t('common.label.name'), className: 'font-medium' },
    { key: 'genericName', hideBelow: 'lg', header: t('items.column.generic'), render: row => row.genericName || '-' },
    {
      hideBelow: 'md',
      header: t('common.label.category'),
      sortable: false,
      render: row => row.itemCategory?.entityName ?? '-'
    },
    {
      hideBelow: 'lg',
      header: t('items.column.uom'),
      sortable: false,
      render: row => `${row.baseUom?.entityName ?? '-'} / ${row.saleUom?.entityName ?? '-'}`
    },
    {
      key: 'salePrice',
      header: t('items.column.salePrice'),
      className: 'text-right tabular-nums',
      render: row => formatCurrency(row.salePrice)
    },
    {
      key: 'isActive',
      hideBelow: 'sm',
      header: t('common.label.status'),
      render: row => (
        <Badge variant={row.isActive ? 'success' : 'secondary'}>
          {t(row.isActive ? 'common.status.active' : 'common.status.inactive')}
        </Badge>
      )
    },
    {
      header: t('common.label.actions'),
      sortable: false,
      className: 'w-24 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {can('update-item') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
              aria-label={t('common.action.editItem', { item: row.itemName })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-item') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleting(row)}
              aria-label={t('common.action.deleteItem', { item: row.itemName })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title={t('items.title')}
        description={t('items.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('items.searchPlaceholder')}
        actions={
          can('create-item') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { item: t('items.entity') })}
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
        emptyMessage={t('items.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <ItemModal
        open={modalOpen}
        item={editing}
        submitting={mutations.isCreating || mutations.isUpdating}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={async payload => {
          if (editing) {
            await mutations.update({ id: editing.id, data: payload });
          } else {
            await mutations.create(payload);
          }
        }}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        title={t('items.deleteTitle')}
        description={deleting ? t('items.deleteBody', { name: deleting.itemName }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}
