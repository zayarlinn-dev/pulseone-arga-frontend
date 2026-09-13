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

export type DecisionAction = 'approve' | 'reject' | 'cancel' | 'comment';

interface ApprovalDecisionDialogProps {
  action: DecisionAction | null;
  requestNo?: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => Promise<void> | void;
}

/**
 * The remarks box every decision passes through.
 *
 * Remarks are mandatory when the decision goes against the requester and
 * optional when it does not: an approval that needed no explanation should not
 * be blocked on one, and a refusal without a reason is an answer the person who
 * asked cannot act on.
 */
export function ApprovalDecisionDialog({
  action,
  requestNo,
  submitting,
  onClose,
  onConfirm
}: ApprovalDecisionDialogProps) {
  const { t } = useTranslation('erp');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (action) {
      setRemarks('');
      setError('');
    }
  }, [action]);

  if (!action) return null;

  const remarksRequired = action === 'reject' || action === 'comment';

  const handleConfirm = async () => {
    if (remarksRequired && !remarks.trim()) {
      setError(t('approvals.detail.remarksRequired'));
      return;
    }
    await onConfirm(remarks.trim());
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t(`approvals.action.${action}`)}</DialogTitle>
          {requestNo && (
            <DialogDescription>
              {t('approvals.detail.title', { no: requestNo })}
            </DialogDescription>
          )}
        </DialogHeader>

        <Field
          label={t('approvals.detail.remarks')}
          required={remarksRequired}
          error={error || undefined}
        >
          <Textarea
            rows={4}
            value={remarks}
            placeholder={t('approvals.detail.remarksPlaceholder')}
            onChange={event => {
              setRemarks(event.target.value);
              if (error) setError('');
            }}
          />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button
            variant={action === 'reject' || action === 'cancel' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {t(`approvals.action.${action}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
