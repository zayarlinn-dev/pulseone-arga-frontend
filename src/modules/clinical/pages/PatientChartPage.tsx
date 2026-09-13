import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Activity, AlertTriangle, Plus, Stethoscope } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { encounterService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Allergy, VitalSign } from '@/types/erp';
import { AllergyDialog } from '../components/AllergyDialog';
import { PatientBillingCard } from '../components/PatientBillingCard';
import { VitalsDialog } from '../components/VitalsDialog';
import { EncounterStatusBadge } from './EncounterListPage';

/**
 * What a clinician reads before seeing someone.
 *
 * Allergies come first and are ordered by severity, because the severe one is
 * the one that has to be read and a chart that buries it under a tidy
 * chronology has failed at the only job that is safety-critical.
 */
export default function PatientChartPage() {
  const { t } = useTranslation('erp');
  const { id } = useParams<{ id: string }>();
  const can = useAuthStore(state => state.can);

  const [allergyOpen, setAllergyOpen] = useState(false);
  const [vitalsOpen, setVitalsOpen] = useState(false);

  const { data: chart, isLoading, refetch } = useQuery({
    queryKey: ['patient-chart', id],
    queryFn: () => encounterService.getChart(Number(id)),
    enabled: Boolean(id)
  });

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">...</p>;
  }
  if (!chart) {
    return <p className="py-12 text-center text-sm text-destructive">{t('chart.loadFailed')}</p>;
  }

  return (
    <>
      <PageHeader
        title={chart.patient.patientName}
        description={`${chart.patient.patientNo}${
          chart.patient.age ? ` · ${chart.patient.age}` : ''
        } · ${chart.patient.gender}`}
        actions={
          can('create-encounter') && (
            <Button asChild>
              <Link to="/clinical/encounters/new">
                <Stethoscope className="h-4 w-4" />
                {t('common.action.newItem', { ns: 'translation', item: t('encounters.entity') })}
              </Link>
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card className={chart.allergies.length > 0 ? 'border-destructive/40' : undefined}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                {chart.allergies.length > 0 && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                {t('chart.allergies.title')}
              </CardTitle>
              {can('create-allergy') && (
                <Button size="sm" variant="outline" onClick={() => setAllergyOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {chart.allergies.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('chart.allergies.empty')}</p>
              ) : (
                chart.allergies.map(allergy => <AllergyRow key={allergy.id} allergy={allergy} />)
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                {t('chart.vitals.latest')}
              </CardTitle>
              {can('create-vital-sign') && (
                <Button size="sm" variant="outline" onClick={() => setVitalsOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {chart.latestVitals ? (
                <VitalsSummary vitals={chart.latestVitals} />
              ) : (
                <p className="text-sm text-muted-foreground">{t('chart.vitals.empty')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('chart.problems.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {chart.activeProblems.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('chart.problems.empty')}</p>
              ) : (
                <ul className="space-y-1.5">
                  {chart.activeProblems.map(problem => (
                    <li key={problem.id} className="flex items-start gap-2 text-sm">
                      {problem.code && (
                        <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                          {problem.code}
                        </Badge>
                      )}
                      <span>{problem.description}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-muted-foreground">{t('chart.problems.note')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('chart.encounters.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {chart.encounters.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('chart.encounters.empty')}</p>
              ) : (
                <ul className="divide-y">
                  {chart.encounters.map(encounter => (
                    <li key={encounter.id} className="flex items-start gap-3 py-3 first:pt-0">
                      <div className="w-32 shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(encounter.encounterDate)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {encounter.chiefComplaint || encounter.encounterNo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {encounter.doctor?.fullName}
                          {encounter.diagnoses && encounter.diagnoses.length > 0
                            ? ` · ${encounter.diagnoses.map(d => d.description).join(', ')}`
                            : ''}
                        </p>
                      </div>
                      <EncounterStatusBadge status={encounter.status} />
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/clinical/encounters/${encounter.id}`}>
                          {t('chart.encounters.open')}
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('chart.history.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {chart.history.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('chart.history.empty')}</p>
              ) : (
                <ul className="space-y-2">
                  {chart.history.map(entry => (
                    <li key={entry.id} className="flex items-start gap-3 text-sm">
                      <Badge variant="secondary" className="shrink-0">
                        {t(`chart.history.category_.${entry.category}`)}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p>{entry.description}</p>
                        {entry.notedOn && (
                          <p className="text-xs text-muted-foreground">
                            {formatDate(entry.notedOn)}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('chart.vitals.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {chart.recentVitals.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('chart.vitals.empty')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-muted-foreground">
                      <tr>
                        <th className="pb-2 pr-4 font-medium">{t('chart.vitals.recordedAt')}</th>
                        <th className="pb-2 pr-4 font-medium">{t('chart.vitals.temperature')}</th>
                        <th className="pb-2 pr-4 font-medium">{t('chart.vitals.pulse')}</th>
                        <th className="pb-2 pr-4 font-medium">
                          {t('chart.vitals.bloodPressure')}
                        </th>
                        <th className="pb-2 pr-4 font-medium">{t('chart.vitals.spo2')}</th>
                        <th className="pb-2 font-medium">{t('chart.vitals.bmi')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chart.recentVitals.map(vitals => (
                        <tr key={vitals.id} className="border-t">
                          <td className="whitespace-nowrap py-2 pr-4">
                            {formatDateTime(vitals.recordedAt)}
                          </td>
                          <td className="py-2 pr-4 tabular-nums">{vitals.temperatureC ?? '-'}</td>
                          <td className="py-2 pr-4 tabular-nums">{vitals.pulseBpm ?? '-'}</td>
                          <td className="py-2 pr-4 tabular-nums">
                            {vitals.systolicMmHg && vitals.diastolicMmHg
                              ? `${vitals.systolicMmHg}/${vitals.diastolicMmHg}`
                              : '-'}
                          </td>
                          <td className="py-2 pr-4 tabular-nums">{vitals.spO2Percent ?? '-'}</td>
                          <td className="py-2 tabular-nums">{vitals.bmi ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {can('get-invoice') && <PatientBillingCard patientId={Number(id)} />}
        </div>
      </div>

      <AllergyDialog
        open={allergyOpen}
        patientId={Number(id)}
        onClose={() => setAllergyOpen(false)}
        onSaved={() => {
          setAllergyOpen(false);
          void refetch();
        }}
      />

      <VitalsDialog
        open={vitalsOpen}
        patientId={Number(id)}
        onClose={() => setVitalsOpen(false)}
        onSaved={() => {
          setVitalsOpen(false);
          void refetch();
        }}
      />
    </>
  );
}

function AllergyRow({ allergy }: { allergy: Allergy }) {
  const { t } = useTranslation('erp');

  return (
    <div className="rounded-md border px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{allergy.allergen}</span>
        <Badge
          variant={
            allergy.severity === 'severe'
              ? 'destructive'
              : allergy.severity === 'moderate'
                ? 'warning'
                : 'secondary'
          }
        >
          {t(`chart.allergies.severity_.${allergy.severity}`)}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {t(`chart.allergies.type_.${allergy.allergyType}`)}
        {allergy.reaction ? ` · ${allergy.reaction}` : ''}
      </p>
    </div>
  );
}

function VitalsSummary({ vitals }: { vitals: VitalSign }) {
  const { t } = useTranslation('erp');

  const readings: { label: string; value: string | null; unit: string }[] = [
    {
      label: t('chart.vitals.temperature'),
      value: vitals.temperatureC?.toString() ?? null,
      unit: t('chart.vitals.unit.temperature')
    },
    {
      label: t('chart.vitals.pulse'),
      value: vitals.pulseBpm?.toString() ?? null,
      unit: t('chart.vitals.unit.pulse')
    },
    {
      label: t('chart.vitals.bloodPressure'),
      value:
        vitals.systolicMmHg && vitals.diastolicMmHg
          ? `${vitals.systolicMmHg}/${vitals.diastolicMmHg}`
          : null,
      unit: t('chart.vitals.unit.bloodPressure')
    },
    {
      label: t('chart.vitals.spo2'),
      value: vitals.spO2Percent?.toString() ?? null,
      unit: t('chart.vitals.unit.spo2')
    },
    {
      label: t('chart.vitals.weight'),
      value: vitals.weightKg?.toString() ?? null,
      unit: t('chart.vitals.unit.weight')
    },
    { label: t('chart.vitals.bmi'), value: vitals.bmi?.toString() ?? null, unit: '' }
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{formatDateTime(vitals.recordedAt)}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {/* Only the readings that were actually taken: a blank where a nurse
            checked a blood pressure and nothing else is honest, and a zero
            would be a fabricated measurement. */}
        {readings
          .filter(reading => reading.value !== null)
          .map(reading => (
            <div key={reading.label} className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{reading.label}</dt>
              <dd className="font-medium tabular-nums">
                {reading.value}
                {reading.unit && <span className="ml-0.5 text-xs font-normal">{reading.unit}</span>}
              </dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
