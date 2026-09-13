import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
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
import type { Store } from '@/types/models';

// Field lengths mirror the database columns, so the form rejects what the
// backend would reject anyway — without a round trip.
const buildSchema = (t: TFunction) => {
  const v = fieldRules(t);
  const code = t('common.label.code');
  const name = t('common.label.name');

  return z.object({
    storeCode: z.string().min(1, v.required(code)).max(20, v.max(code, 20)),
    storeName: z.string().min(1, v.required(name)).max(50, v.max(name, 50)),
    storeType: z.enum(['medical', 'general']),
    storeDescription: z.string().max(65535).optional(),
    isActive: z.boolean(),
    isDefaultStore: z.boolean(),
    isMainStore: z.boolean()
  });
};

type StoreFormValues = z.infer<ReturnType<typeof buildSchema>>;

/** What the API is sent — the update endpoint validates the required fields. */
export type StorePayload = Omit<StoreFormValues, 'storeDescription'> & {
  storeDescription: string | null;
};

interface StoreModalProps {
  open: boolean;
  store: Store | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: StorePayload) => Promise<void>;
}

export function StoreModal({ open, store, submitting, onClose, onSubmit }: StoreModalProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<StoreFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeCode: '',
      storeName: '',
      storeType: 'medical',
      storeDescription: '',
      isActive: true,
      isDefaultStore: false,
      isMainStore: false
    }
  });

  // Re-seed the form whenever the dialog opens, so switching from "edit A" to
  // "new" does not leave A's values behind.
  useEffect(() => {
    if (!open) return;

    reset({
      storeCode: store?.storeCode ?? '',
      storeName: store?.storeName ?? '',
      storeType: store?.storeType ?? 'medical',
      storeDescription: store?.storeDescription ?? '',
      isActive: store?.isActive ?? true,
      isDefaultStore: store?.isDefaultStore ?? false,
      isMainStore: store?.isMainStore ?? false
    });
  }, [open, store, reset]);

  const submit = handleSubmit(values =>
    onSubmit({ ...values, storeDescription: values.storeDescription?.trim() || null })
  );

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(store ? 'stores.modal.editTitle' : 'stores.modal.newTitle')}</DialogTitle>
          <DialogDescription>
            {t(store ? 'stores.modal.editDescription' : 'stores.modal.newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('common.label.code')}
              htmlFor="storeCode"
              required
              error={errors.storeCode?.message}
            >
              <Input id="storeCode" {...register('storeCode')} />
            </Field>

            <Field
              label={t('common.label.name')}
              htmlFor="storeName"
              required
              error={errors.storeName?.message}
            >
              <Input id="storeName" {...register('storeName')} />
            </Field>
          </div>

          <Field
            label={t('common.label.type')}
            htmlFor="storeType"
            required
            error={errors.storeType?.message}
          >
            <NativeSelect id="storeType" {...register('storeType')}>
              <option value="medical">{t('stores.type.medical')}</option>
              <option value="general">{t('stores.type.general')}</option>
            </NativeSelect>
          </Field>

          <Field
            label={t('common.label.description')}
            htmlFor="storeDescription"
            error={errors.storeDescription?.message}
          >
            <Textarea id="storeDescription" {...register('storeDescription')} />
          </Field>

          <div className="space-y-2">
            <CheckboxField
              id="isActive"
              label={t('common.status.active')}
              {...register('isActive')}
            />
            <CheckboxField
              id="isMainStore"
              label={t('stores.form.mainStore')}
              description={t('stores.form.mainStoreHint')}
              {...register('isMainStore')}
            />
            <CheckboxField
              id="isDefaultStore"
              label={t('stores.form.defaultStore')}
              description={t('stores.form.defaultStoreHint')}
              {...register('isDefaultStore')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(store ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
