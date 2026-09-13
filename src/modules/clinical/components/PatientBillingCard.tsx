import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { invoiceService, patientService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { INVOICE_STATUS_VARIANT } from '@/modules/invoices/pages/InvoiceListPage';
import type { Invoice } from '@/types/models';

/** How many bills the chart carries before it sends the reader to the full list. */
const BILL_LIMIT = 20;

/**
 * What this patient has been billed, newest first, filterable by visit.
 *
 * The chart is opened with a question in mind — "what did we charge them last
 * time?" — and a visit is the unit that question is asked in, so the filter is
 * applied on the server rather than over whichever page happens to be loaded.
 *
 * Settled and outstanding are two figures rather than one: an unpaid balance is
 * not money that came in, and summing it into the same total would tell the
 * desk the patient has paid more than they have.
 */
export function PatientBillingCard({ patientId }: { patientId: number }) {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);
  const [visitFilter, setVisitFilter] = useState('');

  const { data: visits = [] } = useQuery({
    queryKey: ['patient-visits', patientId],
    queryFn: () => patientService.getVisits(patientId),
    // Without get-visit the request would only come back 403; the card then
    // shows every bill unfiltered, which is the right thing to degrade to.
    enabled: Boolean(patientId) && can('get-visit')
  });

  const { data, isLoading } = useQuery({
    queryKey: ['patient-invoices', patientId, visitFilter],
    queryFn: () =>
      invoiceService.getList({
        patientId,
        limit: BILL_LIMIT,
        sortBy: 'invoiceDate',
        sortOrder: 'desc',
        ...(visitFilter ? { visitId: visitFilter } : {})
      }),
    enabled: Boolean(patientId)
  });

  const invoices = data?.data ?? [];
  const total = data?.total ?? 0;

  const settled = useMemo(
    () =>
      invoices
        .filter(invoice => invoice.invoiceStatus === 'paid')
        .reduce((sum, invoice) => sum + Number(invoice.paidAmount), 0),
    [invoices]
  );

  const outstanding = useMemo(
    () =>
      invoices
        .filter(
          invoice => invoice.invoiceStatus !== 'cancelled' && invoice.invoiceStatus !== 'refunded'
        )
        .reduce(
          (sum, invoice) =>
            sum + Math.max(0, Number(invoice.netAmount) - Number(invoice.paidAmount)),
          0
        ),
    [invoices]
  );

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4" />
          {t('chart.billing.title')}
        </CardTitle>
        {visits.length > 0 && (
          <NativeSelect
            value={visitFilter}
            onChange={event => setVisitFilter(event.target.value)}
            className="h-8 w-auto min-w-44 text-xs"
            aria-label={t('chart.billing.filter.label')}
          >
            <option value="">{t('chart.billing.filter.all')}</option>
            {visits.map(visit => (
              <option key={visit.id} value={visit.id}>
                {visit.visitCode}
                {visit.createdAt ? ` · ${formatDate(visit.createdAt)}` : ''}
              </option>
            ))}
          </NativeSelect>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            {t('common.label.loading', { ns: 'translation' })}
          </p>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {visitFilter ? t('chart.billing.emptyForVisit') : t('chart.billing.empty')}
          </p>
        ) : (
          <>
            <ul className="divide-y">
              {invoices.map(invoice => (
                <InvoiceRow key={invoice.id} invoice={invoice} />
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
              <span className="text-muted-foreground">
                {t('chart.billing.settled')}{' '}
                <span className="font-medium tabular-nums text-foreground">
                  {formatCurrency(settled)}
                </span>
                {outstanding > 0 && (
                  <>
                    {' · '}
                    {t('chart.billing.outstanding')}{' '}
                    <span className="font-medium tabular-nums text-destructive">
                      {formatCurrency(outstanding)}
                    </span>
                  </>
                )}
              </span>
              {total > invoices.length && (
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/billing/invoices?patientId=${patientId}`}>
                    {t('chart.billing.showingOf', { shown: invoices.length, total })}
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const { t } = useTranslation('erp');
  const balance = Number(invoice.netAmount) - Number(invoice.paidAmount);

  return (
    <li className="flex items-start gap-3 py-3 first:pt-0">
      <div className="w-32 shrink-0 text-xs text-muted-foreground">
        {formatDateTime(invoice.invoiceDate)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-medium">{invoice.invoiceNo}</p>
        <p className="text-xs text-muted-foreground">
          {invoice.visit?.visitCode ?? t('chart.billing.noVisit')}
          {' · '}
          {t(`common.paymentMethod.${invoice.paidBy}`, { ns: 'translation' })}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm tabular-nums">{formatCurrency(invoice.netAmount)}</p>
        {balance > 0 && invoice.invoiceStatus !== 'cancelled' && (
          <p className="text-xs text-destructive">
            {t('invoices.owing', { ns: 'translation', amount: formatCurrency(balance) })}
          </p>
        )}
      </div>
      <Badge variant={INVOICE_STATUS_VARIANT[invoice.invoiceStatus] ?? 'secondary'}>
        {t(`invoices.status.${invoice.invoiceStatus}`, { ns: 'translation' })}
      </Badge>
      <Button asChild variant="ghost" size="sm">
        <Link to={`/billing/invoices/${invoice.id}`}>{t('chart.billing.open')}</Link>
      </Button>
    </li>
  );
}
