import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronDown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { patientService } from '@/services';
import { cn, formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import type { PatientSummary, PatientSummaryVisit } from '@/types/models';

interface PatientSummaryCardProps {
  patientId: number;
  className?: string;
}

/**
 * The history panel the desk sees once a patient is picked.
 *
 * Registration, billing, dispensing and admission all ask the same two
 * questions about a returning patient — have they been here before, and what
 * was done last time — so the answer is one shared component fed by one
 * request, rather than each screen assembling it from the visit, invoice and
 * admission lists.
 */
export function PatientSummaryCard({ patientId, className }: PatientSummaryCardProps) {
  const [showHistory, setShowHistory] = useState(false);

  const { t } = useTranslation();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['patient-summary', patientId],
    queryFn: () => patientService.summary(patientId)
  });

  if (isPending) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground',
          className
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t('patients.history.loading')}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive',
          className
        )}
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        {error instanceof Error ? error.message : t('patients.history.loadFailed')}
      </div>
    );
  }

  const outstanding = Number(data.outstandingAmount);
  // A patient always has one visit from the moment they are registered, so
  // "first visit" is the register-and-treat-today case, not a missing history.
  const isFirstVisit = data.visitCount <= 1;

  return (
    <div className={cn('overflow-hidden rounded-md border bg-muted/30', className)}>
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('patients.history.title')}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          {data.isAdmitted && <Badge variant="info">{t('patients.history.admitted')}</Badge>}
          {isFirstVisit ? (
            <Badge variant="secondary">{t('patients.history.firstVisit')}</Badge>
          ) : (
            <Badge variant="secondary">{t('patients.history.returning')}</Badge>
          )}
          {outstanding > 0 && (
            <Badge variant="warning">
              {t('patients.history.owes', { amount: formatCurrency(outstanding) })}
            </Badge>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 px-3 py-2.5 sm:grid-cols-4">
        <Stat label={t('patients.history.statVisits')} value={String(data.visitCount)} />
        <Stat
          label={t('patients.history.statLastVisit')}
          value={data.lastVisitDate ? formatDate(data.lastVisitDate) : '-'}
          hint={describeGap(data.daysSinceLastVisit, t)}
        />
        <Stat
          label={t('patients.history.statRegistered')}
          value={data.firstVisitDate ? formatDate(data.firstVisitDate) : '-'}
        />
        <Stat
          label={t('patients.history.statBilled')}
          value={formatCurrency(data.totalBilled)}
          hint={
            data.invoiceCount > 0
              ? t('patients.history.invoiceCount', { count: data.invoiceCount })
              : t('patients.history.noInvoices')
          }
        />
      </dl>

      {(outstanding > 0 || data.unbilledLineCount > 0) && (
        <p className="border-t px-3 py-2 text-xs text-warning">
          {outstanding > 0 && (
            <>{t('patients.history.unpaidBalance', { amount: formatCurrency(outstanding) })} </>
          )}
          {data.unbilledLineCount > 0 &&
            t('patients.history.unbilled', { count: data.unbilledLineCount })}
        </p>
      )}

      <div className="border-t px-3 py-2.5">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-xs font-semibold">{t('patients.history.lastTime')}</p>
          {data.lastVisit && (
            <p className="text-xs text-muted-foreground">
              <span className="font-mono">{data.lastVisit.visitCode}</span>
              {data.lastVisit.visitDate ? ` · ${formatDateTime(data.lastVisit.visitDate)}` : ''}
              {data.lastVisit.isActive ? ` · ${t('patients.history.stillOpen')}` : ''}
            </p>
          )}
        </div>

        {data.lastVisitServices.length === 0 && data.lastVisitMedicines.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {t('patients.history.nothingOrdered')}
          </p>
        ) : (
          <div className="mt-1.5 space-y-1.5">
            {data.lastVisitServices.length > 0 && (
              <LineGroup
                title={t('patients.history.services')}
                lines={data.lastVisitServices.map(line => ({
                  key: `${line.serviceName}-${line.orderDate ?? ''}-${line.qty}`,
                  label: line.qty > 1 ? `${line.serviceName} ×${line.qty}` : line.serviceName,
                  detail: line.doctorName ?? undefined
                }))}
              />
            )}
            {data.lastVisitMedicines.length > 0 && (
              <LineGroup
                title={t('patients.history.medicines')}
                lines={data.lastVisitMedicines.map(line => ({
                  key: `${line.itemName}-${line.orderDate ?? ''}-${line.qty}`,
                  label: line.qty > 1 ? `${line.itemName} ×${line.qty}` : line.itemName
                }))}
              />
            )}
          </div>
        )}
      </div>

      {data.lastAdmission && (
        <div className="border-t px-3 py-2.5">
          <p className="text-xs font-semibold">
            {t('patients.history.lastAdmission')}{' '}
            <span className="font-mono font-normal text-muted-foreground">
              {data.lastAdmission.admissionNo}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(data.lastAdmission.checkInDate)}
            {data.lastAdmission.checkOutDate
              ? ` – ${formatDate(data.lastAdmission.checkOutDate)}`
              : ` – ${t('patients.history.ongoing')}`}
            {data.lastAdmission.roomName ? ` · ${data.lastAdmission.roomName}` : ''}
            {data.lastAdmission.doctorName
              ? ` · ${t('patients.history.doctor', { name: data.lastAdmission.doctorName })}`
              : ''}
          </p>
          {(data.lastAdmission.admissionReason ?? data.lastAdmission.dischargeReason) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {data.lastAdmission.admissionReason ?? data.lastAdmission.dischargeReason}
            </p>
          )}
        </div>
      )}

      {data.recentVisits.length > 1 && (
        <div className="border-t">
          <button
            type="button"
            onClick={() => setShowHistory(current => !current)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
            aria-expanded={showHistory}
          >
            <span>
              {t(showHistory ? 'patients.history.hideVisits' : 'patients.history.showVisits', {
                count: data.recentVisits.length
              })}
            </span>
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', showHistory && 'rotate-180')}
            />
          </button>

          {showHistory && (
            <ul className="border-t">
              {data.recentVisits.map(visit => (
                <VisitRow key={visit.id} visit={visit} t={t} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="truncate text-sm font-medium">{value}</dd>
      {hint && <p className="truncate text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface GroupLine {
  key: string;
  label: string;
  detail?: string;
}

function LineGroup({ title, lines }: { title: string; lines: GroupLine[] }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-16 shrink-0 text-muted-foreground">{title}</span>
      <ul className="min-w-0 flex-1 space-y-0.5">
        {lines.map(line => (
          <li key={line.key} className="truncate">
            {line.label}
            {line.detail && <span className="text-muted-foreground"> · {line.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function VisitRow({ visit, t }: { visit: PatientSummaryVisit; t: TFunction }) {
  return (
    <li className="flex items-center justify-between gap-2 border-b px-3 py-1.5 text-xs last:border-b-0">
      <span className="min-w-0 flex-1 truncate">
        <span className="font-mono">{visit.visitCode}</span>
        <span className="text-muted-foreground"> · {formatDate(visit.visitDate)}</span>
        {visit.isActive && (
          <span className="text-muted-foreground"> · {t('patients.history.open')}</span>
        )}
      </span>
      <span className="shrink-0 text-muted-foreground">
        {t('patients.history.items', { count: visit.serviceCount })} ·{' '}
        {formatCurrency(visit.billedAmount)}
      </span>
    </li>
  );
}

/** "3 days ago" for a gap the desk cares about; nothing for today's visit. */
function describeGap(
  days: PatientSummary['daysSinceLastVisit'],
  t: TFunction
): string | undefined {
  if (days == null) return undefined;
  if (days === 0) return t('patients.history.gapToday');
  if (days === 1) return t('patients.history.gapYesterday');
  if (days < 30) return t('patients.history.gapDays', { count: days });
  if (days < 365) return t('patients.history.gapMonths', { count: Math.round(days / 30) });
  const years = Math.round((days / 365) * 10) / 10;
  return t('patients.history.gapYears', { count: years });
}
