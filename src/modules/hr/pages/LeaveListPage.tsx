import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Info, Plus, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { CheckboxField } from '@/components/ui/checkbox-field';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { Textarea } from '@/components/ui/textarea';
import { useDropdown } from '@/hooks/api/useDropdown';
import { useResourceList } from '@/hooks/api/useResource';
import { leaveService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { formatDate } from '@/lib/utils';
import type { LeaveRequest, LeaveStatus } from '@/types/erp';

export default function LeaveListPage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);
  const queryClient = useQueryClient();

  const [status, setStatus] = useState('pending');
  const [departmentId, setDepartmentId] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);
  const [decision, setDecision] = useState<{
    request: LeaveRequest;
    action: 'approve' | 'reject' | 'cancel';
  } | null>(null);

  const { data: departments } = useDropdown('/dropdown/departments');

  const list = useResourceList<LeaveRequest>('/hr/leave-requests', 'leave-requests', 'fromDate', {
    ...(status ? { status } : {}),
    ...(departmentId ? { departmentId } : {})
  });

  const decide = useMutation({
    mutationFn: ({
      id,
      action,
      remarks
    }: {
      id: number;
      action: 'approve' | 'reject' | 'cancel';
      remarks: string;
    }) => leaveService.decide(id, action, remarks),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      toast.success(t(`leave.toast.${variables.action}d` as 'leave.toast.approved'));
      setDecision(null);
    },
    onError: (error: Error) => toast.error(error.message || t('leave.toast.failed'))
  });

  const columns: Column<LeaveRequest>[] = [
    { key: 'requestNo', hideBelow: 'md', header: t('leave.column.requestNo'), className: 'font-mono text-xs' },
    {
      header: t('leave.column.employee'),
      sortable: false,
      render: row => (
        <div>
          <div className="font-medium">{row.employee?.fullName ?? '-'}</div>
          <div className="font-mono text-xs text-muted-foreground">{row.employee?.employeeNo}</div>
        </div>
      )
    },
    {
      hideBelow: 'md',
      header: t('leave.column.type'),
      sortable: false,
      render: row => row.leaveType?.leaveTypeName ?? '-'
    },
    {
      key: 'fromDate',
      header: t('leave.column.from'),
      className: 'whitespace-nowrap',
      render: row => formatDate(row.fromDate)
    },
    {
      hideBelow: 'sm',
      header: t('leave.column.to'),
      sortable: false,
      className: 'whitespace-nowrap',
      render: row => formatDate(row.toDate)
    },
    {
      key: 'days',
      hideBelow: 'lg',
      header: t('leave.column.days'),
      className: 'text-right tabular-nums'
    },
    {
      key: 'status',
      header: t('leave.column.status'),
      render: row => <LeaveStatusBadge status={row.status} />
    },
    {
      header: t('common.label.actions', { ns: 'translation' }),
      sortable: false,
      className: 'w-32 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {row.status === 'pending' && !row.approvalRequestId && can('decide-leave') && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-success"
                aria-label={t('leave.action.approve')}
                onClick={() => setDecision({ request: row, action: 'approve' })}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                aria-label={t('leave.action.reject')}
                onClick={() => setDecision({ request: row, action: 'reject' })}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          {/* A request in a chain is decided from the Approvals screen; deciding
              it here as well would leave the two records disagreeing. */}
          {row.status === 'pending' && row.approvalRequestId && (
            <Badge variant="info" title={t('leave.inChain')}>
              <Info className="h-3 w-3" />
            </Badge>
          )}
          {(row.status === 'pending' || row.status === 'approved') && can('create-leave') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDecision({ request: row, action: 'cancel' })}
            >
              {t('leave.action.cancel')}
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title={t('leave.title')}
        description={t('leave.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('leave.searchPlaceholder')}
        actions={
          can('create-leave') && (
            <Button onClick={() => setApplyOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('leave.apply.title')}
            </Button>
          )
        }
      />

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2">
          <Field label={t('leave.column.status')}>
            <NativeSelect value={status} onChange={event => setStatus(event.target.value)}>
              <option value="">{t('audit.filter.allActions')}</option>
              {(['pending', 'approved', 'rejected', 'cancelled'] as LeaveStatus[]).map(value => (
                <option key={value} value={value}>
                  {t(`leave.status.${value}`)}
                </option>
              ))}
            </NativeSelect>
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

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        emptyMessage={t('leave.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <ApplyDialog
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onApplied={() => {
          queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
          setApplyOpen(false);
        }}
      />

      <DecisionDialog
        decision={decision}
        submitting={decide.isPending}
        onClose={() => setDecision(null)}
        onConfirm={remarks => {
          if (!decision) return;
          decide.mutate({ id: decision.request.id, action: decision.action, remarks });
        }}
      />
    </>
  );
}

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const { t } = useTranslation('erp');

  const variant =
    status === 'approved'
      ? 'success'
      : status === 'rejected'
        ? 'destructive'
        : status === 'cancelled'
          ? 'secondary'
          : 'warning';

  return <Badge variant={variant}>{t(`leave.status.${status}`)}</Badge>;
}

/**
 * Applying for leave.
 *
 * The balance panel updates as the employee and type are chosen, because the
 * question the form has to answer before anything else is "do I have the days".
 */
function ApplyDialog({
  open,
  onClose,
  onApplied
}: {
  open: boolean;
  onClose: () => void;
  onApplied: () => void;
}) {
  const { t } = useTranslation('erp');

  const [employeeId, setEmployeeId] = useState('');
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [handover, setHandover] = useState('');
  const [error, setError] = useState('');

  const { data: employees } = useDropdown('/dropdown/employees', {}, open);
  const { data: leaveTypes } = useDropdown('/dropdown/leave-types', {}, open);

  const { data: balances } = useQuery({
    queryKey: ['leave-balances', employeeId],
    queryFn: () => leaveService.getBalances(Number(employeeId)),
    enabled: open && Boolean(employeeId)
  });

  const selectedBalance = balances?.balances.find(
    balance => String(balance.leaveTypeId) === leaveTypeId
  );

  const apply = useMutation({
    mutationFn: () =>
      leaveService.create({
        employeeId: Number(employeeId),
        leaveTypeId: Number(leaveTypeId),
        fromDate,
        toDate,
        isHalfDay,
        reason: reason || null,
        handover: handover || null
      }),
    onSuccess: () => {
      toast.success(t('leave.apply.applied'));
      onApplied();
    },
    onError: (error: Error) => toast.error(error.message || t('leave.apply.failed'))
  });

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('leave.apply.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label={t('leave.apply.employee')} required>
            <NativeSelect
              value={employeeId}
              onChange={event => setEmployeeId(event.target.value)}
            >
              <option value="">-</option>
              {employees?.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field
            label={t('leave.apply.leaveType')}
            required
            hint={
              selectedBalance
                ? t('leave.apply.available', { count: selectedBalance.available })
                : undefined
            }
          >
            <NativeSelect
              value={leaveTypeId}
              onChange={event => setLeaveTypeId(event.target.value)}
            >
              <option value="">-</option>
              {leaveTypes?.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          {/* Side by side a date field has about 95px of text room on a phone,
              which "dd/mm/yyyy" only just fits; they stack instead. */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('leave.apply.fromDate')} required>
              <Input
                type="date"
                value={fromDate}
                onChange={event => {
                  setFromDate(event.target.value);
                  // A single-date application is the common case, so the end
                  // follows the start until it is set independently.
                  if (!toDate || toDate < event.target.value) setToDate(event.target.value);
                  if (error) setError('');
                }}
              />
            </Field>
            <Field label={t('leave.apply.toDate')} required error={error || undefined}>
              <Input
                type="date"
                value={toDate}
                onChange={event => {
                  setToDate(event.target.value);
                  if (error) setError('');
                }}
              />
            </Field>
          </div>

          <CheckboxField
            label={t('leave.apply.isHalfDay')}
            description={t('leave.apply.isHalfDayHelp')}
            checked={isHalfDay}
            onChange={event => setIsHalfDay(event.target.checked)}
          />

          <Field label={t('leave.apply.reason')}>
            <Textarea rows={2} value={reason} onChange={event => setReason(event.target.value)} />
          </Field>

          <Field label={t('leave.apply.handover')} hint={t('leave.apply.handoverHelp')}>
            <Textarea
              rows={2}
              value={handover}
              onChange={event => setHandover(event.target.value)}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={apply.isPending}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button
            disabled={!employeeId || !leaveTypeId || !fromDate || !toDate || apply.isPending}
            onClick={() => {
              if (toDate < fromDate) {
                setError(t('leave.apply.endBeforeStart'));
                return;
              }
              apply.mutate();
            }}
          >
            {t('leave.apply.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DecisionDialog({
  decision,
  submitting,
  onClose,
  onConfirm
}: {
  decision: { request: LeaveRequest; action: 'approve' | 'reject' | 'cancel' } | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => void;
}) {
  const { t } = useTranslation('erp');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const seed = decision ? `${decision.request.id}-${decision.action}` : '';
  const [seededFor, setSeededFor] = useState(seed);
  if (decision && seededFor !== seed) {
    setSeededFor(seed);
    setRemarks('');
    setError('');
  }

  if (!decision) return null;

  const { action } = decision;
  const titleKey =
    action === 'approve'
      ? 'leave.decide.approveTitle'
      : action === 'reject'
        ? 'leave.decide.rejectTitle'
        : 'leave.decide.cancelTitle';
  const bodyKey =
    action === 'approve'
      ? 'leave.decide.approveBody'
      : action === 'reject'
        ? 'leave.decide.rejectBody'
        : 'leave.decide.cancelBody';

  return (
    <Dialog open onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>{t(bodyKey)}</DialogDescription>
        </DialogHeader>

        <Field
          label={t('leave.decide.remarks')}
          required={action === 'reject'}
          error={error || undefined}
        >
          <Textarea
            rows={3}
            value={remarks}
            onChange={event => {
              setRemarks(event.target.value);
              if (error) setError('');
            }}
          />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button
            variant={action === 'approve' ? 'default' : 'destructive'}
            disabled={submitting}
            onClick={() => {
              if (action === 'reject' && !remarks.trim()) {
                setError(t('leave.decide.reasonRequired'));
                return;
              }
              onConfirm(remarks.trim());
            }}
          >
            {t(`leave.action.${action}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
