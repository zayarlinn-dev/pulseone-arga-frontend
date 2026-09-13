import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FileCheck2, FilePenLine, Lock, Save } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { PatientSearchSelect } from '@/components/shared/PatientSearchSelect';
import { useDropdown } from '@/hooks/api/useDropdown';
import { encounterService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import type { EncounterPayload } from '@/services/erpService';
import type { EncounterType } from '@/types/erp';
import type { Patient } from '@/types/models';
import { AmendDialog } from '../components/AmendDialog';
import { DiagnosisPanel } from '../components/DiagnosisPanel';
import { EncounterStatusBadge } from './EncounterListPage';

/**
 * Writing a consultation.
 *
 * The form is prose in five boxes rather than a coded questionnaire, because
 * that is what a clinician actually writes and a structured form nobody fills
 * in is worse than free text that gets read.
 *
 * Finalising is the moment the note stops being editable. Everything on this
 * screen reflects that: the fields lock, the save button disappears, and the
 * only remaining action is to amend.
 */
export default function EncounterFormPage() {
  const { t } = useTranslation('erp');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const can = useAuthStore(state => state.can);

  const isNew = !id || id === 'new';

  const [patient, setPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState<EncounterPayload>(() => blank());
  const [amendOpen, setAmendOpen] = useState(false);

  const { data: doctors } = useDropdown('/dropdown/employees', { employmentCategory: 'doctor' });
  const { data: serviceCenters } = useDropdown('/dropdown/service-centers');

  const { data: encounter, isLoading } = useQuery({
    queryKey: ['encounter', id],
    queryFn: () => encounterService.getById(id as string),
    enabled: !isNew
  });

  useEffect(() => {
    if (!encounter) return;

    setForm({
      patientId: encounter.patientId,
      doctorId: encounter.doctorId,
      visitId: encounter.visitId,
      serviceCenterId: encounter.serviceCenterId,
      encounterType: encounter.encounterType,
      chiefComplaint: encounter.chiefComplaint ?? '',
      historyOfIllness: encounter.historyOfIllness ?? '',
      examination: encounter.examination ?? '',
      assessment: encounter.assessment ?? '',
      treatmentPlan: encounter.treatmentPlan ?? '',
      advice: encounter.advice ?? '',
      followUpDate: encounter.followUpDate ?? null
    });
    if (encounter.patient) setPatient(encounter.patient);
  }, [encounter]);

  const isReadOnly = Boolean(encounter && encounter.status !== 'draft');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['encounters'] });
    queryClient.invalidateQueries({ queryKey: ['encounter', id] });
    queryClient.invalidateQueries({ queryKey: ['patient-chart'] });
  };

  const save = useMutation({
    mutationFn: () =>
      isNew
        ? encounterService.create({ ...form, patientId: (patient as Patient).id })
        : encounterService.update(id as string, form),
    onSuccess: saved => {
      invalidate();
      toast.success(t('encounters.form.saved'));
      if (isNew) navigate(`/clinical/encounters/${saved.id}`, { replace: true });
    },
    onError: (error: Error) => toast.error(error.message || t('encounters.form.saveFailed'))
  });

  const finalise = useMutation({
    mutationFn: () => encounterService.finalise(Number(id)),
    onSuccess: () => {
      invalidate();
      toast.success(t('encounters.finalise.done'));
    },
    onError: (error: Error) => toast.error(error.message || t('encounters.finalise.failed'))
  });

  if (!isNew && isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">...</p>;
  }

  return (
    <>
      <PageHeader
        title={
          isNew
            ? t('encounters.form.newTitle')
            : `${t('encounters.form.title')} ${encounter?.encounterNo ?? ''}`
        }
        actions={
          <div className="flex items-center gap-2">
            {encounter && <EncounterStatusBadge status={encounter.status} />}

            {!isReadOnly && (
              <Button
                onClick={() => save.mutate()}
                disabled={!patient || !form.doctorId || save.isPending}
              >
                <Save className="h-4 w-4" />
                {t('encounters.form.save')}
              </Button>
            )}

            {encounter?.status === 'draft' && can('finalise-encounter') && (
              <Button variant="outline" onClick={() => finalise.mutate()} disabled={finalise.isPending}>
                <FileCheck2 className="h-4 w-4" />
                {t('encounters.finalise.action')}
              </Button>
            )}

            {isReadOnly && can('create-encounter') && (
              <Button variant="outline" onClick={() => setAmendOpen(true)}>
                <FilePenLine className="h-4 w-4" />
                {t('encounters.amend.action')}
              </Button>
            )}
          </div>
        }
      />

      {encounter?.status === 'finalised' && (
        <Notice
          title={t('encounters.finalisedNotice.title')}
          body={t('encounters.finalisedNotice.body')}
        />
      )}
      {encounter?.status === 'amended' && (
        <Notice
          title={t('encounters.amendedNotice.title')}
          body={t('encounters.amendedNotice.body')}
        />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">{t('encounters.form.patient')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isNew ? (
              <PatientSearchSelect value={patient} onChange={setPatient} />
            ) : (
              <div>
                <p className="font-medium">{encounter?.patient?.patientName}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {encounter?.patient?.patientNo}
                </p>
              </div>
            )}

            <Field label={t('encounters.form.doctor')} required>
              <NativeSelect
                disabled={isReadOnly}
                value={form.doctorId ? String(form.doctorId) : ''}
                onChange={event => setForm({ ...form, doctorId: Number(event.target.value) })}
              >
                <option value="">-</option>
                {doctors?.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label={t('encounters.form.type')}>
              <NativeSelect
                disabled={isReadOnly}
                value={form.encounterType ?? 'opd'}
                onChange={event => setForm({ ...form, encounterType: event.target.value })}
              >
                {(['opd', 'ipd', 'emergency', 'follow-up'] as EncounterType[]).map(value => (
                  <option key={value} value={value}>
                    {t(`encounters.type.${value}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label={t('encounters.form.clinic')}>
              <NativeSelect
                disabled={isReadOnly}
                value={form.serviceCenterId ? String(form.serviceCenterId) : ''}
                onChange={event =>
                  setForm({
                    ...form,
                    serviceCenterId: event.target.value ? Number(event.target.value) : null
                  })
                }
              >
                <option value="">-</option>
                {serviceCenters?.map(centre => (
                  <option key={centre.id} value={centre.id}>
                    {centre.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label={t('encounters.form.followUpDate')}>
              <Input
                type="date"
                disabled={isReadOnly}
                value={form.followUpDate ?? ''}
                onChange={event =>
                  setForm({ ...form, followUpDate: event.target.value || null })
                }
              />
            </Field>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 pt-6">
            <NoteField
              label={t('encounters.form.chiefComplaint')}
              value={form.chiefComplaint ?? ''}
              rows={2}
              disabled={isReadOnly}
              onChange={value => setForm({ ...form, chiefComplaint: value })}
            />
            <NoteField
              label={t('encounters.form.historyOfIllness')}
              value={form.historyOfIllness ?? ''}
              disabled={isReadOnly}
              onChange={value => setForm({ ...form, historyOfIllness: value })}
            />
            <NoteField
              label={t('encounters.form.examination')}
              value={form.examination ?? ''}
              disabled={isReadOnly}
              onChange={value => setForm({ ...form, examination: value })}
            />
            <NoteField
              label={t('encounters.form.assessment')}
              value={form.assessment ?? ''}
              disabled={isReadOnly}
              onChange={value => setForm({ ...form, assessment: value })}
            />
            <NoteField
              label={t('encounters.form.treatmentPlan')}
              value={form.treatmentPlan ?? ''}
              disabled={isReadOnly}
              onChange={value => setForm({ ...form, treatmentPlan: value })}
            />
            <NoteField
              label={t('encounters.form.advice')}
              value={form.advice ?? ''}
              rows={2}
              disabled={isReadOnly}
              onChange={value => setForm({ ...form, advice: value })}
            />
          </CardContent>
        </Card>
      </div>

      {/* Diagnoses hang off a saved encounter, so the panel only appears once
          there is an id for them to attach to. */}
      {!isNew && encounter && (
        <div className="mt-4">
          <DiagnosisPanel
            encounterId={encounter.id}
            patientId={encounter.patientId}
            readOnly={isReadOnly}
          />
        </div>
      )}

      <AmendDialog
        encounter={amendOpen ? (encounter ?? null) : null}
        onClose={() => setAmendOpen(false)}
        onAmended={amendment => {
          setAmendOpen(false);
          invalidate();
          navigate(`/clinical/encounters/${amendment.id}`);
        }}
      />
    </>
  );
}

function NoteField({
  label,
  value,
  rows = 3,
  disabled,
  onChange
}: {
  label: string;
  value: string;
  rows?: number;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <Textarea
        rows={rows}
        disabled={disabled}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </Field>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-4 flex gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function blank(): EncounterPayload {
  return {
    patientId: 0,
    doctorId: 0,
    encounterType: 'opd',
    chiefComplaint: '',
    historyOfIllness: '',
    examination: '',
    assessment: '',
    treatmentPlan: '',
    advice: '',
    followUpDate: null
  };
}
