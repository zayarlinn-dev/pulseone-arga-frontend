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
import { consultantServiceFeeService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency } from '@/lib/utils';
import type { ConsultantServiceFee } from '@/types/models';
import { ConsultantFeeModal } from '../components/ConsultantFeeModal';

export default function ConsultantFeeListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const { data: doctors = [] } = useDropdown('/dropdown/employees', {
    employmentCategory: 'doctor'
  });

  const [employeeFilter, setEmployeeFilter] = useState('');
  const extraParams = useMemo(
    () => (employeeFilter ? { employeeId: employeeFilter } : {}),
    [employeeFilter]
  );

  const list = useResourceList<ConsultantServiceFee>(
    '/administration/consultant-service-fees',
    'consultant-service-fees',
    'createdAt',
    extraParams
  );

  const [editing, setEditing] = useState<ConsultantServiceFee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<ConsultantServiceFee | null>(null);

  const mutations = useResourceMutations(
    consultantServiceFeeService,
    'consultant-service-fees',
    t('consultantFees.entity'),
    {
      onSuccess: () => {
        setModalOpen(false);
        setEditing(null);
        setDeleting(null);
      }
    }
  );

  const columns: Column<ConsultantServiceFee>[] = [
    {
      header: t('consultantFees.column.consultant'),
      sortable: false,
      className: 'font-medium',
      render: row => row.employee?.fullName ?? `#${row.employeeId}`
    },
    {
      header: t('consultantFees.column.service'),
      sortable: false,
      render: row => row.service?.serviceName ?? `#${row.serviceId}`
    },
    {
      key: 'feeType',
      header: t('consultantFees.column.fee'),
      render: row => (
        <span className="flex items-center gap-2">
          <span className="font-medium tabular-nums">
            {row.feeType === 'percentage'
              ? `${row.feeValue}%`
              : formatCurrency(row.feeValue)}
          </span>
          <Badge variant="secondary">
            {t(
              row.feeType === 'percentage'
                ? 'consultantFees.feeKind.ofLine'
                : 'consultantFees.feeKind.perUnit'
            )}
          </Badge>
        </span>
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
          {can('update-consultant-service-fee') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
              aria-label={t('consultantFees.editAria')}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-consultant-service-fee') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleting(row)}
              aria-label={t('consultantFees.deleteAria')}
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
        title={t('consultantFees.title')}
        description={t('consultantFees.description')}
        actions={
          can('create-consultant-service-fee') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('consultantFees.newFee')}
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NativeSelect
          value={employeeFilter}
          onChange={event => setEmployeeFilter(event.target.value)}
          className="h-8 w-auto min-w-48 text-xs"
          aria-label={t('consultantFees.filterConsultant')}
        >
          <option value="">{t('consultantFees.allConsultants')}</option>
          {doctors.map(doctor => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </option>
          ))}
        </NativeSelect>
        {employeeFilter && (
          <Button variant="ghost" size="sm" onClick={() => setEmployeeFilter('')}>
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
        emptyMessage={t('consultantFees.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <ConsultantFeeModal
        open={modalOpen}
        fee={editing}
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
        title={t('consultantFees.deleteTitle')}
        description={
          deleting
            ? t('consultantFees.deleteBody', {
                name: deleting.employee?.fullName ?? t('consultantFees.thisConsultant')
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
