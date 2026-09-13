import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './dialog';

interface ConfirmDeleteModalProps {
  open: boolean;
  title: string;
  description: string;
  deleting?: boolean;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

/**
 * Confirmation step for destructive actions.
 *
 * The description should say what will be removed and whether the backend may
 * refuse — several resources reject deletion while dependent records exist.
 */
export function ConfirmDeleteModal({
  open,
  title,
  description,
  deleting = false,
  confirmLabel,
  onCancel,
  onConfirm
}: ConfirmDeleteModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={deleting}>
            {t('common.action.cancel')}
          </Button>
          <Button variant="destructive" onClick={() => void onConfirm()} disabled={deleting}>
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel ?? t('common.action.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
