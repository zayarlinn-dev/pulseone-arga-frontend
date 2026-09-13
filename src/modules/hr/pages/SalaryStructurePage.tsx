import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
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
import { MoneyInput } from '@/components/ui/money-input';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { Textarea } from '@/components/ui/textarea';
import { useDropdown } from '@/hooks/api/useDropdown';
import { useResourceList } from '@/hooks/api/useResource';
import { salaryStructureService, type SalaryStructurePayload } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { SalaryStructure } from '@/types/erp';

interface ComponentDraft {
  componentType: 'earning' | 'deduction';
  name: string;
  calcType: 'fixed' | 'percent';
  value: string;
}

export default function SalaryStructurePage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);
  const queryClient = useQueryClient();

  const [employeeId, setEmployeeId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: employees } = useDropdown('/dropdown/employees');

  const list = useResourceList<SalaryStructure>(
    '/hr/salary-structures',
    'salary-structures',
    'effectiveFrom',
    employeeId ? { employeeId } : {}
  );

  const columns: Column<SalaryStructure>[] = [
    {
      header: t('salary.column.employee'),
      sortable: false,
      render: row => (
        <div>
          <div className="font-medium">{row.employee?.fullName ?? '-'}</div>
          <div className="font-mono text-xs text-muted-foreground">{row.employee?.employeeNo}</div>
        </div>
      )
    },
    {
      key: 'effectiveFrom',
      header: t('salary.column.effectiveFrom'),
      className: 'whitespace-nowrap',
      render: row => formatDate(row.effectiveFrom)
    },
    {
      hideBelow: 'md',
      header: t('salary.column.effectiveTo'),
      sortable: false,
      className: 'whitespace-nowrap',
      render: row => (row.effectiveTo ? formatDate(row.effectiveTo) : '-')
    },
    {
      header: t('salary.column.basic'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => formatCurrency(Number(row.basicSalary))
    },
    {
      hideBelow: 'lg',
      header: t('salary.column.workingDays'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => row.workingDaysPerMonth
    },
    {
      hideBelow: 'lg',
      header: t('salary.column.overtimeRate'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => `×${row.overtimeRate}`
    },
    {
      key: 'isActive',
      hideBelow: 'sm',
      header: t('salary.column.active'),
      render: row => (
        <Badge variant={row.isActive ? 'success' : 'secondary'}>
          {row.isActive
            ? t('common.label.yes', { ns: 'translation' })
            : t('common.label.no', { ns: 'translation' })}
        </Badge>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title={t('salary.title')}
        description={t('salary.description')}
        actions={
          can('create-salary-structure') && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('salary.form.title')}
            </Button>
          )
        }
      />

      <Card className="mb-4">
        <CardContent className="max-w-xs pt-6">
          <Field label={t('salary.column.employee')}>
            <NativeSelect value={employeeId} onChange={event => setEmployeeId(event.target.value)}>
              <option value="">{t('audit.filter.allTypes')}</option>
              {employees?.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
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
        emptyMessage={t('salary.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <SalaryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
          setModalOpen(false);
        }}
      />
    </>
  );
}

/**
 * Setting a salary.
 *
 * There is no edit path, only this: a change of salary is a new structure with
 * a later effective date, because a payroll run for March has to read March's
 * figures even when it is processed in May after a raise. The previous
 * structure is closed by the server, so nothing here has to remember to do it.
 */
function SalaryModal({
  open,
  onClose,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('erp');

  const [form, setForm] = useState<SalaryStructurePayload>(() => blank());
  const [components, setComponents] = useState<ComponentDraft[]>([]);
  const [error, setError] = useState('');

  const { data: employees } = useDropdown('/dropdown/employees', {}, open);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(blank());
      setComponents([]);
      setError('');
    }
  }

  const save = useMutation({
    mutationFn: () =>
      salaryStructureService.create({
        ...form,
        components: components
          .filter(component => component.name.trim())
          .map((component, index) => ({ ...component, sortOrder: index }))
      }),
    onSuccess: () => {
      toast.success(t('salary.form.saved'));
      onSaved();
    },
    onError: (error: Error) => toast.error(error.message || t('salary.form.saveFailed'))
  });

  const setComponent = (index: number, patch: Partial<ComponentDraft>) => {
    setComponents(current =>
      current.map((component, i) => (i === index ? { ...component, ...patch } : component))
    );
  };

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('salary.form.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('salary.form.employee')} required>
              <NativeSelect
                value={form.employeeId ? String(form.employeeId) : ''}
                onChange={event => setForm({ ...form, employeeId: Number(event.target.value) })}
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
              label={t('salary.form.effectiveFrom')}
              required
              hint={t('salary.form.effectiveFromHelp')}
            >
              <Input
                type="date"
                value={form.effectiveFrom}
                onChange={event => setForm({ ...form, effectiveFrom: event.target.value })}
              />
            </Field>

            <Field label={t('salary.form.basicSalary')} required error={error || undefined}>
              <MoneyInput
                value={form.basicSalary}
                onChange={event => {
                  setForm({ ...form, basicSalary: event.target.value });
                  if (error) setError('');
                }}
              />
            </Field>

            <Field label={t('salary.form.workingDaysPerMonth')}>
              <Input
                type="number"
                min={1}
                max={31}
                value={form.workingDaysPerMonth ?? 26}
                onChange={event =>
                  setForm({ ...form, workingDaysPerMonth: Number(event.target.value) })
                }
              />
            </Field>

            <Field label={t('salary.form.overtimeRate')}>
              <Input
                type="number"
                min={0}
                step="0.1"
                value={form.overtimeRate ?? '1.5'}
                onChange={event => setForm({ ...form, overtimeRate: event.target.value })}
              />
            </Field>

            <Field label={t('salary.form.currency')}>
              <Input
                value={form.currency ?? 'mmk'}
                maxLength={10}
                onChange={event => setForm({ ...form, currency: event.target.value })}
              />
            </Field>
          </div>

          <Field label={t('salary.form.remarks')}>
            <Textarea
              rows={2}
              value={form.remarks ?? ''}
              onChange={event => setForm({ ...form, remarks: event.target.value })}
            />
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">{t('salary.form.components')}</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setComponents([
                    ...components,
                    { componentType: 'earning', name: '', calcType: 'fixed', value: '0' }
                  ])
                }
              >
                <Plus className="h-4 w-4" />
                {t('salary.form.addComponent')}
              </Button>
            </div>

            <div className="space-y-2">
              {components.map((component, index) => (
                <div key={index} className="flex items-end gap-2 rounded-md border p-2">
                  <Field className="w-32" label={t('salary.form.componentType')}>
                    <NativeSelect
                      value={component.componentType}
                      onChange={event =>
                        setComponent(index, {
                          componentType: event.target.value as 'earning' | 'deduction'
                        })
                      }
                    >
                      <option value="earning">{t('salary.componentType.earning')}</option>
                      <option value="deduction">{t('salary.componentType.deduction')}</option>
                    </NativeSelect>
                  </Field>

                  <Field className="flex-1" label={t('salary.form.componentName')}>
                    <Input
                      value={component.name}
                      maxLength={50}
                      onChange={event => setComponent(index, { name: event.target.value })}
                    />
                  </Field>

                  <Field className="w-40" label={t('salary.form.calcType')}>
                    <NativeSelect
                      value={component.calcType}
                      onChange={event =>
                        setComponent(index, { calcType: event.target.value as 'fixed' | 'percent' })
                      }
                    >
                      <option value="fixed">{t('salary.calcType.fixed')}</option>
                      <option value="percent">{t('salary.calcType.percent')}</option>
                    </NativeSelect>
                  </Field>

                  <Field className="w-32" label={t('salary.form.value')}>
                    <Input
                      type="number"
                      step="0.01"
                      value={component.value}
                      onChange={event => setComponent(index, { value: event.target.value })}
                    />
                  </Field>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive"
                    aria-label={t('common.action.delete', { ns: 'translation' })}
                    onClick={() => setComponents(components.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {components.some(component => component.calcType === 'percent') && (
              <p className="mt-2 text-xs text-muted-foreground">{t('salary.form.percentHelp')}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button
            disabled={!form.employeeId || save.isPending}
            onClick={() => {
              if (!form.basicSalary || Number(form.basicSalary) <= 0) {
                setError(t('salary.form.basicRequired'));
                return;
              }
              save.mutate();
            }}
          >
            {t('salary.form.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function blank(): SalaryStructurePayload {
  return {
    employeeId: 0,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    basicSalary: '',
    currency: 'mmk',
    workingDaysPerMonth: 26,
    overtimeRate: '1.5',
    remarks: ''
  };
}
