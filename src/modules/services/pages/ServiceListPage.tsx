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
import { serviceCatalogService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency } from '@/lib/utils';
import type { Service } from '@/types/models';
import { ServiceModal } from '../components/ServiceModal';

export default function ServiceListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const list = useResourceList<Service>('/administration/services', 'services', 'serviceName');

  const [editing, setEditing] = useState<Service | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Service | null>(null);

  const mutations = useResourceMutations(serviceCatalogService, 'services', t('services.entity'), {
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setDeleting(null);
    }
  });

  const columns: Column<Service>[] = [
    { key: 'serviceCode', hideBelow: 'md', header: t('common.label.code'), className: 'font-mono text-xs' },
    { key: 'serviceName', header: t('common.label.name'), className: 'font-medium' },
    {
      hideBelow: 'lg',
      header: t('common.label.category'),
      sortable: false,
      render: row => row.serviceCategory?.entityName ?? '-'
    },
    {
      hideBelow: 'md',
      header: t('services.column.serviceCenter'),
      sortable: false,
      render: row => row.serviceCenter?.serviceCenterName ?? '-'
    },
    {
      key: 'servicePrice',
      header: t('common.label.price'),
      className: 'text-right tabular-nums',
      render: row => formatCurrency(row.servicePrice)
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
          {can('update-service') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
              aria-label={t('common.action.editItem', { item: row.serviceName })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-service') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleting(row)}
              aria-label={t('common.action.deleteItem', { item: row.serviceName })}
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
        title={t('services.title')}
        description={t('services.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('services.searchPlaceholder')}
        actions={
          can('create-service') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { item: t('services.entity') })}
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
        emptyMessage={t('services.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <ServiceModal
        open={modalOpen}
        service={editing}
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
        title={t('services.deleteTitle')}
        description={deleting ? t('services.deleteBody', { name: deleting.serviceName }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}
