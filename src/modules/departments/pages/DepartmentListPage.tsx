import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { departmentService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { formatDate } from '@/lib/utils';
import type { Department } from '@/types/models';
import { DepartmentModal } from '../components/DepartmentModal';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';

export default function DepartmentListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const list = useResourceList<Department>(
    '/administration/departments',
    'departments',
    'departmentName'
  );

  const [editing, setEditing] = useState<Department | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Department | null>(null);

  const mutations = useResourceMutations(departmentService, 'departments', t('departments.entity'), {
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setDeleting(null);
    }
  });

  const columns: Column<Department>[] = [
    { key: 'departmentCode', hideBelow: 'sm', header: t('departments.column.code'), className: 'font-mono text-xs' },
    { key: 'departmentName', header: t('departments.column.name'), className: 'font-medium' },
    {
      key: 'departmentType',
      header: t('departments.column.type'),
      render: row => (
        <Badge variant={row.departmentType === 'clinical' ? 'default' : 'secondary'}>
          {t(`departments.type.${row.departmentType}`)}
        </Badge>
      )
    },
    {
      key: 'description',
      hideBelow: 'lg',
      header: t('departments.column.description'),
      sortable: false,
      render: row => row.description || '-'
    },
    { key: 'createdAt', hideBelow: 'md', header: t('departments.column.created'), render: row => formatDate(row.createdAt) },
    {
      header: t('common.label.actions'),
      sortable: false,
      className: 'w-24 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {can('update-department') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
              aria-label={t('common.action.editItem', { item: row.departmentName })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-department') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleting(row)}
              aria-label={t('common.action.deleteItem', { item: row.departmentName })}
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
        title={t('departments.title')}
        description={t('departments.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('departments.searchPlaceholder')}
        actions={
          can('create-department') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { item: t('departments.entity') })}
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
        emptyMessage={t('departments.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <DepartmentModal
        open={modalOpen}
        department={editing}
        submitting={mutations.isCreating || mutations.isUpdating}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={async values => {
          if (editing) {
            await mutations.update({ id: editing.id, data: values });
          } else {
            await mutations.create(values);
          }
        }}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        title={t('departments.deleteTitle')}
        description={deleting ? t('departments.deleteBody', { name: deleting.departmentName }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}
