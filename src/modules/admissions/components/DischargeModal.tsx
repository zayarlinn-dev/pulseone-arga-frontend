import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import type { CheckOutPayload } from '@/services';
import type { CheckIn } from '@/types/models';

function toLocalInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

interface DischargeModalProps {
  admission: CheckIn | null;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (payload: CheckOutPayload) => Promise<void>;
}

/**
 * Discharges an admission.
 *
 * The room does not go straight back to "available" — the backend hands it to
 * housekeeping as "cleaning", matching ward workflow.
 */
export function DischargeModal({
  admission,
  submitting,
  onCancel,
  onConfirm
}: DischargeModalProps) {
  const { t } = useTranslation();
  const [dischargeReason, setDischargeReason] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');

  useEffect(() => {
    if (!admission) return;
    setDischargeReason('');
    setCheckOutDate(toLocalInputValue(new Date()));
  }, [admission]);

  return (
    <Dialog open={!!admission} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admissions.dischargeModal.title')}</DialogTitle>
          <DialogDescription>
            {admission
              ? t('admissions.dischargeModal.description', {
                  name:
                    admission.patient?.patientName ?? t('admissions.dischargeModal.thisPatient'),
                  room: admission.room?.roomName ?? t('admissions.dischargeModal.theirRoom')
                })
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label={t('admissions.dischargeModal.date')} htmlFor="checkOutDate" required>
            <DateField
              id="checkOutDate"
              withTime
              value={checkOutDate}
              onChange={event => setCheckOutDate(event.target.value)}
            />
          </Field>

          <Field label={t('admissions.dischargeModal.reason')} htmlFor="dischargeReason">
            <Input
              id="dischargeReason"
              maxLength={255}
              value={dischargeReason}
              onChange={event => setDischargeReason(event.target.value)}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
          <Button
            onClick={() =>
              void onConfirm({
                dischargeReason: dischargeReason.trim() || null,
                checkOutDate: checkOutDate ? new Date(checkOutDate).toISOString() : undefined
              })
            }
            disabled={submitting || !checkOutDate}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('admissions.discharge')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
