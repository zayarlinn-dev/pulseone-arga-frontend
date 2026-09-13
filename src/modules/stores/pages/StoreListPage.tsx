import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { storeService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { formatDate } from '@/lib/utils';
import type { Store } from '@/types/models';
import { StoreModal } from '../components/StoreModal';

export default function StoreListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const list = useResourceList<Store>('/administration/stores', 'stores', 'storeName');

  const [editing, setEditing] = useState<Store | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Store | null>(null);

  const mutations = useResourceMutations(storeService, 'stores', t('stores.entity'), {
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setDeleting(null);
    }
  });

  const columns: Column<Store>[] = [
    { key: 'storeCode', hideBelow: 'md', header: t('stores.column.code'), className: 'font-mono text-xs' },
    { key: 'storeName', header: t('stores.column.name'), className: 'font-medium' },
    {
      key: 'storeType',
      header: t('stores.column.type'),
      render: row => (
        <Badge variant={row.storeType === 'medical' ? 'default' : 'secondary'}>
          {t(`stores.type.${row.storeType}`)}
        </Badge>
      )
    },
    {
      hideBelow: 'lg',
      header: t('stores.column.flags'),
      sortable: false,
      render: row => (
        <span className="flex flex-wrap gap-1">
          {row.isMainStore && <Badge variant="info">{t('stores.flag.main')}</Badge>}
          {row.isDefaultStore && <Badge variant="outline">{t('stores.flag.default')}</Badge>}
          {!row.isMainStore && !row.isDefaultStore && '-'}
        </span>
      )
    },
    {
      key: 'isActive',
      hideBelow: 'sm',
      header: t('stores.column.status'),
      render: row => (
        <Badge variant={row.isActive ? 'success' : 'secondary'}>
          {t(row.isActive ? 'common.status.active' : 'common.status.inactive')}
        </Badge>
      )
    },
    { key: 'createdAt', hideBelow: 'md', header: t('common.label.createdAt'), render: row => formatDate(row.createdAt) },
    {
      header: t('common.label.actions'),
      sortable: false,
      className: 'w-24 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {can('update-store') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
              aria-label={t('common.action.editItem', { item: row.storeName })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-store') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleting(row)}
              aria-label={t('common.action.deleteItem', { item: row.storeName })}
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
        title={t('stores.title')}
        description={t('stores.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('stores.searchPlaceholder')}
        actions={
          can('create-store') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { item: t('stores.entity') })}
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
        emptyMessage={t('stores.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <StoreModal
        open={modalOpen}
        store={editing}
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
        title={t('stores.deleteTitle')}
        description={deleting ? t('stores.deleteBody', { name: deleting.storeName }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}
