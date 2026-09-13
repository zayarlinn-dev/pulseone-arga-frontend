import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { CheckboxField } from '@/components/ui/checkbox-field';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { useDropdown } from '@/hooks/api/useDropdown';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { doctorScheduleService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { formatDate } from '@/lib/utils';
import type { DoctorSchedule } from '@/types/erp';

/**
 * The catalogue keys weekdays by name; the API keys them by `time.Weekday`, so
 * index 0 is Sunday. This array is the one place the two meet.
 */
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

/** Falls back to Sunday for an out-of-range index rather than crashing a row. */
function weekdayKey(weekday: number): (typeof WEEKDAY_KEYS)[number] {
  return WEEKDAY_KEYS[weekday] ?? WEEKDAY_KEYS[0];
}

/** The recurring clinic templates the slot grid is generated from. */
export default function DoctorSchedulePage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);

  const [doctorId, setDoctorId] = useState('');
  const [editing, setEditing] = useState<DoctorSchedule | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<DoctorSchedule | null>(null);

  const { data: doctors } = useDropdown('/dropdown/employees', { employmentCategory: 'doctor' });

  const list = useResourceList<DoctorSchedule>(
    '/doctor-schedules',
    'doctor-schedules',
    'weekday',
    doctorId ? { employeeId: doctorId } : {},
    'asc'
  );

  const mutations = useResourceMutations(
    doctorScheduleService,
    'doctor-schedules',
    t('schedules.entity'),
    {
      onSuccess: () => {
        setModalOpen(false);
        setEditing(null);
        setDeleting(null);
      }
    }
  );

  const columns: Column<DoctorSchedule>[] = [
    {
      header: t('schedules.column.doctor'),
      sortable: false,
      render: row => row.employee?.fullName ?? '-'
    },
    {
      key: 'weekday',
      header: t('schedules.column.weekday'),
      render: row => t(`schedules.weekday.${weekdayKey(row.weekday)}`)
    },
    {
      key: 'startTime',
      header: t('schedules.column.hours'),
      className: 'tabular-nums',
      render: row => `${row.startTime} - ${row.endTime}`
    },
    {
      hideBelow: 'lg',
      header: t('schedules.column.slot'),
      sortable: false,
      render: row => t('queue.minutes', { count: row.slotMinutes })
    },
    {
      hideBelow: 'lg',
      header: t('schedules.column.capacity'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => row.capacityPerSlot
    },
    {
      hideBelow: 'md',
      header: t('schedules.column.clinic'),
      sortable: false,
      render: row => row.serviceCenter?.serviceCenterName ?? '-'
    },
    {
      key: 'validFrom',
      hideBelow: 'xl',
      header: t('schedules.column.validFrom'),
      render: row => formatDate(row.validFrom)
    },
    {
      hideBelow: 'xl',
      header: t('schedules.column.validTo'),
      sortable: false,
      render: row => (row.validTo ? formatDate(row.validTo) : '-')
    },
    {
      key: 'isActive',
      hideBelow: 'sm',
      header: t('schedules.column.active'),
      render: row => (
        <Badge variant={row.isActive ? 'success' : 'secondary'}>
          {row.isActive
            ? t('common.label.yes', { ns: 'translation' })
            : t('common.label.no', { ns: 'translation' })}
        </Badge>
      )
    },
    {
      header: t('common.label.actions', { ns: 'translation' }),
      sortable: false,
      className: 'w-24 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {can('update-doctor-schedule') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={t('common.action.edit', { ns: 'translation' })}
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-doctor-schedule') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              aria-label={t('common.action.delete', { ns: 'translation' })}
              onClick={() => setDeleting(row)}
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
        title={t('schedules.title')}
        description={t('schedules.description')}
        actions={
          can('create-doctor-schedule') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { ns: 'translation', item: t('schedules.entity') })}
            </Button>
          )
        }
      />

      <div className="mb-4 max-w-xs">
        <Field label={t('schedules.column.doctor')}>
          <NativeSelect value={doctorId} onChange={event => setDoctorId(event.target.value)}>
            <option value="">{t('audit.filter.allTypes')}</option>
            {doctors?.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        emptyMessage={t('schedules.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <ScheduleModal
        open={modalOpen}
        schedule={editing}
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
        open={Boolean(deleting)}
        title={t('schedules.deleteTitle')}
        description={t('schedules.deleteBody')}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}

interface ScheduleFormValues {
  employeeId: number;
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  capacityPerSlot: number;
  serviceCenterId: number | null;
  roomId: number | null;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
}

function ScheduleModal({
  open,
  schedule,
  submitting,
  onClose,
  onSubmit
}: {
  open: boolean;
  schedule: DoctorSchedule | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<DoctorSchedule>) => Promise<void>;
}) {
  const { t } = useTranslation('erp');

  const { data: doctors } = useDropdown(
    '/dropdown/employees',
    { employmentCategory: 'doctor' },
    open
  );
  const { data: serviceCenters } = useDropdown('/dropdown/service-centers', {}, open);
  const { data: rooms } = useDropdown('/dropdown/rooms', {}, open);

  const [form, setForm] = useState<ScheduleFormValues>(blank);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    setError('');
    setForm(
      schedule
        ? {
            employeeId: schedule.employeeId,
            weekday: schedule.weekday,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            slotMinutes: schedule.slotMinutes,
            capacityPerSlot: schedule.capacityPerSlot,
            serviceCenterId: schedule.serviceCenterId ?? null,
            roomId: schedule.roomId ?? null,
            validFrom: schedule.validFrom,
            validTo: schedule.validTo ?? null,
            isActive: schedule.isActive ?? true
          }
        : blank()
    );
  }, [open, schedule]);

  const handleSubmit = async () => {
    if (form.endTime <= form.startTime) {
      setError(t('schedules.form.endBeforeStart'));
      return;
    }
    await onSubmit({ ...form, validTo: form.validTo || null });
  };

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {schedule
              ? t('common.action.editItem', { ns: 'translation', item: t('schedules.entity') })
              : t('common.action.newItem', { ns: 'translation', item: t('schedules.entity') })}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('schedules.form.doctor')} required className="sm:col-span-2">
            <NativeSelect
              value={form.employeeId ? String(form.employeeId) : ''}
              onChange={event => setForm({ ...form, employeeId: Number(event.target.value) })}
            >
              <option value="">-</option>
              {doctors?.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('schedules.form.weekday')} required>
            <NativeSelect
              value={String(form.weekday)}
              onChange={event => setForm({ ...form, weekday: Number(event.target.value) })}
            >
              {WEEKDAYS.map(day => (
                <option key={day} value={day}>
                  {t(`schedules.weekday.${weekdayKey(day)}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('schedules.form.clinic')}>
            <NativeSelect
              value={form.serviceCenterId ? String(form.serviceCenterId) : ''}
              onChange={event =>
                setForm({
                  ...form,
                  serviceCenterId: event.target.value ? Number(event.target.value) : null
                })
              }
            >
              <option value="">-</option>
              {serviceCenters?.map(centre => (
                <option key={centre.id} value={centre.id}>
                  {centre.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('schedules.form.startTime')} required>
            <Input
              type="time"
              value={form.startTime}
              onChange={event => setForm({ ...form, startTime: event.target.value })}
            />
          </Field>

          <Field
            label={t('schedules.form.endTime')}
            required
            error={error || undefined}
          >
            <Input
              type="time"
              value={form.endTime}
              onChange={event => {
                setForm({ ...form, endTime: event.target.value });
                if (error) setError('');
              }}
            />
          </Field>

          <Field label={t('schedules.form.slotMinutes')} required>
            <Input
              type="number"
              min={5}
              max={240}
              value={form.slotMinutes}
              onChange={event => setForm({ ...form, slotMinutes: Number(event.target.value) })}
            />
          </Field>

          <Field
            label={t('schedules.form.capacityPerSlot')}
            hint={t('schedules.form.capacityHelp')}
          >
            <Input
              type="number"
              min={1}
              max={50}
              value={form.capacityPerSlot}
              onChange={event => setForm({ ...form, capacityPerSlot: Number(event.target.value) })}
            />
          </Field>

          <Field label={t('schedules.form.room')}>
            <NativeSelect
              value={form.roomId ? String(form.roomId) : ''}
              onChange={event =>
                setForm({ ...form, roomId: event.target.value ? Number(event.target.value) : null })
              }
            >
              <option value="">-</option>
              {rooms?.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('schedules.form.validFrom')} required>
            <Input
              type="date"
              value={form.validFrom}
              onChange={event => setForm({ ...form, validFrom: event.target.value })}
            />
          </Field>

          <Field label={t('schedules.form.validTo')} hint={t('schedules.form.validToHelp')}>
            <Input
              type="date"
              value={form.validTo ?? ''}
              onChange={event => setForm({ ...form, validTo: event.target.value || null })}
            />
          </Field>

          <CheckboxField
            className="sm:col-span-2"
            label={t('schedules.form.active')}
            checked={form.isActive}
            onChange={event => setForm({ ...form, isActive: event.target.checked })}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button onClick={handleSubmit} disabled={!form.employeeId || submitting}>
            {t('common.action.save', { ns: 'translation' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function blank(): ScheduleFormValues {
  return {
    employeeId: 0,
    weekday: 1,
    startTime: '09:00',
    endTime: '12:00',
    slotMinutes: 15,
    capacityPerSlot: 1,
    serviceCenterId: null,
    roomId: null,
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: null,
    isActive: true
  };
}
