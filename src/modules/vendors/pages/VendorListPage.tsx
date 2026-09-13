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
import { vendorService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { formatDate } from '@/lib/utils';
import type { Vendor } from '@/types/models';
import { VendorModal } from '../components/VendorModal';

export default function VendorListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const list = useResourceList<Vendor>('/administration/vendors', 'vendors', 'vendorName');

  const [editing, setEditing] = useState<Vendor | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Vendor | null>(null);

  const mutations = useResourceMutations(vendorService, 'vendors', t('vendors.entity'), {
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setDeleting(null);
    }
  });

  const columns: Column<Vendor>[] = [
    { key: 'vendorCode', hideBelow: 'md', header: t('common.label.code'), className: 'font-mono text-xs' },
    { key: 'vendorName', header: t('common.label.name'), className: 'font-medium' },
    {
      hideBelow: 'lg',
      header: t('common.label.type'),
      sortable: false,
      render: row => row.vendorType?.entityName ?? '-'
    },
    { key: 'contactNo', header: t('vendors.column.contact'), render: row => row.contactNo || '-' },
    {
      key: 'vendorCurrency',
      hideBelow: 'lg',
      header: t('vendors.column.currency'),
      render: row => (row.vendorCurrency ? row.vendorCurrency.toUpperCase() : '-')
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
    { key: 'createdAt', hideBelow: 'xl', header: t('common.label.createdAt'), render: row => formatDate(row.createdAt) },
    {
      header: t('common.label.actions'),
      sortable: false,
      className: 'w-24 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {can('update-vendor') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
              aria-label={t('common.action.editItem', { item: row.vendorName })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-vendor') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleting(row)}
              aria-label={t('common.action.deleteItem', { item: row.vendorName })}
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
        title={t('vendors.title')}
        description={t('vendors.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('vendors.searchPlaceholder')}
        actions={
          can('create-vendor') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { item: t('vendors.entity') })}
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
        emptyMessage={t('vendors.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <VendorModal
        open={modalOpen}
        vendor={editing}
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
        title={t('vendors.deleteTitle')}
        description={deleting ? t('vendors.deleteBody', { name: deleting.vendorName }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}
