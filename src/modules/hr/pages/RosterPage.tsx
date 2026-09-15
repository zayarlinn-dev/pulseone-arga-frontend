import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Moon, Plus, Send, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useDropdown } from '@/hooks/api/useDropdown';
import { rosterService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { cn, formatClockTime } from '@/lib/utils';
import type { RosterDay } from '@/types/erp';

/** The planner shows a week at a time — the unit a ward actually plans in. */
const DAYS_SHOWN = 7;

export default function RosterPage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);
  const queryClient = useQueryClient();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [departmentId, setDepartmentId] = useState('');
  const [assignFor, setAssignFor] = useState<{ employeeId?: number; date?: string } | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [removing, setRemoving] = useState<{ id: number; name: string; date: string } | null>(null);

  const { data: departments } = useDropdown('/dropdown/departments');

  const fromDate = toISODate(weekStart);
  const toDate = toISODate(addDays(weekStart, DAYS_SHOWN - 1));

  const { data: grid, isLoading } = useQuery({
    queryKey: ['roster-grid', fromDate, toDate, departmentId],
    queryFn: () =>
      rosterService.getGrid({
        fromDate,
        toDate,
        ...(departmentId ? { departmentId: Number(departmentId) } : {})
      })
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['roster-grid'] });

  const publish = useMutation({
    mutationFn: () =>
      rosterService.publish({
        fromDate,
        toDate,
        departmentId: departmentId ? Number(departmentId) : null
      }),
    onSuccess: result => {
      invalidate();
      setPublishOpen(false);
      toast.success(t('roster.publish.done', { count: result.published }));
    },
    onError: (error: Error) => toast.error(error.message || t('roster.publish.failed'))
  });

  const remove = useMutation({
    mutationFn: (id: number) => rosterService.remove(id),
    onSuccess: () => {
      invalidate();
      setRemoving(null);
      toast.success(t('roster.remove.done'));
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <>
      <PageHeader
        title={t('roster.title')}
        description={t('roster.description')}
        actions={
          <div className="flex items-center gap-2">
            {can('manage-roster') && (
              <Button variant="outline" onClick={() => setAssignFor({})}>
                <Plus className="h-4 w-4" />
                {t('roster.action.assign')}
              </Button>
            )}
            {can('publish-roster') && (
              <Button onClick={() => setPublishOpen(true)}>
                <Send className="h-4 w-4" />
                {t('roster.action.publish')}
              </Button>
            )}
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label={t('roster.previous')}
              onClick={() => setWeekStart(addDays(weekStart, -DAYS_SHOWN))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setWeekStart(startOfWeek(new Date()))}>
              {t('roster.today')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('roster.next')}
              onClick={() => setWeekStart(addDays(weekStart, DAYS_SHOWN))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="min-w-48">
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
          </div>

          <div className="text-sm text-muted-foreground">
            {fromDate} — {toDate}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">...</p>
          ) : !grid || grid.rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t('roster.empty')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium">
                    {t('roster.employee')}
                  </th>
                  {grid.dates.map(date => (
                    <th key={date} className="px-2 py-2 text-center font-medium">
                      <div>{weekdayShort(date)}</div>
                      <div className="text-xs font-normal text-muted-foreground">
                        {date.slice(5)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map(row => (
                  <tr key={row.employeeId} className="border-t">
                    <td className="sticky left-0 z-10 bg-background px-3 py-2">
                      <div className="font-medium">{row.employeeName}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {row.employeeNo}
                      </div>
                    </td>
                    {grid.dates.map(date => (
                      <td key={date} className="px-1 py-1 text-center">
                        <RosterCell
                          day={row.days[date]}
                          canManage={can('manage-roster')}
                          onAssign={() =>
                            setAssignFor({ employeeId: row.employeeId, date })
                          }
                          onRemove={day =>
                            setRemoving({
                              id: day.rosterId,
                              name: row.employeeName,
                              date
                            })
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <AssignDialog
        open={assignFor !== null}
        employeeId={assignFor?.employeeId}
        date={assignFor?.date}
        onClose={() => setAssignFor(null)}
        onSaved={() => {
          invalidate();
          setAssignFor(null);
        }}
      />

      <Dialog open={publishOpen} onOpenChange={value => !value && setPublishOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('roster.publish.title')}</DialogTitle>
            <DialogDescription>
              {t('roster.publish.body', { from: fromDate, to: toDate })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>
              {t('common.action.cancel', { ns: 'translation' })}
            </Button>
            <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
              {t('roster.publish.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        open={Boolean(removing)}
        title={t('roster.remove.title')}
        description={
          removing ? t('roster.remove.body', { name: removing.name, date: removing.date }) : ''
        }
        deleting={remove.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={async () => {
          if (removing) await remove.mutateAsync(removing.id);
        }}
      />
    </>
  );
}

function RosterCell({
  day,
  canManage,
  onAssign,
  onRemove
}: {
  day?: RosterDay;
  canManage: boolean;
  onAssign: () => void;
  onRemove: (day: RosterDay) => void;
}) {
  const { t } = useTranslation('erp');

  if (!day) {
    return canManage ? (
      <button
        type="button"
        onClick={onAssign}
        className="w-full rounded-sm px-2 py-3 text-xs text-muted-foreground transition-colors hover:bg-accent"
      >
        {t('roster.off')}
      </button>
    ) : (
      <span className="text-xs text-muted-foreground">{t('roster.off')}</span>
    );
  }

  return (
    <div
      className={cn(
        'group relative rounded-sm border px-2 py-1.5 text-xs',
        day.status === 'published' ? 'border-success/40 bg-success/10' : 'bg-muted/40'
      )}
    >
      <div className="flex items-center justify-center gap-1 font-medium">
        {day.isNight && <Moon className="h-3 w-3" />}
        {day.shiftCode}
      </div>
      <div className="tabular-nums text-muted-foreground">
        {formatClockTime(day.startTime)}-{formatClockTime(day.endTime)}
      </div>

      {canManage && (
        <button
          type="button"
          aria-label={t('roster.action.clear')}
          onClick={() => onRemove(day)}
          className="absolute -right-1 -top-1 hidden rounded-full bg-destructive p-0.5 text-destructive-foreground group-hover:block"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

function AssignDialog({
  open,
  employeeId,
  date,
  onClose,
  onSaved
}: {
  open: boolean;
  employeeId?: number;
  date?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('erp');

  const [form, setForm] = useState({
    employeeId: employeeId ? String(employeeId) : '',
    rosterDate: date ?? toISODate(new Date()),
    shiftId: '',
    departmentId: '',
    remarks: ''
  });

  const { data: employees } = useDropdown('/dropdown/employees', {}, open);
  const { data: shifts } = useDropdown('/dropdown/shifts', {}, open);
  const { data: departments } = useDropdown('/dropdown/departments', {}, open);

  // The grid opens this on a specific cell, so the employee and the day are
  // already decided; re-seeding on open is what carries them into the form.
  const seed = `${employeeId ?? ''}|${date ?? ''}`;
  const [seededFor, setSeededFor] = useState(seed);
  if (open && seededFor !== seed) {
    setSeededFor(seed);
    setForm({
      employeeId: employeeId ? String(employeeId) : '',
      rosterDate: date ?? toISODate(new Date()),
      shiftId: '',
      departmentId: '',
      remarks: ''
    });
  }

  const save = useMutation({
    mutationFn: () =>
      rosterService.bulkAssign(
        [
          {
            employeeId: Number(form.employeeId),
            rosterDate: form.rosterDate,
            shiftId: Number(form.shiftId),
            departmentId: form.departmentId ? Number(form.departmentId) : null,
            remarks: form.remarks || null
          }
        ],
        true
      ),
    onSuccess: () => {
      toast.success(t('roster.assign.saved'));
      onSaved();
    },
    onError: (error: Error) => toast.error(error.message || t('roster.assign.saveFailed'))
  });

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('roster.assign.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label={t('roster.assign.employee')} required>
            <NativeSelect
              value={form.employeeId}
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

          <Field label={t('roster.assign.date')} required>
            <Input
              type="date"
              value={form.rosterDate}
              onChange={event => setForm({ ...form, rosterDate: event.target.value })}
            />
          </Field>

          <Field label={t('roster.assign.shift')} required>
            <NativeSelect
              value={form.shiftId}
              onChange={event => setForm({ ...form, shiftId: event.target.value })}
            >
              <option value="">-</option>
              {shifts?.map(shift => (
                <option key={shift.id} value={shift.id}>
                  {shift.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('roster.assign.department')}>
            <NativeSelect
              value={form.departmentId}
              onChange={event => setForm({ ...form, departmentId: event.target.value })}
            >
              <option value="">-</option>
              {departments?.map(department => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('roster.assign.remarks')}>
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
          <Button
            onClick={() => save.mutate()}
            disabled={!form.employeeId || !form.shiftId || save.isPending}
          >
            {t('roster.assign.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Monday-start weeks, which is how a Myanmar hospital's rota reads. */
function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toISODate(date: Date): string {
  // Built from the local parts rather than through toISOString, which shifts
  // to UTC and can hand back the previous day east of Greenwich.
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function weekdayShort(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short' });
}
