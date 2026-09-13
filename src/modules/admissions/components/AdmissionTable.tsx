import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { useResourceList } from '@/hooks/api/useResource';
import { useAuthStore } from '@/stores/userStore';
import { formatDateTime } from '@/lib/utils';
import { stayInDays } from '../roomStatus';
import type { CheckIn } from '@/types/models';

const STATUS_VARIANT: Record<CheckIn['status'], BadgeProps['variant']> = {
  admitted: 'success',
  discharged: 'secondary',
  transferred: 'info'
};

interface AdmissionTableProps {
  onEdit: (admission: CheckIn) => void;
  onDischarge: (admission: CheckIn) => void;
}

/**
 * The admission register: every admission, including the discharged ones the
 * ward board no longer shows.
 *
 * It carries its own search and paging rather than taking them from the page,
 * because the board next to it searches a loaded board client-side while this
 * searches the server — one shared box would mean two different behaviours
 * behind one control.
 */
export function AdmissionTable({ onEdit, onDischarge }: AdmissionTableProps) {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);

  const [statusFilter, setStatusFilter] = useState('');
  const extraParams = useMemo(
    () => (statusFilter ? { status: statusFilter } : {}),
    [statusFilter]
  );

  const list = useResourceList<CheckIn>('/rooms/check-in', 'admissions', 'checkInDate', extraParams);

  const columns: Column<CheckIn>[] = [
    {
      key: 'admissionNo',
      header: t('admissions.column.admissionNo'),
      className: 'font-mono text-xs'
    },
    {
      header: t('admissions.column.patient'),
      sortable: false,
      className: 'font-medium',
      render: row =>
        row.patient ? (
          <span className="flex flex-col">
            <span>{row.patient.patientName}</span>
            <span className="font-mono text-xs text-muted-foreground">{row.patient.patientNo}</span>
          </span>
        ) : (
          '-'
        )
    },
    {
      hideBelow: 'sm',
      header: t('admissions.column.room'),
      sortable: false,
      render: row =>
        row.room ? (
          <span className="flex flex-col">
            <span>{row.room.roomName}</span>
            <span className="text-xs text-muted-foreground">
              {t(`rooms.type.${row.room.roomType}`)}
              {row.room.floor ? ` · ${t('admissions.modal.roomFloor', { floor: row.room.floor })}` : ''}
            </span>
          </span>
        ) : (
          '-'
        )
    },
    { hideBelow: 'lg', header: t('common.label.type'), sortable: false, render: row => row.admissionType?.entityName ?? '-' },
    {
      hideBelow: 'md',
      header: t('admissions.column.doctor'),
      sortable: false,
      render: row => row.attendingDoctor?.fullName ?? '-'
    },
    {
      key: 'checkInDate',
      hideBelow: 'lg',
      header: t('admissions.column.admitted'),
      render: row => (
        <span className="flex flex-col">
          <span>{formatDateTime(row.checkInDate)}</span>
          {row.status === 'admitted' && (
            <span className="text-xs text-muted-foreground">
              {t('admissions.dayCount', { count: stayInDays(row.checkInDate) })}
            </span>
          )}
        </span>
      )
    },
    {
      key: 'checkOutDate',
      hideBelow: 'xl',
      header: t('admissions.column.discharged'),
      render: row => formatDateTime(row.checkOutDate)
    },
    {
      key: 'status',
      header: t('common.label.status'),
      render: row => (
        <Badge variant={STATUS_VARIANT[row.status] ?? 'secondary'}>
          {t(`admissions.status.${row.status}`)}
        </Badge>
      )
    },
    {
      header: t('common.label.actions'),
      sortable: false,
      className: 'w-32 text-right',
      render: row => {
        if (row.status === 'discharged') {
          return <span className="text-xs text-muted-foreground">-</span>;
        }

        return (
          <div className="flex justify-end gap-1">
            {can('update-check-in') && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(row)}
                  aria-label={t('admissions.editAria', { number: row.admissionNo })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDischarge(row)}
                  aria-label={t('admissions.dischargeAria', {
                    name: row.patient?.patientName ?? row.admissionNo
                  })}
                >
                  <LogOut className="h-4 w-4" />
                  {t('admissions.discharge')}
                </Button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={list.searchQuery}
            onChange={event => list.setSearchQuery(event.target.value)}
            placeholder={t('admissions.searchPlaceholder')}
            aria-label={t('admissions.searchPlaceholder')}
            className="h-8 pl-8 text-xs"
          />
        </div>

        <NativeSelect
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className="h-8 w-auto min-w-40 text-xs"
          aria-label={t('admissions.filter.label')}
        >
          <option value="">{t('admissions.filter.all')}</option>
          <option value="admitted">{t('admissions.status.admitted')}</option>
          <option value="discharged">{t('admissions.status.discharged')}</option>
          <option value="transferred">{t('admissions.status.transferred')}</option>
        </NativeSelect>

        {(statusFilter || list.searchQuery) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('');
              list.setSearchQuery('');
            }}
          >
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
        emptyMessage={t('admissions.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />
    </>
  );
}
