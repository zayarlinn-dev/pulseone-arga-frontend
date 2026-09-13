import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateField } from '@/components/ui/date-field';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList } from '@/hooks/api/useResource';
import { useDropdown } from '@/hooks/api/useDropdown';
import { consultantFeeService } from '@/services';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ConsultantEarnings, ConsultantFee } from '@/types/models';

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

/**
 * What consultants have earned, and the invoice lines behind it.
 *
 * The summary is what payroll pays; the detail below is what answers "why is
 * that number what it is". Both read the same frozen snapshots — a rate revised
 * today does not move a figure earned last month.
 */
export default function ConsultantEarningsPage() {
  const { t } = useTranslation();
  const { data: doctors = [] } = useDropdown('/dropdown/employees', {
    employmentCategory: 'doctor'
  });

  const [fromDate, setFromDate] = useState(() => isoDaysAgo(30));
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [employeeId, setEmployeeId] = useState('');

  const filters = useMemo(
    () => ({ fromDate, toDate, ...(employeeId ? { employeeId } : {}) }),
    [fromDate, toDate, employeeId]
  );

  const { data: summary = [], isLoading: loadingSummary } = useQuery({
    queryKey: ['consultant-earnings', filters],
    placeholderData: keepPreviousData,
    queryFn: () => consultantFeeService.getSummary(filters)
  });

  const detail = useResourceList<ConsultantFee>(
    '/consultant-fees',
    'consultant-fees',
    null,
    filters
  );

  const grandTotal = summary.reduce((sum, row) => sum + Number(row.totalFee), 0);

  const summaryColumns: Column<ConsultantEarnings>[] = [
    {
      header: t('consultantEarnings.column.consultant'),
      sortable: false,
      className: 'font-medium',
      render: row => (
        <span className="flex flex-col">
          <span>{row.fullName}</span>
          <span className="font-mono text-xs text-muted-foreground">{row.employeeNo}</span>
        </span>
      )
    },
    {
      hideBelow: 'sm',
      header: t('consultantEarnings.column.services'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => row.services.toLocaleString()
    },
    {
      hideBelow: 'sm',
      header: t('consultantEarnings.column.patients'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => row.patients.toLocaleString()
    },
    {
      header: t('consultantEarnings.column.earned'),
      sortable: false,
      className: 'text-right tabular-nums font-medium',
      render: row => formatCurrency(row.totalFee)
    }
  ];

  const detailColumns: Column<ConsultantFee>[] = [
    {
      header: t('consultantEarnings.column.consultant'),
      sortable: false,
      className: 'font-medium',
      render: row => row.employee?.fullName ?? `#${row.employeeId}`
    },
    {
      header: t('consultantEarnings.column.service'),
      sortable: false,
      render: row => row.service?.serviceName ?? `#${row.serviceId}`
    },
    {
      hideBelow: 'md',
      header: t('consultantEarnings.column.patient'),
      sortable: false,
      render: row => row.patient?.patientName ?? '-'
    },
    {
      hideBelow: 'lg',
      header: t('consultantEarnings.column.invoice'),
      sortable: false,
      className: 'font-mono text-xs',
      render: row => row.invoice?.invoiceNo ?? '-'
    },
    {
      hideBelow: 'lg',
      header: t('consultantEarnings.column.rate'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row =>
        row.feeType === 'percentage' ? `${row.feeValue}%` : formatCurrency(row.feeValue)
    },
    {
      header: t('consultantEarnings.column.earned'),
      sortable: false,
      className: 'text-right tabular-nums font-medium',
      render: row => formatCurrency(row.feeAmount)
    },
    {
      hideBelow: 'md',
      header: t('consultantEarnings.column.billed'),
      sortable: false,
      render: row => formatDate(row.createdAt)
    }
  ];

  return (
    <>
      <PageHeader
        title={t('consultantEarnings.title')}
        description={t('consultantEarnings.description')}
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            {t('common.action.print')}
          </Button>
        }
      />

      {/* One filter row for the summary and the detail below it, so the two
          can never be showing different periods. */}
      <Card className="mb-4 grid gap-4 p-4 sm:grid-cols-3" data-print-hide>
        <Field label={t('common.label.from')} htmlFor="fromDate">
          <DateField
            id="fromDate"
            value={fromDate}
            max={toDate}
            onChange={event => setFromDate(event.target.value)}
          />
        </Field>
        <Field label={t('common.label.to')} htmlFor="toDate">
          <DateField
            id="toDate"
            value={toDate}
            min={fromDate}
            onChange={event => setToDate(event.target.value)}
          />
        </Field>
        <Field label={t('consultantEarnings.column.consultant')} htmlFor="employeeId">
          <NativeSelect
            id="employeeId"
            value={employeeId}
            onChange={event => setEmployeeId(event.target.value)}
          >
            <option value="">{t('consultantEarnings.allConsultants')}</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </Card>

      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {t('consultantEarnings.heading', {
            from: formatDate(fromDate),
            to: formatDate(toDate)
          })}
        </h2>
        <p className="text-sm">
          <span className="text-muted-foreground">
            {t('consultantEarnings.totalPayable')}{' '}
          </span>
          <span className="font-semibold tabular-nums">{formatCurrency(grandTotal)}</span>
        </p>
      </div>

      {loadingSummary ? (
        <div className="flex h-32 items-center justify-center rounded-lg border">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={summaryColumns}
          rows={summary}
          rowKey={row => row.employeeId}
          emptyMessage={t('consultantEarnings.emptySummary')}
        />
      )}

      <h2 className="mb-2 mt-6 text-sm font-semibold">
        {t('consultantEarnings.individualServices')}
      </h2>

      <DataTable
        columns={detailColumns}
        rows={detail.items}
        loading={detail.loading}
        rowKey={row => row.id}
        emptyMessage={t('consultantEarnings.emptyDetail')}
      />

      <div data-print-hide>
        <Pagination
          currentPage={detail.currentPage}
          totalPages={detail.totalPages}
          pageSize={detail.pageSize}
          totalCount={detail.totalCount}
          onPageChange={detail.onPageChange}
          onPageSizeChange={detail.onPageSizeChange}
        />
      </div>
    </>
  );
}
