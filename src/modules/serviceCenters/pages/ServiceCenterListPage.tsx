import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { useDropdown } from '@/hooks/api/useDropdown';
import { serviceCenterService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import type { ServiceCenter } from '@/types/models';
import { ServiceCenterModal } from '../components/ServiceCenterModal';

export default function ServiceCenterListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const { data: departments = [] } = useDropdown('/dropdown/departments');

  const [departmentFilter, setDepartmentFilter] = useState('');
  const extraParams = useMemo(
    () => (departmentFilter ? { departmentId: departmentFilter } : {}),
    [departmentFilter]
  );

  const list = useResourceList<ServiceCenter>(
    '/administration/service-centers',
    'service-centers',
    'serviceCenterName',
    extraParams
  );

  const [editing, setEditing] = useState<ServiceCenter | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<ServiceCenter | null>(null);

  const mutations = useResourceMutations(
    serviceCenterService,
    'service-centers',
    t('serviceCenters.entity'),
    {
      onSuccess: () => {
        setModalOpen(false);
        setEditing(null);
        setDeleting(null);
      }
    }
  );

  const columns: Column<ServiceCenter>[] = [
    { key: 'serviceCenterCode', hideBelow: 'md', header: t('common.label.code'), className: 'font-mono text-xs' },
    { key: 'serviceCenterName', header: t('common.label.name'), className: 'font-medium' },
    {
      header: t('serviceCenters.column.department'),
      sortable: false,
      render: row => row.department?.departmentName ?? '-'
    },
    {
      hideBelow: 'lg',
      header: t('common.label.type'),
      sortable: false,
      render: row => row.serviceCenterType?.entityName ?? '-'
    },
    {
      key: 'priority',
      hideBelow: 'lg',
      header: t('serviceCenters.column.priority'),
      render: row =>
        row.priority ? (
          <Badge variant={row.priority === 'emergency' ? 'destructive' : 'default'}>
            {t(`serviceCenters.priority.${row.priority}`)}
          </Badge>
        ) : (
          '-'
        )
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
          {can('update-service-center') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
              aria-label={t('common.action.editItem', { item: row.serviceCenterName })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-service-center') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleting(row)}
              aria-label={t('common.action.deleteItem', { item: row.serviceCenterName })}
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
        title={t('serviceCenters.title')}
        description={t('serviceCenters.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('serviceCenters.searchPlaceholder')}
        actions={
          can('create-service-center') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { item: t('serviceCenters.entity') })}
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NativeSelect
          value={departmentFilter}
          onChange={event => setDepartmentFilter(event.target.value)}
          className="h-8 w-auto min-w-44 text-xs"
          aria-label={t('serviceCenters.filterDepartment')}
        >
          <option value="">{t('serviceCenters.allDepartments')}</option>
          {departments.map(department => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </NativeSelect>
        {departmentFilter && (
          <Button variant="ghost" size="sm" onClick={() => setDepartmentFilter('')}>
            {t('common.action.clear')}
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        emptyMessage={t('serviceCenters.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <ServiceCenterModal
        open={modalOpen}
        serviceCenter={editing}
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
        title={t('serviceCenters.deleteTitle')}
        description={
          deleting ? t('serviceCenters.deleteBody', { name: deleting.serviceCenterName }) : ''
        }
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}
