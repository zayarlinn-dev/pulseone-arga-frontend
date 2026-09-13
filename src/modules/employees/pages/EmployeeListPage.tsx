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
import { employeeService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import type { Employee } from '@/types/models';
import { EmployeeModal } from '../components/EmployeeModal';

const CATEGORY_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  doctor: 'default',
  nurse: 'secondary',
  general: 'outline'
};

export default function EmployeeListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const list = useResourceList<Employee>('/administration/employees', 'employees', 'fullName');

  const [editing, setEditing] = useState<Employee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Employee | null>(null);

  const mutations = useResourceMutations(employeeService, 'employees', t('employees.entity'), {
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setDeleting(null);
    }
  });

  const columns: Column<Employee>[] = [
    { key: 'employeeNo', hideBelow: 'md', header: t('employees.column.employeeNo'), className: 'font-mono text-xs' },
    { key: 'fullName', header: t('common.label.name'), className: 'font-medium' },
    {
      key: 'employmentCategory',
      hideBelow: 'lg',
      header: t('common.label.category'),
      render: row => (
        <Badge variant={CATEGORY_VARIANT[row.employmentCategory] ?? 'outline'}>
          {t(`employees.category.${row.employmentCategory}`)}
        </Badge>
      )
    },
    {
      header: t('employees.column.department'),
      sortable: false,
      render: row => row.department?.departmentName ?? '-'
    },
    { key: 'phoneNo', hideBelow: 'md', header: 'Phone', render: row => row.phoneNo || '-' },
    { key: 'email', hideBelow: 'lg', header: 'Email', render: row => row.email || '-' },
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
          {can('update-employee') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
              aria-label={t('common.action.editItem', { item: row.fullName })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-employee') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleting(row)}
              aria-label={t('common.action.deleteItem', { item: row.fullName })}
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
        title={t('employees.title')}
        description={t('employees.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('employees.searchPlaceholder')}
        actions={
          can('create-employee') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { item: t('employees.entity') })}
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
        emptyMessage={t('employees.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <EmployeeModal
        open={modalOpen}
        employee={editing}
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
        title={t('employees.deleteTitle')}
        description={deleting ? t('employees.deleteBody', { name: deleting.fullName }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}
