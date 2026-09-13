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
import { useEntityOptions } from '@/hooks/api/useEntityOptions';
import { fieldRules } from '@/i18n/validation';
import type { TFunction } from 'i18next';
import type { Vendor } from '@/types/models';

const CURRENCIES = ['mmk', 'usd', 'sgd', 'baht'] as const;

const buildSchema = (t: TFunction) => {
  const v = fieldRules(t);
  const code = t('common.label.code');
  const name = t('common.label.name');
  const contact = t('vendors.form.contactNo');

  return z.object({
    vendorCode: z.string().min(1, v.required(code)).max(20, v.max(code, 20)),
    vendorName: z.string().min(1, v.required(name)).max(50, v.max(name, 50)),
    // Select values arrive as strings; the ids are converted on submit.
    vendorTypeId: z.string().min(1, t('vendors.validation.typeRequired')),
    vendorCurrency: z.union([z.enum(CURRENCIES), z.literal('')]),
    contactNo: z.string().max(30, v.max(contact, 30)).optional(),
    billingAddress: z.string().max(65535).optional(),
    remarks: z.string().max(65535).optional(),
    isActive: z.boolean()
  });
};

type VendorFormValues = z.infer<ReturnType<typeof buildSchema>>;

export interface VendorPayload {
  vendorCode: string;
  vendorName: string;
  vendorTypeId: number;
  vendorCurrency: (typeof CURRENCIES)[number] | null;
  contactNo: string | null;
  billingAddress: string | null;
  remarks: string | null;
  isActive: boolean;
}

interface VendorModalProps {
  open: boolean;
  vendor: Vendor | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: VendorPayload) => Promise<void>;
}

export function VendorModal({ open, vendor, submitting, onClose, onSubmit }: VendorModalProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const vendorTypes = useEntityOptions('Vendor Type');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<VendorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendorCode: '',
      vendorName: '',
      vendorTypeId: '',
      vendorCurrency: 'mmk',
      contactNo: '',
      billingAddress: '',
      remarks: '',
      isActive: true
    }
  });

  useEffect(() => {
    if (!open) return;

    reset({
      vendorCode: vendor?.vendorCode ?? '',
      vendorName: vendor?.vendorName ?? '',
      vendorTypeId: vendor?.vendorTypeId ? String(vendor.vendorTypeId) : '',
      vendorCurrency: vendor?.vendorCurrency ?? 'mmk',
      contactNo: vendor?.contactNo ?? '',
      billingAddress: vendor?.billingAddress ?? '',
      remarks: vendor?.remarks ?? '',
      isActive: vendor?.isActive ?? true
    });
  }, [open, vendor, reset]);

  const submit = handleSubmit(values =>
    onSubmit({
      vendorCode: values.vendorCode,
      vendorName: values.vendorName,
      vendorTypeId: Number(values.vendorTypeId),
      vendorCurrency: values.vendorCurrency === '' ? null : values.vendorCurrency,
      contactNo: values.contactNo?.trim() || null,
      billingAddress: values.billingAddress?.trim() || null,
      remarks: values.remarks?.trim() || null,
      isActive: values.isActive
    })
  );

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(vendor ? 'vendors.modal.editTitle' : 'vendors.modal.newTitle')}</DialogTitle>
          <DialogDescription>
            {t(vendor ? 'vendors.modal.editDescription' : 'vendors.modal.newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('common.label.code')} htmlFor="vendorCode" required error={errors.vendorCode?.message}>
              <Input id="vendorCode" {...register('vendorCode')} />
            </Field>

            <Field label={t('common.label.name')} htmlFor="vendorName" required error={errors.vendorName?.message}>
              <Input id="vendorName" {...register('vendorName')} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('vendors.form.vendorType')}
              htmlFor="vendorTypeId"
              required
              error={errors.vendorTypeId?.message}
              hint={
                vendorTypes.categoryMissing
                  ? t('vendors.form.noTypeCategory')
                  : undefined
              }
            >
              <NativeSelect
                id="vendorTypeId"
                disabled={vendorTypes.isLoading || vendorTypes.categoryMissing}
                {...register('vendorTypeId')}
              >
                <option value="">
                  {vendorTypes.isLoading ? t('common.label.loading') : t('vendors.form.selectType')}
                </option>
                {vendorTypes.options.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              label={t('vendors.form.currency')}
              htmlFor="vendorCurrency"
              error={errors.vendorCurrency?.message}
            >
              <NativeSelect id="vendorCurrency" {...register('vendorCurrency')}>
                <option value="">{t('common.label.notSet')}</option>
                {CURRENCIES.map(currency => (
                  <option key={currency} value={currency}>
                    {currency.toUpperCase()}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field
            label={t('vendors.form.contactNo')}
            htmlFor="contactNo"
            error={errors.contactNo?.message}
          >
            <Input id="contactNo" {...register('contactNo')} />
          </Field>

          <Field
            label={t('vendors.form.billingAddress')}
            htmlFor="billingAddress"
            error={errors.billingAddress?.message}
          >
            <Textarea id="billingAddress" {...register('billingAddress')} />
          </Field>

          <Field label={t('common.label.remarks')} htmlFor="remarks" error={errors.remarks?.message}>
            <Textarea id="remarks" rows={2} {...register('remarks')} />
          </Field>

          <CheckboxField id="vendorIsActive" label={t('common.status.active')} {...register('isActive')} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(vendor ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
