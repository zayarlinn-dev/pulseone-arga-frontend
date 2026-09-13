import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { roleService, type RolePayload } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { formatDate } from '@/lib/utils';
import type { Role } from '@/types/models';
import { RoleModal } from '../components/RoleModal';

export default function RoleListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const queryClient = useQueryClient();
  const list = useResourceList<Role>('/administration/roles', 'roles', 'roleName');

  const [editing, setEditing] = useState<Role | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Role | null>(null);

  const mutations = useResourceMutations<Role, RolePayload, RolePayload>(
    roleService,
    'roles',
    t('roles.entity'),
    {
      onSuccess: () => {
        // The grant list lives under its own key, so the shared invalidation
        // would leave a stale permission tree behind on the next open.
        queryClient.invalidateQueries({ queryKey: ['role'] });
        setModalOpen(false);
        setEditing(null);
        setDeleting(null);
      }
    }
  );

  const columns: Column<Role>[] = [
    { key: 'roleName', header: t('roles.column.role'), className: 'font-medium' },
    {
      // Kept on a phone: without it the row is a name and two icons, and the
      // name alone does not say what the role can do.
      key: 'description',
      header: t('common.label.description'),
      sortable: false,
      render: row => row.description || '-'
    },
    { key: 'createdAt', hideBelow: 'md', header: t('common.label.createdAt'), render: row => formatDate(row.createdAt) },
    {
      header: t('common.label.actions'),
      sortable: false,
      className: 'w-24 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {can('update-role') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
              aria-label={t('common.action.editItem', { item: row.roleName })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-role') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleting(row)}
              aria-label={t('common.action.deleteItem', { item: row.roleName })}
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
        title={t('roles.title')}
        description={t('roles.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('roles.searchPlaceholder')}
        actions={
          can('create-role') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { item: t('roles.entity') })}
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
        emptyMessage={t('roles.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <RoleModal
        open={modalOpen}
        role={editing}
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
        title={t('roles.deleteTitle')}
        description={deleting ? t('roles.deleteBody', { name: deleting.roleName }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}
