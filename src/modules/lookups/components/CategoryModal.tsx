import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { fieldRules } from '@/i18n/validation';
import type { TFunction } from 'i18next';
import type { Category } from '@/types/models';

// 30 characters is the column width; the form rejects what the database would.
const buildSchema = (t: TFunction) => {
  const v = fieldRules(t);
  const name = t('common.label.name');

  return z.object({
    categoryName: z.string().min(1, v.required(name)).max(30, v.max(name, 30))
  });
};

export type CategoryFormValues = z.infer<ReturnType<typeof buildSchema>>;

interface CategoryModalProps {
  open: boolean;
  category: Category | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}

export function CategoryModal({
  open,
  category,
  submitting,
  onClose,
  onSubmit
}: CategoryModalProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { categoryName: '' }
  });

  useEffect(() => {
    if (!open) return;
    reset({ categoryName: category?.categoryName ?? '' });
  }, [open, category, reset]);

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(category ? 'lookups.categoryModal.editTitle' : 'lookups.categoryModal.newTitle')}
          </DialogTitle>
          <DialogDescription>
            {category
              ? t('lookups.categoryModal.editDescription')
              : 'A named list of options — "Vendor Type", "UOM", "Admission Type". Screens look these up by name.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label={t('common.label.name')} htmlFor="categoryName" required error={errors.categoryName?.message}>
            <Input id="categoryName" autoFocus {...register('categoryName')} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(category ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
