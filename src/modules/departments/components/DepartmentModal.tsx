import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
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
import type { Department } from '@/types/models';

// Field lengths mirror the database columns, so the form rejects what the
// backend would reject anyway — without a round trip. Built per render rather
// than once at import, so the messages follow the active language.
const buildSchema = (t: TFunction) => {
  const v = fieldRules(t);
  const code = t('common.label.code');
  const name = t('common.label.name');

  return z.object({
    departmentCode: z.string().min(1, v.required(code)).max(20, v.max(code, 20)),
    departmentName: z.string().min(1, v.required(name)).max(50, v.max(name, 50)),
    departmentType: z.enum(['clinical', 'non-clinical']),
    description: z.string().max(65535).optional().nullable()
  });
};

export type DepartmentFormValues = z.infer<ReturnType<typeof buildSchema>>;

interface DepartmentModalProps {
  open: boolean;
  department: Department | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: DepartmentFormValues) => Promise<void>;
}

export function DepartmentModal({
  open,
  department,
  submitting,
  onClose,
  onSubmit
}: DepartmentModalProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      departmentCode: '',
      departmentName: '',
      departmentType: 'clinical',
      description: ''
    }
  });

  // Re-seed the form whenever the dialog opens, so switching from "edit A" to
  // "new" does not leave A's values behind.
  useEffect(() => {
    if (!open) return;

    reset({
      departmentCode: department?.departmentCode ?? '',
      departmentName: department?.departmentName ?? '',
      departmentType: department?.departmentType ?? 'clinical',
      description: department?.description ?? ''
    });
  }, [open, department, reset]);

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(department ? 'departments.modal.editTitle' : 'departments.modal.newTitle')}
          </DialogTitle>
          <DialogDescription>
            {t(
              department
                ? 'departments.modal.editDescription'
                : 'departments.modal.newDescription'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="departmentCode">{t('common.label.code')}</Label>
            <Input id="departmentCode" {...register('departmentCode')} />
            {errors.departmentCode && (
              <p className="text-xs text-destructive">{errors.departmentCode.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="departmentName">{t('common.label.name')}</Label>
            <Input id="departmentName" {...register('departmentName')} />
            {errors.departmentName && (
              <p className="text-xs text-destructive">{errors.departmentName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="departmentType">{t('common.label.type')}</Label>
            <NativeSelect id="departmentType" {...register('departmentType')}>
              <option value="clinical">{t('departments.type.clinical')}</option>
              <option value="non-clinical">{t('departments.type.non-clinical')}</option>
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">{t('common.label.description')}</Label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(department ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
