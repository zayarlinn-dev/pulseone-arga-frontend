import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Lock, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { Textarea } from '@/components/ui/textarea';
import { useDropdown } from '@/hooks/api/useDropdown';
import { useResourceList } from '@/hooks/api/useResource';
import { attendanceService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import type { Attendance, AttendanceStatus } from '@/types/erp';

const STATUSES: AttendanceStatus[] = [
  'present',
  'absent',
  'late',
  'half-day',
  'leave',
  'holiday',
  'off-day'
];

/**
 * What actually happened, against what was rostered.
 *
 * Two views of the same data: the daily rows a supervisor corrects, and the
 * monthly totals a department head signs off before payroll runs. They are
 * tabs rather than pages because the second is the first added up, and moving
 * between them is something people do constantly at month end.
 */
export default function AttendancePage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);

  const [tab, setTab] = useState<'daily' | 'summary'>('daily');

  return (
    <>
      <PageHeader title={t('attendance.title')} description={t('attendance.description')} />

      <div className="mb-4 flex gap-1 rounded-md border p-1">
        {(['daily', 'summary'] as const).map(key => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'rounded-sm px-3 py-1.5 text-sm transition-colors',
              tab === key ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            )}
          >
            {t(`attendance.tab.${key}`)}
          </button>
        ))}
      </div>

      {tab === 'daily' ? <DailyTab canManage={can('manage-attendance')} /> : <SummaryTab />}
    </>
  );
}

