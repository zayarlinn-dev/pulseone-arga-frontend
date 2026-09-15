import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock, Pencil, Plus, Trash2, Umbrella } from 'lucide-react';
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
import { Pagination } from '@/components/ui/pagination';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { holidayService, leaveTypeService, shiftService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { cn, formatClockTime, formatDate } from '@/lib/utils';
import type { Holiday, LeaveType, Shift } from '@/types/erp';

type Tab = 'shifts' | 'holidays' | 'leaveTypes';

/**
 * The three reference lists HR is built on: the shifts the roster is drawn
 * from, the holiday calendar attendance and leave both read, and the leave
 * types entitlements hang off.
 *
 * One screen rather than three because they are configured together, once, by
 * the same person — and because none of them is a daily list worth its own
 * place in the sidebar.
 */
export default function HRSettingsPage() {
  const { t } = useTranslation('erp');
  const [tab, setTab] = useState<Tab>('shifts');

  const tabs: { key: Tab; label: string; icon: typeof Clock }[] = [
    { key: 'shifts', label: t('shifts.title'), icon: Clock },
    { key: 'holidays', label: t('holidays.title'), icon: CalendarDays },
    { key: 'leaveTypes', label: t('leaveTypes.title'), icon: Umbrella }
  ];

  return (
    <>
      <PageHeader
        title={t(`${tab}.title`)}
        description={t(`${tab}.description`)}
      />

      <div className="mb-4 flex flex-wrap gap-1 rounded-md border p-1">
        {tabs.map(entry => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            className={cn(
              'flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm transition-colors',
              tab === entry.key ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            )}
          >
            <entry.icon className="h-4 w-4" />
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'shifts' && <ShiftsTab />}
      {tab === 'holidays' && <HolidaysTab />}
      {tab === 'leaveTypes' && <LeaveTypesTab />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Shifts
// ---------------------------------------------------------------------------

function ShiftsTab() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);

  const list = useResourceList<Shift>('/hr/shifts', 'shifts', 'shiftName', {}, 'asc');
  const [editing, setEditing] = useState<Shift | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Shift | null>(null);

  const mutations = useResourceMutations(shiftService, 'shifts', t('shifts.entity'), {
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
      setDeleting(null);
    }
  });

  const columns: Column<Shift>[] = [
    { key: 'shiftCode', hideBelow: 'sm', header: t('shifts.column.code'), className: 'font-mono text-xs' },
    { key: 'shiftName', header: t('shifts.column.name'), className: 'font-medium' },
    {
      key: 'startTime',
      header: t('shifts.column.hours'),
      className: 'tabular-nums',
      render: row => `${formatClockTime(row.startTime)} - ${formatClockTime(row.endTime)}`
    },
    {
      hideBelow: 'md',
      header: t('shifts.column.duration'),
      sortable: false,
      className: 'tabular-nums',
      render: row => t('attendance.hours', { count: shiftHours(row) })
    },
    {
      hideBelow: 'lg',
      header: t('shifts.column.break'),
      sortable: false,
      className: 'tabular-nums',
      render: row => t('queue.minutes', { count: row.breakMinutes })
    },
    {
      hideBelow: 'lg',
      header: t('shifts.column.grace'),
      sortable: false,
      className: 'tabular-nums',
      render: row => t('queue.minutes', { count: row.graceMinutes })
    },
    {
      hideBelow: 'md',
      header: t('shifts.column.night'),
      sortable: false,
      render: row =>
        row.isNight ? <Badge variant="info">{t('common.label.yes', { ns: 'translation' })}</Badge> : '-'
    },
    ...actionColumn<Shift>(
      t('common.label.actions', { ns: 'translation' }),
      'shift',
      setEditing,
      setOpen,
      setDeleting
    )
  ];

  return (
    <>
      <ListShell
        list={list}
        columns={columns}
        emptyMessage={t('shifts.empty')}
        action={
          can('create-shift') && (
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { ns: 'translation', item: t('shifts.entity') })}
            </Button>
          )
        }
      />

      <ShiftModal
        open={open}
        shift={editing}
        submitting={mutations.isCreating || mutations.isUpdating}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={async values => {
          if (editing) await mutations.update({ id: editing.id, data: values });
          else await mutations.create(values);
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title={t('shifts.deleteTitle')}
        description={deleting ? t('shifts.deleteBody', { name: deleting.shiftName }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}

/** Paid hours: the clock span less the break, wrapping past midnight. */
function shiftHours(shift: Shift): number {
  const [startHour, startMinute] = shift.startTime.split(':').map(Number);
  const [endHour, endMinute] = shift.endTime.split(':').map(Number);

  let span = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  if (span <= 0) span += 1440;

  return Math.round(((span - shift.breakMinutes) / 60) * 10) / 10;
}

function ShiftModal({
  open,
  shift,
  submitting,
  onClose,
  onSubmit
}: {
  open: boolean;
  shift: Shift | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: Partial<Shift>) => Promise<void>;
}) {
  const { t } = useTranslation('erp');
  const [form, setForm] = useState<Partial<Shift>>(() => shift ?? blankShift());

  // Re-seeded when the dialog opens on a different row. Done in an effect
  // rather than during render so the fields are not reset out from under a
  // keystroke, and keyed on the row rather than on `open` so re-opening the
  // same row does not discard an edit in progress.
  useEffect(() => {
    if (open) setForm(shift ?? blankShift());
  }, [open, shift]);

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {shift
              ? t('common.action.editItem', { ns: 'translation', item: t('shifts.entity') })
              : t('common.action.newItem', { ns: 'translation', item: t('shifts.entity') })}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t('shifts.form.code')} required>
            <Input
              value={form.shiftCode ?? ''}
              maxLength={20}
              onChange={event => setForm({ ...form, shiftCode: event.target.value })}
            />
          </Field>
          <Field label={t('shifts.form.name')} required>
            <Input
              value={form.shiftName ?? ''}
              maxLength={50}
              onChange={event => setForm({ ...form, shiftName: event.target.value })}
            />
          </Field>
          <Field label={t('shifts.form.startTime')} required>
            <Input
              type="time"
              value={form.startTime ?? '08:00'}
              onChange={event => setForm({ ...form, startTime: event.target.value })}
            />
          </Field>
          <Field label={t('shifts.form.endTime')} required hint={t('shifts.form.endHelp')}>
            <Input
              type="time"
              value={form.endTime ?? '16:00'}
              onChange={event => setForm({ ...form, endTime: event.target.value })}
            />
          </Field>
          <Field label={t('shifts.form.breakMinutes')}>
            <Input
              type="number"
              min={0}
              max={480}
              value={form.breakMinutes ?? 0}
              onChange={event => setForm({ ...form, breakMinutes: Number(event.target.value) })}
            />
          </Field>
          <Field label={t('shifts.form.graceMinutes')} hint={t('shifts.form.graceHelp')}>
            <Input
              type="number"
              min={0}
              max={120}
              value={form.graceMinutes ?? 10}
              onChange={event => setForm({ ...form, graceMinutes: Number(event.target.value) })}
            />
          </Field>
          <CheckboxField
            label={t('shifts.form.isNight')}
            checked={form.isNight ?? false}
            onChange={event => setForm({ ...form, isNight: event.target.checked })}
          />
          <CheckboxField
            label={t('shifts.form.active')}
            checked={form.isActive ?? true}
            onChange={event => setForm({ ...form, isActive: event.target.checked })}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={submitting}>
            {t('common.action.save', { ns: 'translation' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function blankShift(): Partial<Shift> {
  return {
    shiftCode: '',
    shiftName: '',
    startTime: '08:00',
    endTime: '16:00',
    breakMinutes: 0,
    graceMinutes: 10,
    isNight: false,
    isActive: true
  };
}

// ---------------------------------------------------------------------------
// Holidays
// ---------------------------------------------------------------------------

function HolidaysTab() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);

  const list = useResourceList<Holiday>('/hr/holidays', 'holidays', 'holidayDate', {}, 'asc');
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Holiday | null>(null);
  const [form, setForm] = useState<Partial<Holiday>>({});

  const mutations = useResourceMutations(holidayService, 'holidays', t('holidays.entity'), {
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
      setDeleting(null);
    }
  });

  const columns: Column<Holiday>[] = [
    {
      key: 'holidayDate',
      header: t('holidays.column.date'),
      className: 'whitespace-nowrap',
      render: row => formatDate(row.holidayDate)
    },
    { key: 'holidayName', header: t('holidays.column.name'), className: 'font-medium' },
    {
      header: t('holidays.column.paid'),
      sortable: false,
      render: row => (
        <Badge variant={row.isPaid ? 'success' : 'secondary'}>
          {row.isPaid
            ? t('common.label.yes', { ns: 'translation' })
            : t('common.label.no', { ns: 'translation' })}
        </Badge>
      )
    },
    ...actionColumn<Holiday>(
      t('common.label.actions', { ns: 'translation' }),
      'holiday',
      row => {
        setEditing(row);
        setForm(row);
      },
      setOpen,
      setDeleting
    )
  ];

  return (
    <>
      <ListShell
        list={list}
        columns={columns}
        emptyMessage={t('holidays.empty')}
        action={
          can('create-holiday') && (
            <Button
              onClick={() => {
                setEditing(null);
                setForm({ isPaid: true });
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { ns: 'translation', item: t('holidays.entity') })}
            </Button>
          )
        }
      />

      <Dialog open={open} onOpenChange={value => !value && setOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t('common.action.editItem', { ns: 'translation', item: t('holidays.entity') })
                : t('common.action.newItem', { ns: 'translation', item: t('holidays.entity') })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Field label={t('holidays.form.date')} required>
              <Input
                type="date"
                value={form.holidayDate ?? ''}
                onChange={event => setForm({ ...form, holidayDate: event.target.value })}
              />
            </Field>
            <Field label={t('holidays.form.name')} required>
              <Input
                value={form.holidayName ?? ''}
                maxLength={80}
                onChange={event => setForm({ ...form, holidayName: event.target.value })}
              />
            </Field>
            <CheckboxField
              label={t('holidays.form.isPaid')}
              checked={form.isPaid ?? true}
              onChange={event => setForm({ ...form, isPaid: event.target.checked })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('common.action.cancel', { ns: 'translation' })}
            </Button>
            <Button
              disabled={mutations.isMutating}
              onClick={async () => {
                if (editing) await mutations.update({ id: editing.id, data: form });
                else await mutations.create(form);
              }}
            >
              {t('common.action.save', { ns: 'translation' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title={t('holidays.deleteTitle')}
        description={deleting ? t('holidays.deleteBody', { name: deleting.holidayName }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Leave types
// ---------------------------------------------------------------------------

function LeaveTypesTab() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);

  const list = useResourceList<LeaveType>(
    '/hr/leave-types',
    'leave-types',
    'leaveTypeName',
    {},
    'asc'
  );
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<LeaveType | null>(null);
  const [form, setForm] = useState<Partial<LeaveType>>({});

  const mutations = useResourceMutations(leaveTypeService, 'leave-types', t('leaveTypes.entity'), {
    onSuccess: () => {
      setOpen(false);
      setEditing(null);
      setDeleting(null);
    }
  });

  const columns: Column<LeaveType>[] = [
    { key: 'leaveTypeCode', hideBelow: 'sm', header: t('leaveTypes.column.code'), className: 'font-mono text-xs' },
    { key: 'leaveTypeName', header: t('leaveTypes.column.name'), className: 'font-medium' },
    {
      key: 'daysPerYear',
      header: t('leaveTypes.column.daysPerYear'),
      className: 'text-right tabular-nums'
    },
    {
      hideBelow: 'md',
      header: t('leaveTypes.column.paid'),
      sortable: false,
      render: row => <YesNo value={row.isPaid} />
    },
    {
      hideBelow: 'lg',
      header: t('leaveTypes.column.approval'),
      sortable: false,
      render: row => <YesNo value={row.requiresApproval} />
    },
    {
      hideBelow: 'lg',
      header: t('leaveTypes.column.carryForward'),
      sortable: false,
      render: row => <YesNo value={row.carryForward} />
    },
    ...actionColumn<LeaveType>(
      t('common.label.actions', { ns: 'translation' }),
      'leave-type',
      row => {
        setEditing(row);
        setForm(row);
      },
      setOpen,
      setDeleting
    )
  ];

  return (
    <>
      <ListShell
        list={list}
        columns={columns}
        emptyMessage={t('leaveTypes.empty')}
        action={
          can('create-leave-type') && (
            <Button
              onClick={() => {
                setEditing(null);
                setForm({ isPaid: true, requiresApproval: true, isActive: true, daysPerYear: 0 });
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { ns: 'translation', item: t('leaveTypes.entity') })}
            </Button>
          )
        }
      />

      <Dialog open={open} onOpenChange={value => !value && setOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t('common.action.editItem', { ns: 'translation', item: t('leaveTypes.entity') })
                : t('common.action.newItem', { ns: 'translation', item: t('leaveTypes.entity') })}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('leaveTypes.form.code')} required>
              <Input
                value={form.leaveTypeCode ?? ''}
                maxLength={20}
                onChange={event => setForm({ ...form, leaveTypeCode: event.target.value })}
              />
            </Field>
            <Field label={t('leaveTypes.form.name')} required>
              <Input
                value={form.leaveTypeName ?? ''}
                maxLength={50}
                onChange={event => setForm({ ...form, leaveTypeName: event.target.value })}
              />
            </Field>
            <Field label={t('leaveTypes.form.daysPerYear')} required>
              <Input
                type="number"
                min={0}
                max={365}
                step="0.5"
                value={form.daysPerYear ?? 0}
                onChange={event => setForm({ ...form, daysPerYear: Number(event.target.value) })}
              />
            </Field>
            <Field label={t('leaveTypes.form.maxCarryDays')}>
              <Input
                type="number"
                min={0}
                step="0.5"
                value={form.maxCarryDays ?? 0}
                onChange={event => setForm({ ...form, maxCarryDays: Number(event.target.value) })}
              />
            </Field>

            <CheckboxField
              className="sm:col-span-2"
              label={t('leaveTypes.form.isPaid')}
              description={t('leaveTypes.form.isPaidHelp')}
              checked={form.isPaid ?? true}
              onChange={event => setForm({ ...form, isPaid: event.target.checked })}
            />
            <CheckboxField
              className="sm:col-span-2"
              label={t('leaveTypes.form.requiresApproval')}
              description={t('leaveTypes.form.requiresApprovalHelp')}
              checked={form.requiresApproval ?? true}
              onChange={event => setForm({ ...form, requiresApproval: event.target.checked })}
            />
            <CheckboxField
              label={t('leaveTypes.form.carryForward')}
              checked={form.carryForward ?? false}
              onChange={event => setForm({ ...form, carryForward: event.target.checked })}
            />
            <CheckboxField
              label={t('leaveTypes.form.active')}
              checked={form.isActive ?? true}
              onChange={event => setForm({ ...form, isActive: event.target.checked })}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('common.action.cancel', { ns: 'translation' })}
            </Button>
            <Button
              disabled={mutations.isMutating}
              onClick={async () => {
                if (editing) await mutations.update({ id: editing.id, data: form });
                else await mutations.create(form);
              }}
            >
              {t('common.action.save', { ns: 'translation' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title={t('leaveTypes.deleteTitle')}
        description={deleting ? t('leaveTypes.deleteBody', { name: deleting.leaveTypeName }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function YesNo({ value }: { value?: boolean }) {
  const { t } = useTranslation();
  return (
    <Badge variant={value ? 'success' : 'secondary'}>
      {value ? t('common.label.yes') : t('common.label.no')}
    </Badge>
  );
}

/** Table + pagination + the one action button, shared by all three tabs. */
function ListShell<T>({
  list,
  columns,
  emptyMessage,
  action
}: {
  list: ReturnType<typeof useResourceList<T>>;
  columns: Column<T>[];
  emptyMessage: string;
  action: ReactNode;
}) {
  return (
    <>
      {action && <div className="mb-3 flex justify-end">{action}</div>}

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => (row as { id: number }).id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        emptyMessage={emptyMessage}
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

/**
 * The edit/delete cell, built once for all three lists.
 *
 * The header string is passed in rather than looked up here, because a column
 * definition is data and `t` cannot be called from one — the buttons
 * themselves are a component, which can.
 */
function actionColumn<T extends { id: number }>(
  header: string,
  resource: string,
  onEdit: (row: T) => void,
  setOpen: (open: boolean) => void,
  onDelete: (row: T) => void
): Column<T>[] {
  return [
    {
      header,
      sortable: false,
      className: 'w-24 text-right',
      render: row => (
        <RowActions
          resource={resource}
          onEdit={() => {
            onEdit(row);
            setOpen(true);
          }}
          onDelete={() => onDelete(row)}
        />
      )
    }
  ];
}

/**
 * `resource` is the middle of the privilege slug — "shift" gives
 * update-shift / delete-shift — so each button appears only for someone who
 * could actually use it.
 */
function RowActions({
  resource,
  onEdit,
  onDelete
}: {
  resource: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);

  return (
    <div className="flex justify-end gap-1">
      {can(`update-${resource}`) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={t('common.action.edit')}
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {can(`delete-${resource}`) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          aria-label={t('common.action.delete')}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
