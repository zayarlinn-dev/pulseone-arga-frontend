import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import type { Appointment } from '@/types/erp';

interface CancelAppointmentDialogProps {
  appointment: Appointment | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/**
 * Cancelling a booking.
 *
 * The reason is required because the slot going back on the list is only half
 * of what happens — the other half is the clinic being able to tell, later, why
 * a morning emptied out.
 */
export function CancelAppointmentDialog({
  appointment,
  submitting,
  onClose,
  onConfirm
}: CancelAppointmentDialogProps) {
  const { t } = useTranslation('erp');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (appointment) {
      setReason('');
      setError('');
    }
  }, [appointment]);

  if (!appointment) return null;

  return (
    <Dialog open onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('appointments.cancel.title')}</DialogTitle>
          <DialogDescription>
            {t('appointments.cancel.body', { no: appointment.appointmentNo })}
          </DialogDescription>
        </DialogHeader>

        <Field label={t('appointments.cancel.reason')} required error={error || undefined}>
          <Textarea
            rows={3}
            value={reason}
            onChange={event => {
              setReason(event.target.value);
              if (error) setError('');
            }}
          />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button
            variant="destructive"
            disabled={submitting}
            onClick={() => {
              if (!reason.trim()) {
                setError(t('appointments.cancel.reasonRequired'));
                return;
              }
              onConfirm(reason.trim());
            }}
          >
            {t('appointments.action.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
