import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BanknoteArrowUp, Play, Plus, Send } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
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
import { Pagination } from '@/components/ui/pagination';
import { PrintControls } from '@/components/ui/print-controls';
import { Textarea } from '@/components/ui/textarea';
import { useResourceList } from '@/hooks/api/useResource';
import { payrollService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { PayrollRun, PayrollStatus } from '@/types/erp';

const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec'
] as const;

export default function PayrollPage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [confirming, setConfirming] = useState<{
    run: PayrollRun;
    action: 'process' | 'submit' | 'mark-paid';
  } | null>(null);
  const [viewingRun, setViewingRun] = useState<PayrollRun | null>(null);
  const [viewingPayslip, setViewingPayslip] = useState<number | null>(null);

  const list = useResourceList<PayrollRun>('/hr/payroll-runs', 'payroll-runs', 'periodYear');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });

  const transition = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'process' | 'submit' | 'mark-paid' }) =>
      payrollService.transition(id, action),
    onSuccess: (_data, variables) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['payslips'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });

      const messageKey =
        variables.action === 'process'
          ? 'payroll.process.done'
          : variables.action === 'submit'
            ? 'payroll.submit.done'
            : 'payroll.markPaid.done';
      toast.success(t(messageKey));
      setConfirming(null);
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const columns: Column<PayrollRun>[] = [
    { key: 'runNo', hideBelow: 'md', header: t('payroll.column.runNo'), className: 'font-mono text-xs' },
    {
      key: 'periodMonth',
      header: t('payroll.column.period'),
      render: row => `${t(`payroll.month.${MONTH_KEYS[row.periodMonth - 1]}`)} ${row.periodYear}`
    },
    {
      key: 'employeeCount',
      hideBelow: 'lg',
      header: t('payroll.column.employees'),
      className: 'text-right tabular-nums'
    },
    {
      hideBelow: 'lg',
      header: t('payroll.column.gross'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => formatCurrency(Number(row.totalEarning))
    },
    {
      hideBelow: 'xl',
      header: t('payroll.column.deductions'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => formatCurrency(Number(row.totalDeduction))
    },
    {
      header: t('payroll.column.net'),
      sortable: false,
      className: 'text-right font-medium tabular-nums',
      render: row => formatCurrency(Number(row.totalNet))
    },
    {
      key: 'status',
      header: t('payroll.column.status'),
      render: row => <PayrollStatusBadge status={row.status} />
    },
    {
      header: t('common.label.actions', { ns: 'translation' }),
      sortable: false,
      className: 'w-56 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {can('manage-payroll') && (row.status === 'draft' || row.status === 'processed') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={event => {
                event.stopPropagation();
                setConfirming({ run: row, action: 'process' });
              }}
            >
              <Play className="h-4 w-4" />
              {row.status === 'processed'
                ? t('payroll.action.reprocess')
                : t('payroll.action.process')}
            </Button>
          )}
          {can('manage-payroll') && row.status === 'processed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={event => {
                event.stopPropagation();
                setConfirming({ run: row, action: 'submit' });
              }}
            >
              <Send className="h-4 w-4" />
              {t('payroll.action.submit')}
            </Button>
          )}
          {can('manage-payroll') && row.status === 'approved' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={event => {
                event.stopPropagation();
                setConfirming({ run: row, action: 'mark-paid' });
              }}
            >
              <BanknoteArrowUp className="h-4 w-4" />
              {t('payroll.action.markPaid')}
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title={t('payroll.title')}
        description={t('payroll.description')}
        actions={
          can('manage-payroll') && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('payroll.action.newRun')}
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
        onRowClick={setViewingRun}
        emptyMessage={t('payroll.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <CreateRunDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          invalidate();
          setCreateOpen(false);
        }}
      />

      <ConfirmTransitionDialog
        confirming={confirming}
        submitting={transition.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) transition.mutate({ id: confirming.run.id, action: confirming.action });
        }}
      />

      <PayslipListDialog
        run={viewingRun}
        onClose={() => setViewingRun(null)}
        onOpenPayslip={setViewingPayslip}
      />

      <PayslipDialog id={viewingPayslip} onClose={() => setViewingPayslip(null)} />
    </>
  );
}

export function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  const { t } = useTranslation('erp');

  const variant =
    status === 'paid'
      ? 'success'
      : status === 'approved'
        ? 'info'
        : status === 'processed'
          ? 'warning'
          : status === 'cancelled'
            ? 'destructive'
            : 'secondary';

  return <Badge variant={variant}>{t(`payroll.status.${status}`)}</Badge>;
}