function DailyTab({ canManage }: { canManage: boolean }) {
  const { t } = useTranslation('erp');
  const queryClient = useQueryClient();

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<Attendance | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: departments } = useDropdown('/dropdown/departments');

  const list = useResourceList<Attendance>('/hr/attendance', 'attendance', 'attendanceDate', {
    ...(date ? { date } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(status ? { status } : {})
  });

  const columns: Column<Attendance>[] = [
    {
      key: 'attendanceDate',
      header: t('attendance.column.date'),
      className: 'whitespace-nowrap',
      render: row => formatDate(row.attendanceDate)
    },
    {
      header: t('attendance.column.employee'),
      sortable: false,
      render: row => (
        <div>
          <div className="font-medium">{row.employee?.fullName ?? '-'}</div>
          <div className="font-mono text-xs text-muted-foreground">{row.employee?.employeeNo}</div>
        </div>
      )
    },
    {
      hideBelow: 'lg',
      header: t('attendance.column.shift'),
      sortable: false,
      render: row => row.shift?.shiftName ?? '-'
    },
    {
      hideBelow: 'sm',
      header: t('attendance.column.checkIn'),
      sortable: false,
      className: 'tabular-nums',
      render: row => (row.checkInTime ? formatDateTime(row.checkInTime) : '-')
    },
    {
      hideBelow: 'sm',
      header: t('attendance.column.checkOut'),
      sortable: false,
      className: 'tabular-nums',
      render: row => (row.checkOutTime ? formatDateTime(row.checkOutTime) : '-')
    },
    {
      key: 'status',
      header: t('attendance.column.status'),
      render: row => <AttendanceStatusBadge status={row.status} />
    },
    {
      hideBelow: 'md',
      header: t('attendance.column.worked'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => t('attendance.hours', { count: round1(row.workedMinutes / 60) })
    },
    {
      hideBelow: 'lg',
      header: t('attendance.column.overtime'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row =>
        row.overtimeMinutes > 0
          ? t('attendance.hours', { count: round1(row.overtimeMinutes / 60) })
          : '-'
    },
    {
      hideBelow: 'xl',
      header: t('attendance.column.late'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row =>
        row.lateMinutes > 0 ? t('queue.minutes', { count: row.lateMinutes }) : '-'
    },
    {
      header: t('common.label.actions', { ns: 'translation' }),
      sortable: false,
      className: 'w-20 text-right',
      render: row =>
        row.isLocked ? (
          <Badge variant="secondary" title={t('attendance.lockedNotice')}>
            <Lock className="h-3 w-3" />
          </Badge>
        ) : canManage ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(row);
              setModalOpen(true);
            }}
          >
            {t('common.action.edit', { ns: 'translation' })}
          </Button>
        ) : null
    }
  ];

  return (
    <>
      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-4">
          <Field label={t('attendance.column.date')}>
            <Input type="date" value={date} onChange={event => setDate(event.target.value)} />
          </Field>

          <Field label={t('roster.department')}>
            <NativeSelect
              value={departmentId}
              onChange={event => setDepartmentId(event.target.value)}
            >
              <option value="">{t('roster.allDepartments')}</option>
              {departments?.map(department => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('attendance.column.status')}>
            <NativeSelect value={status} onChange={event => setStatus(event.target.value)}>
              <option value="">{t('audit.filter.allActions')}</option>
              {STATUSES.map(value => (
                <option key={value} value={value}>
                  {t(`attendance.status.${value}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <div className="flex items-end">
            {canManage && (
              <Button
                className="w-full"
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                {t('attendance.action.record')}
              </Button>
            )}
          </div>
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
        emptyMessage={t('attendance.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <AttendanceModal
        open={modalOpen}
        attendance={editing}
        defaultDate={date}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['attendance'] });
          setModalOpen(false);
          setEditing(null);
        }}
      />
    </>
  );
}

function SummaryTab() {
  const { t } = useTranslation('erp');

  const [fromDate, setFromDate] = useState(() => firstOfMonth());
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [departmentId, setDepartmentId] = useState('');

  const { data: departments } = useDropdown('/dropdown/departments');

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-summary', fromDate, toDate, departmentId],
    queryFn: () =>
      attendanceService.getSummary({
        fromDate,
        toDate,
        ...(departmentId ? { departmentId: Number(departmentId) } : {})
      })
  });

  return (
    <>
      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-3">
          <Field label={t('audit.filter.from')}>
            <Input
              type="date"
              value={fromDate}
              onChange={event => setFromDate(event.target.value)}
            />
          </Field>
          <Field label={t('audit.filter.to')}>
            <Input type="date" value={toDate} onChange={event => setToDate(event.target.value)} />
          </Field>
          <Field label={t('roster.department')}>
            <NativeSelect
              value={departmentId}
              onChange={event => setDepartmentId(event.target.value)}
            >
              <option value="">{t('roster.allDepartments')}</option>
              {departments?.map(department => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">...</p>
          ) : !data || data.rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {t('attendance.empty')}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">
                    {t('attendance.summaryColumn.employee')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('attendance.summaryColumn.present')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('attendance.summaryColumn.absent')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('attendance.summaryColumn.leave')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('attendance.summaryColumn.late')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('attendance.summaryColumn.holiday')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('attendance.summaryColumn.workedHours')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('attendance.summaryColumn.overtimeHours')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('attendance.summaryColumn.lateMinutes')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map(row => (
                  <tr key={row.employeeId} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.employeeName}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {row.employeeNo}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.presentDays}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.absentDays}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.leaveDays}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.lateDays}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.holidayDays}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {round1(row.workedHours)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {round1(row.overtimeHours)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.totalLateMinutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function AttendanceModal({
  open,
  attendance,
  defaultDate,
  onClose,
  onSaved
}: {
  open: boolean;
  attendance: Attendance | null;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('erp');

  const [form, setForm] = useState({
    employeeId: '',
    attendanceDate: defaultDate,
    status: 'present' as AttendanceStatus,
    remarks: ''
  });

  const { data: employees } = useDropdown('/dropdown/employees', {}, open);

  const seed = attendance?.id ?? `new-${defaultDate}`;
  const [seededFor, setSeededFor] = useState<string | number>(seed);
  if (open && seededFor !== seed) {
    setSeededFor(seed);
    setForm({
      employeeId: attendance ? String(attendance.employeeId) : '',
      attendanceDate: attendance?.attendanceDate ?? defaultDate,
      status: attendance?.status ?? 'present',
      remarks: attendance?.remarks ?? ''
    });
  }

  const save = useMutation({
    mutationFn: () =>
      attendanceService.save({
        employeeId: Number(form.employeeId),
        attendanceDate: form.attendanceDate,
        status: form.status,
        remarks: form.remarks || null
      }),
    onSuccess: () => {
      toast.success(t('attendance.form.saved'));
      onSaved();
    },
    onError: (error: Error) => toast.error(error.message || t('attendance.form.saveFailed'))
  });

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('attendance.form.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label={t('attendance.form.employee')} required>
            <NativeSelect
              value={form.employeeId}
              disabled={Boolean(attendance)}
              onChange={event => setForm({ ...form, employeeId: event.target.value })}
            >
              <option value="">-</option>
              {employees?.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('attendance.form.date')} required>
            <Input
              type="date"
              value={form.attendanceDate}
              disabled={Boolean(attendance)}
              onChange={event => setForm({ ...form, attendanceDate: event.target.value })}
            />
          </Field>

          <Field label={t('attendance.form.status')} required>
            <NativeSelect
              value={form.status}
              onChange={event =>
                setForm({ ...form, status: event.target.value as AttendanceStatus })
              }
            >
              {STATUSES.map(value => (
                <option key={value} value={value}>
                  {t(`attendance.status.${value}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('attendance.form.remarks')}>
            <Textarea
              rows={2}
              value={form.remarks}
              onChange={event => setForm({ ...form, remarks: event.target.value })}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button onClick={() => save.mutate()} disabled={!form.employeeId || save.isPending}>
            {t('common.action.save', { ns: 'translation' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  const { t } = useTranslation('erp');

  const variant =
    status === 'present'
      ? 'success'
      : status === 'absent'
        ? 'destructive'
        : status === 'late' || status === 'half-day'
          ? 'warning'
          : status === 'leave'
            ? 'info'
            : 'secondary';

  return <Badge variant={variant}>{t(`attendance.status.${status}`)}</Badge>;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function firstOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-01`;
}
