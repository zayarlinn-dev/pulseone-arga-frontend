import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckboxField } from '@/components/ui/checkbox-field';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { PatientSearchSelect } from '@/components/shared/PatientSearchSelect';
import { useDropdown } from '@/hooks/api/useDropdown';
import { queueService } from '@/services/erpService';
import type { Patient } from '@/types/models';

interface WalkInDialogProps {
  open: boolean;
  serviceCenterId: number | null;
  onClose: () => void;
  onIssued: () => void;
}

/**
 * A token for somebody who never had an appointment — which in most Myanmar
 * outpatient departments is the majority of the morning.
 */
export function WalkInDialog({ open, serviceCenterId, onClose, onIssued }: WalkInDialogProps) {
  const { t } = useTranslation('erp');

  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [priority, setPriority] = useState(false);
  const [openVisit, setOpenVisit] = useState(true);
  const [remarks, setRemarks] = useState('');

  const { data: doctors } = useDropdown(
    '/dropdown/employees',
    { employmentCategory: 'doctor' },
    open
  );

  useEffect(() => {
    if (!open) return;
    setPatient(null);
    setDoctorId('');
    setPriority(false);
    setOpenVisit(true);
    setRemarks('');
  }, [open]);

  const issue = useMutation({
    mutationFn: () =>
      queueService.createWalkIn({
        serviceCenterId: serviceCenterId as number,
        patientId: (patient as Patient).id,
        doctorId: doctorId ? Number(doctorId) : null,
        priority: priority ? 10 : 0,
        remarks: remarks || undefined,
        openVisit
      }),
    onSuccess: token => {
      toast.success(t('queue.walkIn.issued', { token: token.tokenLabel }));
      onIssued();
    },
    onError: (error: Error) => toast.error(error.message || t('queue.toast.failed'))
  });

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('queue.walkIn.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <PatientSearchSelect value={patient} onChange={setPatient} showSummary={false} />

          <Field label={t('queue.walkIn.doctor')}>
            <NativeSelect value={doctorId} onChange={event => setDoctorId(event.target.value)}>
              <option value="">-</option>
              {doctors?.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <CheckboxField
            label={t('queue.walkIn.openVisit')}
            checked={openVisit}
            onChange={event => setOpenVisit(event.target.checked)}
          />

          <CheckboxField
            label={t('queue.walkIn.priority')}
            checked={priority}
            onChange={event => setPriority(event.target.checked)}
          />

          <Field label={t('queue.walkIn.remarks')}>
            <Textarea rows={2} value={remarks} onChange={event => setRemarks(event.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={issue.isPending}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button
            onClick={() => issue.mutate()}
            disabled={!patient || !serviceCenterId || issue.isPending}
          >
            {t('queue.walkIn.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
