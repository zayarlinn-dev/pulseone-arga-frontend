import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { CalendarPlus, Check, LogIn, UserX, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { useDropdown } from '@/hooks/api/useDropdown';
import { useResourceList } from '@/hooks/api/useResource';
import { appointmentService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { formatDate } from '@/lib/utils';
import type { Appointment, AppointmentStatus } from '@/types/erp';
import { ArriveDialog } from '../components/ArriveDialog';
import { CancelAppointmentDialog } from '../components/CancelAppointmentDialog';

export default function AppointmentListPage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);
  const queryClient = useQueryClient();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [arriving, setArriving] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);

  const { data: doctors } = useDropdown('/dropdown/employees', { employmentCategory: 'doctor' });

  const list = useResourceList<Appointment>('/appointments', 'appointments', 'startTime', {
    ...(date ? { date } : {}),
    ...(status ? { status } : {}),
    ...(doctorId ? { doctorId } : {})
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    queryClient.invalidateQueries({ queryKey: ['availability'] });
    queryClient.invalidateQueries({ queryKey: ['queue-board'] });
  };

  const transition = useMutation({
    mutationFn: ({
      id,
      action,
      reason
    }: {
      id: number;
      action: 'cancel' | 'confirm' | 'complete' | 'no-show';
      reason?: string;
    }) => appointmentService.transition(id, action, reason),
    onSuccess: () => {
      invalidate();
      toast.success(t('appointments.toast.updated'));
      setCancelling(null);
    },
    onError: (error: Error) => toast.error(error.message || t('appointments.toast.failed'))
  });

  const columns: Column<Appointment>[] = [
    { key: 'appointmentNo', hideBelow: 'md', header: t('appointments.column.appointmentNo'), className: 'font-mono text-xs' },
    {
      key: 'appointmentDate',
      header: t('appointments.column.date'),
      className: 'whitespace-nowrap',
      render: row => formatDate(row.appointmentDate)
    },
    {
      key: 'startTime',
      hideBelow: 'sm',
      header: t('appointments.column.time'),
      className: 'tabular-nums',
      render: row => `${row.startTime} - ${row.endTime}`
    },
    {
      header: t('appointments.column.patient'),
      sortable: false,
      render: row => (
        <div>
          <div className="font-medium">{row.patient?.patientName ?? '-'}</div>
          <div className="font-mono text-xs text-muted-foreground">{row.patient?.patientNo}</div>
        </div>
      )
    },
    {
      hideBelow: 'md',
      header: t('appointments.column.doctor'),
      sortable: false,
      render: row => row.doctor?.fullName ?? '-'
    },
    {
      hideBelow: 'lg',
      header: t('appointments.column.clinic'),
      sortable: false,
      render: row => row.serviceCenter?.serviceCenterName ?? '-'
    },
    {
      key: 'status',
      header: t('appointments.column.status'),
      render: row => <AppointmentStatusBadge status={row.status} />
    },
    {
      header: t('common.label.actions', { ns: 'translation' }),
      sortable: false,
      className: 'w-40 text-right',
      render: row => {
        const isOpen = ['booked', 'confirmed'].includes(row.status);

        return (
          <div className="flex justify-end gap-1">
            {isOpen && can('update-appointment') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={t('appointments.action.confirm')}
                onClick={() => transition.mutate({ id: row.id, action: 'confirm' })}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {isOpen && can('manage-queue') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-success"
                aria-label={t('appointments.action.arrive')}
                onClick={() => setArriving(row)}
              >
                <LogIn className="h-4 w-4" />
              </Button>
            )}
            {isOpen && can('update-appointment') && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={t('appointments.action.noShow')}
                  onClick={() => transition.mutate({ id: row.id, action: 'no-show' })}
                >
                  <UserX className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  aria-label={t('appointments.action.cancel')}
                  onClick={() => setCancelling(row)}
                >
                  <X className="h-4 w-4" />
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
      <PageHeader
        title={t('appointments.title')}
        description={t('appointments.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('appointments.searchPlaceholder')}
        actions={
          can('create-appointment') && (
            <Button asChild>
              <Link to="/appointments/new">
                <CalendarPlus className="h-4 w-4" />
                {t('common.action.newItem', {
                  ns: 'translation',
                  item: t('appointments.entity')
                })}
              </Link>
            </Button>
          )
        }
      />

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-3">
          <Field label={t('appointments.column.date')}>
            <Input type="date" value={date} onChange={event => setDate(event.target.value)} />
          </Field>

          <Field label={t('appointments.column.doctor')}>
            <NativeSelect value={doctorId} onChange={event => setDoctorId(event.target.value)}>
              <option value="">{t('audit.filter.allTypes')}</option>
              {doctors?.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('appointments.column.status')}>
            <NativeSelect value={status} onChange={event => setStatus(event.target.value)}>
              <option value="">{t('audit.filter.allActions')}</option>
              {(
                [
                  'booked',
                  'confirmed',
                  'arrived',
                  'completed',
                  'cancelled',
                  'no-show'
                ] as AppointmentStatus[]
              ).map(value => (
                <option key={value} value={value}>
                  {t(`appointments.status.${value}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        emptyMessage={t('appointments.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <ArriveDialog
        appointment={arriving}
        onClose={() => setArriving(null)}
        onArrived={() => {
          invalidate();
          setArriving(null);
        }}
      />

      <CancelAppointmentDialog
        appointment={cancelling}
        submitting={transition.isPending}
        onClose={() => setCancelling(null)}
        onConfirm={reason => {
          if (cancelling) transition.mutate({ id: cancelling.id, action: 'cancel', reason });
        }}
      />
    </>
  );
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { t } = useTranslation('erp');

  const variant =
    status === 'completed'
      ? 'success'
      : status === 'arrived'
        ? 'info'
        : status === 'cancelled' || status === 'no-show'
          ? 'destructive'
          : status === 'confirmed'
            ? 'default'
            : 'secondary';

  return <Badge variant={variant}>{t(`appointments.status.${status}`)}</Badge>;
}
