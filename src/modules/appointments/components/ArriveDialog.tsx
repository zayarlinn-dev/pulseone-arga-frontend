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
import { Textarea } from '@/components/ui/textarea';
import { appointmentService } from '@/services/erpService';
import type { Appointment } from '@/types/erp';

interface ArriveDialogProps {
  appointment: Appointment | null;
  onClose: () => void;
  onArrived: () => void;
}

/**
 * Checking a booked patient in.
 *
 * The one decision here is whether to open a new episode of care. A first
 * attendance for a complaint opens one; a follow-up inside an existing visit
 * does not, and opening a second would split one course of treatment across two
 * records that nothing joins back up.
 */
export function ArriveDialog({ appointment, onClose, onArrived }: ArriveDialogProps) {
  const { t } = useTranslation('erp');

  const [openVisit, setOpenVisit] = useState(true);
  const [priority, setPriority] = useState(false);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (appointment) {
      setOpenVisit(true);
      setPriority(false);
      setRemarks('');
    }
  }, [appointment]);

  const arrive = useMutation({
    mutationFn: () =>
      appointmentService.arrive((appointment as Appointment).id, {
        openVisit,
        // Priority is a rank, not a flag, on the wire: the queue orders by it
        // descending, so anything above zero jumps the ordinary tokens.
        priority: priority ? 10 : 0,
        remarks: remarks || undefined
      }),
    onSuccess: token => {
      toast.success(t('appointments.arrive.tokenIssued', { token: token.tokenLabel }));
      onArrived();
    },
    onError: (error: Error) => toast.error(error.message || t('appointments.toast.failed'))
  });

  if (!appointment) return null;

  return (
    <Dialog open onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('appointments.arrive.title', {
              name: appointment.patient?.patientName ?? appointment.appointmentNo
            })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <CheckboxField
            label={t('appointments.arrive.openVisit')}
            description={t('appointments.arrive.openVisitHelp')}
            checked={openVisit}
            onChange={event => setOpenVisit(event.target.checked)}
          />

          <CheckboxField
            label={t('appointments.arrive.priority')}
            checked={priority}
            onChange={event => setPriority(event.target.checked)}
          />

          <Field label={t('appointments.book.remarks')}>
            <Textarea rows={2} value={remarks} onChange={event => setRemarks(event.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={arrive.isPending}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button onClick={() => arrive.mutate()} disabled={arrive.isPending}>
            {t('appointments.action.arrive')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