function CreateRunDialog({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation('erp');

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [remarks, setRemarks] = useState('');

  const create = useMutation({
    mutationFn: () =>
      payrollService.create({ periodYear: year, periodMonth: month, remarks: remarks || null }),
    onSuccess: () => {
      toast.success(t('payroll.create.created'));
      onCreated();
    },
    onError: (error: Error) => toast.error(error.message || t('payroll.create.failed'))
  });

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('payroll.create.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label={t('payroll.create.year')} required>
            <Input
              type="number"
              min={2000}
              max={2999}
              value={year}
              onChange={event => setYear(Number(event.target.value))}
            />
          </Field>

          <Field label={t('payroll.create.month')} required>
            <NativeSelect
              value={String(month)}
              onChange={event => setMonth(Number(event.target.value))}
            >
              {MONTH_KEYS.map((key, index) => (
                <option key={key} value={index + 1}>
                  {t(`payroll.month.${key}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('payroll.create.remarks')}>
            <Textarea rows={2} value={remarks} onChange={event => setRemarks(event.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {t('payroll.create.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmTransitionDialog({
  confirming,
  submitting,
  onClose,
  onConfirm
}: {
  confirming: { run: PayrollRun; action: 'process' | 'submit' | 'mark-paid' } | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation('erp');

  if (!confirming) return null;

  const { run, action } = confirming;

  const copy =
    action === 'process'
      ? {
          title: t('payroll.process.title'),
          // A re-run discards the previous payslips, which is a different
          // promise from the first run and is worth saying out loud.
          body:
            run.status === 'processed'
              ? t('payroll.process.reprocessBody')
              : t('payroll.process.body'),
          confirm: t('payroll.process.confirm')
        }
      : action === 'submit'
        ? {
            title: t('payroll.submit.title'),
            body: t('payroll.submit.body'),
            confirm: t('payroll.submit.confirm')
          }
        : {
            title: t('payroll.markPaid.title'),
            body: t('payroll.markPaid.body'),
            confirm: t('payroll.markPaid.confirm')
          };

  return (
    <Dialog open onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button onClick={onConfirm} disabled={submitting}>
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PayslipListDialog({
  run,
  onClose,
  onOpenPayslip
}: {
  run: PayrollRun | null;
  onClose: () => void;
  onOpenPayslip: (id: number) => void;
}) {
  const { t } = useTranslation('erp');

  const { data, isLoading } = useQuery({
    queryKey: ['payslips', run?.id],
    queryFn: () => payrollService.getPayslips({ payrollRunId: run?.id, limit: 500 }),
    enabled: run !== null
  });

  if (!run) return null;

  return (
    <Dialog open onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {run.runNo}
            <PayrollStatusBadge status={run.status} />
          </DialogTitle>
          <DialogDescription>
            {t(`payroll.month.${MONTH_KEYS[run.periodMonth - 1]}`)} {run.periodYear} ·{' '}
            {formatDate(run.fromDate)} — {formatDate(run.toDate)}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">...</p>
        ) : !data || data.data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('payroll.payslips.empty')}
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/95 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">
                    {t('payroll.payslips.column.employee')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('payroll.payslips.column.present')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('payroll.payslips.column.basic')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('payroll.payslips.column.overtime')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('payroll.payslips.column.gross')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('payroll.payslips.column.deductions')}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t('payroll.payslips.column.net')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(payslip => (
                  <tr
                    key={payslip.id}
                    className="cursor-pointer border-t hover:bg-accent/40"
                    onClick={() => onOpenPayslip(payslip.id)}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium">{payslip.employee?.fullName}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {payslip.employee?.employeeNo}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{payslip.presentDays}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(Number(payslip.earnedBasic))}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(Number(payslip.overtimeAmount))}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(Number(payslip.totalEarning))}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatCurrency(Number(payslip.totalDeduction))}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {formatCurrency(Number(payslip.netPay))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * One payslip, printable.
 *
 * It uses the app's existing print controls rather than a server-rendered PDF:
 * the browser prints Burmese correctly whatever font the operating system has,
 * which a PDF generated without an embedded Unicode font would not.
 */
function PayslipDialog({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { t } = useTranslation('erp');

  const { data, isLoading } = useQuery({
    queryKey: ['payslip', id],
    queryFn: () => payrollService.getPayslip(id as number),
    enabled: id !== null
  });

  if (id === null) return null;

  const earnings = (data?.lines ?? []).filter(line => line.componentType === 'earning');
  const deductions = (data?.lines ?? []).filter(line => line.componentType === 'deduction');

  return (
    <Dialog open onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-lg">
        {isLoading || !data ? (
          <p className="py-8 text-center text-sm text-muted-foreground">...</p>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('payroll.payslip.title')}</DialogTitle>
              <DialogDescription>
                {data.employee?.fullName} · {data.employee?.employeeNo}
                {data.payrollRun
                  ? ` · ${t(`payroll.month.${MONTH_KEYS[data.payrollRun.periodMonth - 1]}`)} ${
                      data.payrollRun.periodYear
                    }`
                  : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <section>
                <h3 className="mb-2 text-sm font-medium">{t('payroll.payslip.attendance')}</h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                  <Row label={t('payroll.payslip.workingDays')} value={data.workingDays} />
                  <Row label={t('payroll.payslip.presentDays')} value={data.presentDays} />
                  <Row label={t('payroll.payslip.leaveDays')} value={data.leaveDays} />
                  <Row label={t('payroll.payslip.absentDays')} value={data.absentDays} />
                  <Row label={t('payroll.payslip.overtimeHours')} value={data.overtimeHours} />
                </dl>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-medium">{t('payroll.payslip.earnings')}</h3>
                <dl className="space-y-1 text-sm">
                  {earnings.map(line => (
                    <Row
                      key={line.id}
                      label={line.name}
                      value={formatCurrency(Number(line.amount))}
                    />
                  ))}
                  <Row
                    label={t('payroll.payslip.gross')}
                    value={formatCurrency(Number(data.totalEarning))}
                    strong
                  />
                </dl>
              </section>

              {deductions.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-medium">{t('payroll.payslip.deductions')}</h3>
                  <dl className="space-y-1 text-sm">
                    {deductions.map(line => (
                      <Row
                        key={line.id}
                        label={line.name}
                        value={formatCurrency(Number(line.amount))}
                      />
                    ))}
                    <Row
                      label={t('payroll.payslip.totalDeductions')}
                      value={formatCurrency(Number(data.totalDeduction))}
                      strong
                    />
                  </dl>
                </section>
              )}

              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-medium">{t('payroll.payslip.netPay')}</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatCurrency(Number(data.netPay))}
                </span>
              </div>
            </div>

            <DialogFooter>
              <PrintControls />
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  strong
}: {
  label: string;
  value: string | number;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? 'border-t pt-1 font-medium' : ''}`}>
      <dt className={strong ? '' : 'text-muted-foreground'}>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
