import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Stethoscope, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { patientService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { formatDate } from '@/lib/utils';
import type { Patient } from '@/types/models';

const CATEGORY_VARIANT: Record<string, 'default' | 'destructive' | 'secondary'> = {
  'walk-in': 'secondary',
  emergency: 'destructive',
  'new-born': 'default'
};

export default function PatientListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const navigate = useNavigate();
  const list = useResourceList<Patient>('/registration/patients', 'patients', 'createdAt');

  const [deleting, setDeleting] = useState<Patient | null>(null);

  const mutations = useResourceMutations(patientService, 'patients', t('patients.entity'), {
    onSuccess: () => setDeleting(null)
  });

  const columns: Column<Patient>[] = [
    { key: 'patientNo', header: t('patients.column.patientNo'), className: 'font-mono text-xs' },
    {
      key: 'patientName',
      header: t('common.label.name'),
      className: 'font-medium',
      render: row => (
        <span className="flex items-center gap-2">
          {row.patientName}
          {row.vip && <Badge variant="warning">VIP</Badge>}
        </span>
      )
    },
    {
      key: 'gender',
      hideBelow: 'lg',
      header: t('patients.column.gender'),
      render: row => t(`person.gender.${row.gender}`)
    },
    {
      key: 'age',
      hideBelow: 'lg',
      header: t('patients.column.age'),
      render: row => (row.age != null ? String(row.age) : '-')
    },
    { key: 'phoneNo', hideBelow: 'md', header: t('patients.column.phone'), render: row => row.phoneNo || '-' },
    {
      key: 'registrationCategory',
      hideBelow: 'md',
      header: t('common.label.category'),
      render: row => (
        <Badge variant={CATEGORY_VARIANT[row.registrationCategory] ?? 'secondary'}>
          {t(`patients.category.${row.registrationCategory}`)}
        </Badge>
      )
    },
    {
      hideBelow: 'xl',
      header: t('patients.column.currentVisit'),
      sortable: false,
      render: row => row.visit?.visitCode ?? '-'
    },
    {
      key: 'createdAt',
      hideBelow: 'lg',
      header: t('patients.column.registered'),
      render: row => formatDate(row.createdAt)
    },
    {
      header: t('common.label.actions'),
      sortable: false,
      className: 'w-32 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {/* The clinical record. It is the patient's chart rather than their
              registration details, so it is a separate privilege and a
              separate screen from the edit form beside it. */}
          {can('get-encounter') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={event => {
                event.stopPropagation();
                navigate(`/clinical/patients/${row.id}`);
              }}
              aria-label={t('patients.openChart', { name: row.patientName })}
            >
              <Stethoscope className="h-4 w-4" />
            </Button>
          )}
          {can('update-patient') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={event => {
                // The row itself opens the record; without this the click would
                // run both handlers.
                event.stopPropagation();
                navigate(`/registration/patients/${row.id}/edit`);
              }}
              aria-label={t('common.action.editItem', { item: row.patientName })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-patient') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={event => {
                event.stopPropagation();
                setDeleting(row);
              }}
              aria-label={t('common.action.deleteItem', { item: row.patientName })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  const canEdit = can('update-patient');

  return (
    <>
      <PageHeader
        title={t('patients.title')}
        description={t('patients.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('patients.searchPlaceholder')}
        actions={
          can('create-patient') && (
            <Button onClick={() => navigate('/registration/patients/new')}>
              <Plus className="h-4 w-4" />
              {t('patients.form.submitNew')}
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
        onRowClick={canEdit ? row => navigate(`/registration/patients/${row.id}/edit`) : undefined}
        emptyMessage={t('patients.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        title={t('patients.deleteTitle')}
        description={
          deleting
            ? t('patients.deleteBody', {
                name: deleting.patientName,
                number: deleting.patientNo
              })
            : ''
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
