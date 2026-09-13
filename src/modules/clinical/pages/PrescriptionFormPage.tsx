import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckboxField } from '@/components/ui/checkbox-field';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { PatientSearchSelect } from '@/components/shared/PatientSearchSelect';
import { useDropdown } from '@/hooks/api/useDropdown';
import { prescriptionService, type PrescriptionItemPayload } from '@/services/erpService';
import type { AllergyWarning } from '@/types/erp';
import type { Patient } from '@/types/models';

function blankItem(): PrescriptionItemPayload {
  return {
    itemId: null,
    itemName: '',
    dose: '',
    doseUnit: '',
    frequency: '',
    route: '',
    durationDays: null,
    quantity: 0,
    instructions: '',
    isSubstitutionAllowed: true
  };
}

/**
 * Writing a prescription.
 *
 * A medicine the hospital does not stock can still be written: the item link is
 * optional and the name is not, because the script in the file has to be the
 * script the patient was actually given.
 *
 * Allergy warnings come back with the saved script rather than blocking it. A
 * doctor prescribing something a patient reacted to mildly years ago may be
 * making a considered decision; a system that refuses would be overruling them,
 * and one that stayed quiet would be failing them.
 */
export default function PrescriptionFormPage() {
  const { t } = useTranslation('erp');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const encounterId = searchParams.get('encounterId');

  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<PrescriptionItemPayload[]>([blankItem()]);
  const [warnings, setWarnings] = useState<AllergyWarning[]>([]);
  const [error, setError] = useState('');

  const { data: doctors } = useDropdown('/dropdown/employees', { employmentCategory: 'doctor' });
  const { data: catalogue } = useDropdown('/dropdown/items');

  const save = useMutation({
    mutationFn: () =>
      prescriptionService.create({
        patientId: (patient as Patient).id,
        doctorId: Number(doctorId),
        encounterId: encounterId ? Number(encounterId) : null,
        notes: notes || null,
        items: items
          .filter(item => item.itemName.trim())
          .map(item => ({
            ...item,
            dose: item.dose || null,
            doseUnit: item.doseUnit || null,
            frequency: item.frequency || null,
            route: item.route || null,
            instructions: item.instructions || null
          }))
      }),
    onSuccess: created => {
      toast.success(t('prescriptions.form.saved'));

      if (created.allergyWarnings && created.allergyWarnings.length > 0) {
        // Kept on screen rather than navigated away from: the warning is the
        // thing the prescriber has to see, and a toast that disappears in four
        // seconds is not where it belongs.
        setWarnings(created.allergyWarnings);
        return;
      }
      navigate('/clinical/prescriptions');
    },
    onError: (error: Error) => toast.error(error.message || t('prescriptions.form.saveFailed'))
  });

  const setItem = (index: number, patch: Partial<PrescriptionItemPayload>) => {
    setItems(current => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSubmit = () => {
    if (!items.some(item => item.itemName.trim())) {
      setError(t('prescriptions.form.needsItem'));
      return;
    }
    setError('');
    save.mutate();
  };

  return (
    <>
      <PageHeader title={t('prescriptions.form.title')} />

      {warnings.length > 0 && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 p-4">
          <div className="mb-2 flex items-center gap-2 font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {t('prescriptions.warning.title')}
          </div>
          <ul className="mb-2 space-y-1 text-sm">
            {warnings.map((warning, index) => (
              <li key={index}>
                <span className="font-medium">{warning.itemName}</span> —{' '}
                {t('prescriptions.warning.body', {
                  allergen: warning.allergen,
                  severity: t(`chart.allergies.severity_.${warning.severity}`)
                })}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">{t('prescriptions.warning.note')}</p>
          <Button className="mt-3" size="sm" onClick={() => navigate('/clinical/prescriptions')}>
            {t('common.action.close', { ns: 'translation' })}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">{t('prescriptions.form.patient')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PatientSearchSelect value={patient} onChange={setPatient} />

            <Field label={t('prescriptions.form.doctor')} required>
              <NativeSelect value={doctorId} onChange={event => setDoctorId(event.target.value)}>
                <option value="">-</option>
                {doctors?.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label={t('prescriptions.form.notes')}>
              <Textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)} />
            </Field>

            <Button
              className="w-full"
              disabled={!patient || !doctorId || save.isPending}
              onClick={handleSubmit}
            >
              {t('prescriptions.form.submit')}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t('prescriptions.form.items')}</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setItems([...items, blankItem()])}
            >
              <Plus className="h-4 w-4" />
              {t('prescriptions.form.addItem')}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="rounded-md border p-3">
                <div className="mb-3 flex items-start gap-2">
                  <div className="flex-1 space-y-3">
                    <Field label={t('prescriptions.form.item')}>
                      <NativeSelect
                        value={item.itemId ? String(item.itemId) : ''}
                        onChange={event => {
                          const picked = catalogue?.find(
                            option => String(option.id) === event.target.value
                          );
                          setItem(index, {
                            itemId: event.target.value ? Number(event.target.value) : null,
                            itemName: picked?.name ?? item.itemName
                          });
                        }}
                      >
                        <option value="">-</option>
                        {catalogue?.map(option => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>

                    <Field
                      label={t('prescriptions.form.itemName')}
                      required
                      hint={t('prescriptions.form.itemNameHelp')}
                    >
                      <Input
                        value={item.itemName}
                        maxLength={100}
                        onChange={event => setItem(index, { itemName: event.target.value })}
                      />
                    </Field>
                  </div>

                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-6 h-8 w-8 text-destructive"
                      aria-label={t('common.action.delete', { ns: 'translation' })}
                      onClick={() => setItems(items.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Field label={t('prescriptions.form.dose')}>
                    <Input
                      value={item.dose ?? ''}
                      maxLength={40}
                      onChange={event => setItem(index, { dose: event.target.value })}
                    />
                  </Field>
                  <Field label={t('prescriptions.form.doseUnit')}>
                    <Input
                      value={item.doseUnit ?? ''}
                      maxLength={20}
                      onChange={event => setItem(index, { doseUnit: event.target.value })}
                    />
                  </Field>
                  <Field label={t('prescriptions.form.frequency')}>
                    <Input
                      value={item.frequency ?? ''}
                      maxLength={40}
                      onChange={event => setItem(index, { frequency: event.target.value })}
                    />
                  </Field>
                  <Field label={t('prescriptions.form.route')}>
                    <Input
                      value={item.route ?? ''}
                      maxLength={30}
                      onChange={event => setItem(index, { route: event.target.value })}
                    />
                  </Field>
                  <Field label={t('prescriptions.form.durationDays')}>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={item.durationDays ?? ''}
                      onChange={event =>
                        setItem(index, {
                          durationDays: event.target.value ? Number(event.target.value) : null
                        })
                      }
                    />
                  </Field>
                  <Field label={t('prescriptions.form.quantity')} required>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.quantity}
                      onChange={event =>
                        setItem(index, { quantity: Number(event.target.value) || 0 })
                      }
                    />
                  </Field>
                </div>

                <Field className="mt-3" label={t('prescriptions.form.instructions')}>
                  <Input
                    value={item.instructions ?? ''}
                    maxLength={255}
                    onChange={event => setItem(index, { instructions: event.target.value })}
                  />
                </Field>

                <CheckboxField
                  className="mt-3"
                  label={t('prescriptions.form.substitution')}
                  checked={item.isSubstitutionAllowed ?? true}
                  onChange={event =>
                    setItem(index, { isSubstitutionAllowed: event.target.checked })
                  }
                />
              </div>
            ))}

            {error && <p className="text-xs text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
