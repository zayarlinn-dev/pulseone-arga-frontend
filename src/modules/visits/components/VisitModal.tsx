import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { PatientSearchSelect } from '@/components/shared/PatientSearchSelect';
import type { VisitCreatePayload } from '@/services';
import type { Patient, VisitType } from '@/types/models';

const VISIT_TYPES: VisitType[] = ['OP', 'ER', 'IP'];

interface VisitModalProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: VisitCreatePayload) => Promise<void>;
}

/**
 * Opens a new visit for a patient.
 *
 * There is no edit counterpart: a visit is closed by opening the next one, and
 * the visit code is allocated by the backend.
 */
export function VisitModal({ open, submitting, onClose, onSubmit }: VisitModalProps) {
  const { t } = useTranslation();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visitType, setVisitType] = useState<VisitType>('OP');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPatient(null);
    setVisitType('OP');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    if (!patient) {
      setError(t('visits.modal.selectPatient'));
      return;
    }
    await onSubmit({ patientId: patient.id, visitType });
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('visits.modal.title')}</DialogTitle>
          <DialogDescription>{t('visits.modal.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label={t('visits.modal.patient')} required error={error ?? undefined}>
            <PatientSearchSelect
              value={patient}
              onChange={selected => {
                setPatient(selected);
                setError(null);
              }}
            />
          </Field>

          <Field
            label={t('visits.modal.visitType')}
            htmlFor="visitType"
            required
            hint={t(`visits.typeHint.${visitType}`)}
          >
            <NativeSelect
              id="visitType"
              value={visitType}
              onChange={event => setVisitType(event.target.value as VisitType)}
            >
              {VISIT_TYPES.map(type => (
                <option key={type} value={type}>
                  {t(`visits.type.${type}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('visits.modal.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
