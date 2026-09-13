import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { encounterService } from '@/services/erpService';
import type { ClinicalEncounter } from '@/types/erp';

interface AmendDialogProps {
  encounter: ClinicalEncounter | null;
  onClose: () => void;
  onAmended: (amendment: ClinicalEncounter) => void;
}

/**
 * Opening an amendment.
 *
 * The reason is required and is stored on the new note, so a reader coming to
 * the pair later can see not only that the record was corrected but what the
 * correction was for. Without it an amendment is indistinguishable from a
 * duplicate.
 */
export function AmendDialog({ encounter, onClose, onAmended }: AmendDialogProps) {
  const { t } = useTranslation('erp');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (encounter) {
      setReason('');
      setError('');
    }
  }, [encounter]);

  const amend = useMutation({
    mutationFn: () => encounterService.amend((encounter as ClinicalEncounter).id, reason.trim()),
    onSuccess: amendment => {
      toast.success(t('encounters.amend.done'));
      onAmended(amendment);
    },
    onError: (error: Error) => toast.error(error.message || t('encounters.amend.failed'))
  });

  if (!encounter) return null;

  return (
    <Dialog open onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('encounters.amend.title')}</DialogTitle>
          <DialogDescription>{t('encounters.amend.body')}</DialogDescription>
        </DialogHeader>

        <Field label={t('encounters.amend.reason')} required error={error || undefined}>
          <Textarea
            rows={3}
            value={reason}
            maxLength={255}
            onChange={event => {
              setReason(event.target.value);
              if (error) setError('');
            }}
          />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={amend.isPending}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button
            disabled={amend.isPending}
            onClick={() => {
              if (!reason.trim()) {
                setError(t('encounters.amend.reasonRequired'));
                return;
              }
              amend.mutate();
            }}
          >
            {t('encounters.amend.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
