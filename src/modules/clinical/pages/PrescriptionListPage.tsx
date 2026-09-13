import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, Check, Plus, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { useResourceList } from '@/hooks/api/useResource';
import { prescriptionService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { formatDateTime } from '@/lib/utils';
import type { PrescriptionStatus, PrescriptionWithWarnings } from '@/types/erp';

export default function PrescriptionListPage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);
  const queryClient = useQueryClient();

  // The counter's worklist is the default: what still has to be dispensed.
  const [status, setStatus] = useState<string>('active');
  const [detailId, setDetailId] = useState<number | null>(null);

  const list = useResourceList<PrescriptionWithWarnings>(
    '/clinical/prescriptions',
    'prescriptions',
    'prescribedAt',
    status ? { status } : {}
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['prescriptions'] });

  const dispense = useMutation({
    mutationFn: (id: number) => prescriptionService.markDispensed(id),
    onSuccess: () => {
      invalidate();
      toast.success(t('prescriptions.toast.dispensed'));
    },
    onError: (error: Error) => toast.error(error.message || t('prescriptions.toast.failed'))
  });

  const cancel = useMutation({
    mutationFn: (id: number) => prescriptionService.cancel(id),
    onSuccess: () => {
      invalidate();
      toast.success(t('prescriptions.toast.cancelled'));
    },
    onError: (error: Error) => toast.error(error.message || t('prescriptions.toast.failed'))
  });

  const columns: Column<PrescriptionWithWarnings>[] = [
    {
      key: 'prescriptionNo',
      hideBelow: 'md',
      header: t('prescriptions.column.prescriptionNo'),
      className: 'font-mono text-xs'
    },
    {
      key: 'prescribedAt',
      header: t('prescriptions.column.date'),
      className: 'whitespace-nowrap',
      render: row => formatDateTime(row.prescribedAt)
    },
    {
      header: t('prescriptions.column.patient'),
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
      header: t('prescriptions.column.doctor'),
      sortable: false,
      render: row => row.doctor?.fullName ?? '-'
    },
    {
      hideBelow: 'lg',
      header: t('prescriptions.column.items'),
      sortable: false,
      render: row => (
        <span className="text-muted-foreground">
          {(row.items ?? []).map(item => item.itemName).join(', ') || '-'}
        </span>
      )
    },
    {
      key: 'status',
      header: t('prescriptions.column.status'),
      render: row => <PrescriptionStatusBadge status={row.status} />
    },
    {
      header: t('common.label.actions', { ns: 'translation' }),
      sortable: false,
      className: 'w-24 text-right',
      render: row =>
        row.status === 'active' ? (
          <div className="flex justify-end gap-1">
            {can('create-pharmacy-sale') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-success"
                aria-label={t('prescriptions.action.dispense')}
                onClick={event => {
                  event.stopPropagation();
                  dispense.mutate(row.id);
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {can('update-prescription') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                aria-label={t('prescriptions.action.cancel')}
                onClick={event => {
                  event.stopPropagation();
                  cancel.mutate(row.id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : null
    }
  ];

  return (
    <>
      <PageHeader
        title={t('prescriptions.title')}
        description={t('prescriptions.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('prescriptions.searchPlaceholder')}
        actions={
          can('create-prescription') && (
            <Button asChild>
              <Link to="/clinical/prescriptions/new">
                <Plus className="h-4 w-4" />
                {t('common.action.newItem', {
                  ns: 'translation',
                  item: t('prescriptions.entity')
                })}
              </Link>
            </Button>
          )
        }
      />

      <Card className="mb-4">
        <CardContent className="max-w-xs pt-6">
          <Field label={t('prescriptions.column.status')}>
            <NativeSelect value={status} onChange={event => setStatus(event.target.value)}>
              <option value="">{t('audit.filter.allActions')}</option>
              {(['draft', 'active', 'dispensed', 'cancelled'] as PrescriptionStatus[]).map(
                value => (
                  <option key={value} value={value}>
                    {t(`prescriptions.status.${value}`)}
                  </option>
                )
              )}
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
        onRowClick={row => setDetailId(row.id)}
        emptyMessage={t('prescriptions.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <PrescriptionDetailDialog id={detailId} onClose={() => setDetailId(null)} />
    </>
  );
}

export function PrescriptionStatusBadge({ status }: { status: PrescriptionStatus }) {
  const { t } = useTranslation('erp');

  const variant =
    status === 'dispensed'
      ? 'success'
      : status === 'cancelled'
        ? 'destructive'
        : status === 'active'
          ? 'warning'
          : 'secondary';

  return <Badge variant={variant}>{t(`prescriptions.status.${status}`)}</Badge>;
}

/**
 * The script as the dispensing counter reads it.
 *
 * The allergy warnings sit above the medicines rather than beside them: the
 * counter needs to see them before counting anything out, not while scanning a
 * table of dosages.
 */
function PrescriptionDetailDialog({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { t } = useTranslation('erp');

  const { data, isLoading } = useQuery({
    queryKey: ['prescription', id],
    queryFn: () => prescriptionService.getById(id as number),
    enabled: id !== null
  });

  if (id === null) return null;

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {isLoading || !data ? (
          <p className="py-8 text-center text-sm text-muted-foreground">...</p>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {data.prescriptionNo}
                <PrescriptionStatusBadge status={data.status} />
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">{data.patient?.patientName}</p>
                <p className="text-muted-foreground">
                  {data.patient?.patientNo} · {data.doctor?.fullName} ·{' '}
                  {formatDateTime(data.prescribedAt)}
                </p>
              </div>

              {data.allergyWarnings && data.allergyWarnings.length > 0 && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
                  <div className="mb-1.5 flex items-center gap-2 text-sm font-medium text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    {t('prescriptions.warning.title')}
                  </div>
                  <ul className="space-y-1 text-sm">
                    {data.allergyWarnings.map((warning, index) => (
                      <li key={index}>
                        <span className="font-medium">{warning.itemName}</span> —{' '}
                        {t('prescriptions.warning.body', {
                          allergen: warning.allergen,
                          severity: t(`chart.allergies.severity_.${warning.severity}`)
                        })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t('prescriptions.form.itemName')}</th>
                      <th className="px-3 py-2 font-medium">{t('prescriptions.form.dose')}</th>
                      <th className="px-3 py-2 font-medium">{t('prescriptions.form.frequency')}</th>
                      <th className="px-3 py-2 font-medium">
                        {t('prescriptions.form.durationDays')}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {t('prescriptions.form.quantity')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.items ?? []).map(item => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium">{item.itemName}</div>
                          {item.instructions && (
                            <div className="text-xs text-muted-foreground">
                              {item.instructions}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {item.dose ? `${item.dose} ${item.doseUnit ?? ''}`.trim() : '-'}
                        </td>
                        <td className="px-3 py-2">{item.frequency ?? '-'}</td>
                        <td className="px-3 py-2 tabular-nums">{item.durationDays ?? '-'}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.notes && <p className="text-sm text-muted-foreground">{data.notes}</p>}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
