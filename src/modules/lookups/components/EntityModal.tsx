import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { CheckboxField } from '@/components/ui/checkbox-field';
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
import type { Entity } from '@/types/models';

const buildSchema = (t: TFunction) => {
  const v = fieldRules(t);
  const name = t('common.label.name');

  return z.object({
    entityName: z.string().min(1, v.required(name)).max(50, v.max(name, 50)),
    sort: z.string().regex(/^\d*$/, t('lookups.entityModal.sortWhole')),
    selected: z.boolean()
  });
};

type EntityFormValues = z.infer<ReturnType<typeof buildSchema>>;

export interface EntityPayload {
  entityName: string;
  sort: number;
  selected: boolean;
  categoryId: number;
}

interface EntityModalProps {
  open: boolean;
  entity: Entity | null;
  /** The list this option belongs to — fixed by which list is open. */
  categoryId: number | null;
  categoryName: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: EntityPayload) => Promise<void>;
}

export function EntityModal({
  open,
  entity,
  categoryId,
  categoryName,
  submitting,
  onClose,
  onSubmit
}: EntityModalProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EntityFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { entityName: '', sort: '0', selected: false }
  });

  useEffect(() => {
    if (!open) return;
    reset({
      entityName: entity?.entityName ?? '',
      sort: entity?.sort != null ? String(entity.sort) : '0',
      selected: entity?.selected ?? false
    });
  }, [open, entity, reset]);

  const submit = handleSubmit(values => {
    if (categoryId == null) return;

    return onSubmit({
      entityName: values.entityName.trim(),
      sort: values.sort === '' ? 0 : Number(values.sort),
      selected: values.selected,
      categoryId
    });
  });

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(entity ? 'lookups.entityModal.editTitle' : 'lookups.entityModal.newTitle')}
          </DialogTitle>
          <DialogDescription>
            An option in <span className="font-medium">{categoryName}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label={t('common.label.name')} htmlFor="entityName" required error={errors.entityName?.message}>
            <Input id="entityName" autoFocus {...register('entityName')} />
          </Field>

          <Field
            label={t('lookups.entityModal.sortOrder')}
            htmlFor="sort"
            error={errors.sort?.message}
            hint={t('lookups.entityModal.sortHint')}
          >
            <Input id="sort" inputMode="numeric" className="tabular-nums" {...register('sort')} />
          </Field>

          <CheckboxField
            id="entitySelected"
            label={t('lookups.entityModal.defaultOption')}
            description={t('lookups.entityModal.defaultHint')}
            {...register('selected')}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(entity ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
