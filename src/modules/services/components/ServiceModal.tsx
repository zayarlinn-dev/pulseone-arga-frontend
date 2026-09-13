import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
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
import { useDropdown } from '@/hooks/api/useDropdown';
import { useEntityOptions } from '@/hooks/api/useEntityOptions';
import { fieldRules } from '@/i18n/validation';
import type { TFunction } from 'i18next';
import type { Service } from '@/types/models';

const buildSchema = (t: TFunction) => {
  const v = fieldRules(t);
  const code = t('common.label.code');
  const name = t('common.label.name');

  return z.object({
    serviceCode: z.string().min(1, v.required(code)).max(20, v.max(code, 20)),
    serviceName: z.string().min(1, v.required(name)).max(50, v.max(name, 50)),
    serviceCategoryId: z.string().min(1, t('services.validation.categoryRequired')),
    serviceCenterId: z.string().optional(),
    // The column is decimal(19,2); the value stays a string all the way to the
    // API so no rounding happens in JavaScript's binary floats on the way.
    servicePrice: z
      .string()
      .min(1, t('services.validation.priceRequired'))
      .regex(/^\d+(\.\d{1,2})?$/, t('services.validation.priceFormat')),
    cptDescription: z.string().max(65535).optional(),
    specialInstruction: z.string().max(65535).optional(),
    isActive: z.boolean()
  });
};

type ServiceFormValues = z.infer<ReturnType<typeof buildSchema>>;

export interface ServicePayload {
  serviceCode: string;
  serviceName: string;
  serviceCategoryId: number;
  serviceCenterId: number | null;
  servicePrice: string;
  cptDescription: string | null;
  specialInstruction: string | null;
  isActive: boolean;
}

interface ServiceModalProps {
  open: boolean;
  service: Service | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: ServicePayload) => Promise<void>;
}

export function ServiceModal({ open, service, submitting, onClose, onSubmit }: ServiceModalProps) {
  const { data: serviceCenters = [], isLoading: loadingCenters } =
    useDropdown('/dropdown/service-centers');
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const categories = useEntityOptions('Service Category');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceCode: '',
      serviceName: '',
      serviceCategoryId: '',
      serviceCenterId: '',
      servicePrice: '0',
      cptDescription: '',
      specialInstruction: '',
      isActive: true
    }
  });

  useEffect(() => {
    if (!open) return;

    reset({
      serviceCode: service?.serviceCode ?? '',
      serviceName: service?.serviceName ?? '',
      serviceCategoryId: service?.serviceCategoryId ? String(service.serviceCategoryId) : '',
      serviceCenterId: service?.serviceCenterId ? String(service.serviceCenterId) : '',
      servicePrice: service?.servicePrice ?? '0',
      cptDescription: service?.cptDescription ?? '',
      specialInstruction: service?.specialInstruction ?? '',
      isActive: service?.isActive ?? true
    });
  }, [open, service, reset]);

  const submit = handleSubmit(values =>
    onSubmit({
      serviceCode: values.serviceCode,
      serviceName: values.serviceName,
      serviceCategoryId: Number(values.serviceCategoryId),
      serviceCenterId: values.serviceCenterId ? Number(values.serviceCenterId) : null,
      servicePrice: values.servicePrice,
      cptDescription: values.cptDescription?.trim() || null,
      specialInstruction: values.specialInstruction?.trim() || null,
      isActive: values.isActive
    })
  );

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(service ? 'services.modal.editTitle' : 'services.modal.newTitle')}
          </DialogTitle>
          <DialogDescription>
            {t(service ? 'services.modal.editDescription' : 'services.modal.newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('common.label.code')} htmlFor="serviceCode" required error={errors.serviceCode?.message}>
              <Input id="serviceCode" {...register('serviceCode')} />
            </Field>

            <Field label={t('common.label.name')} htmlFor="serviceName" required error={errors.serviceName?.message}>
              <Input id="serviceName" {...register('serviceName')} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('common.label.category')}
              htmlFor="serviceCategoryId"
              required
              error={errors.serviceCategoryId?.message}
              hint={
                categories.categoryMissing
                  ? t('services.form.noCategory')
                  : undefined
              }
            >
              <NativeSelect
                id="serviceCategoryId"
                disabled={categories.isLoading || categories.categoryMissing}
                {...register('serviceCategoryId')}
              >
                <option value="">
                {categories.isLoading
                  ? t('common.label.loading')
                  : t('services.form.selectCategory')}
              </option>
                {categories.options.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              label={t('services.form.price')}
              htmlFor="servicePrice"
              required
              error={errors.servicePrice?.message}
            >
              <MoneyInput
                id="servicePrice"
                {...register('servicePrice')}
              />
            </Field>
          </div>

          <Field
            label={t('services.column.serviceCenter')}
            htmlFor="serviceCenterId"
            error={errors.serviceCenterId?.message}
            hint={t('services.form.serviceCenterHint')}
          >
            <NativeSelect
              id="serviceCenterId"
              disabled={loadingCenters}
              {...register('serviceCenterId')}
            >
              <option value="">
                {loadingCenters ? t('common.label.loading') : t('common.label.notSet')}
              </option>
              {serviceCenters.map(center => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field
            label={t('services.form.cptDescription')}
            htmlFor="cptDescription"
            error={errors.cptDescription?.message}
          >
            <Textarea id="cptDescription" rows={2} {...register('cptDescription')} />
          </Field>

          <Field
            label={t('services.form.specialInstruction')}
            htmlFor="specialInstruction"
            error={errors.specialInstruction?.message}
          >
            <Textarea id="specialInstruction" rows={2} {...register('specialInstruction')} />
          </Field>

          <CheckboxField id="serviceIsActive" label={t('common.status.active')} {...register('isActive')} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(service ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
