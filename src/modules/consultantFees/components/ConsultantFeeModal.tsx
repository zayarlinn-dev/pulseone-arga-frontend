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
import type { TFunction } from 'i18next';
import type { ConsultantServiceFee } from '@/types/models';

const buildSchema = (t: TFunction) =>
  z
    .object({
      employeeId: z.string().min(1, t('consultantFees.validation.consultantRequired')),
      serviceId: z.string().min(1, t('consultantFees.validation.serviceRequired')),
      feeType: z.enum(['percentage', 'fixed']),
      feeValue: z
        .string()
        .min(1, t('consultantFees.validation.valueRequired'))
        .regex(/^\d+(\.\d{1,2})?$/, t('consultantFees.validation.valueFormat')),
      isActive: z.boolean()
    })
    .superRefine((values, ctx) => {
      // A percentage over 100 would pay the consultant more than the line billed.
      if (values.feeType === 'percentage' && Number(values.feeValue) > 100) {
        ctx.addIssue({
          code: 'custom',
          path: ['feeValue'],
          message: t('consultantFees.validation.percentageMax')
        });
      }
    });

type FeeFormValues = z.infer<ReturnType<typeof buildSchema>>;

export interface ConsultantFeePayload {
  employeeId: number;
  serviceId: number;
  feeType: 'percentage' | 'fixed';
  feeValue: string;
  isActive: boolean;
}

interface ConsultantFeeModalProps {
  open: boolean;
  fee: ConsultantServiceFee | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: ConsultantFeePayload) => Promise<void>;
}

export function ConsultantFeeModal({
  open,
  fee,
  submitting,
  onClose,
  onSubmit
}: ConsultantFeeModalProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const { data: doctors = [], isLoading: loadingDoctors } = useDropdown(
    '/dropdown/employees',
    { employmentCategory: 'doctor' },
    open
  );
  const { data: services = [], isLoading: loadingServices } = useDropdown(
    '/dropdown/services',
    {},
    open
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<FeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: '',
      serviceId: '',
      feeType: 'percentage',
      feeValue: '',
      isActive: true
    }
  });

  const feeType = watch('feeType');

  useEffect(() => {
    if (!open) return;

    reset({
      employeeId: fee?.employeeId ? String(fee.employeeId) : '',
      serviceId: fee?.serviceId ? String(fee.serviceId) : '',
      feeType: fee?.feeType ?? 'percentage',
      feeValue: fee?.feeValue ?? '',
      isActive: fee?.isActive ?? true
    });
  }, [open, fee, reset]);

  const submit = handleSubmit(values =>
    onSubmit({
      employeeId: Number(values.employeeId),
      serviceId: Number(values.serviceId),
      feeType: values.feeType,
      feeValue: values.feeValue,
      isActive: values.isActive
    })
  );

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(fee ? 'consultantFees.modal.editTitle' : 'consultantFees.modal.newTitle')}
          </DialogTitle>
          <DialogDescription>{t('consultantFees.modal.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field
            label={t('consultantFees.modal.consultant')}
            htmlFor="employeeId"
            required
            error={errors.employeeId?.message}
          >
            <NativeSelect id="employeeId" disabled={loadingDoctors} {...register('employeeId')}>
              <option value="">
                {loadingDoctors
                  ? t('common.label.loading')
                  : t('consultantFees.modal.selectConsultant')}
              </option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field
            label={t('consultantFees.modal.service')}
            htmlFor="serviceId"
            required
            error={errors.serviceId?.message}
          >
            <NativeSelect id="serviceId" disabled={loadingServices} {...register('serviceId')}>
              <option value="">
                {loadingServices
                  ? t('common.label.loading')
                  : t('consultantFees.modal.selectService')}
              </option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('consultantFees.modal.feeType')}
              htmlFor="feeType"
              required
              error={errors.feeType?.message}
            >
              <NativeSelect id="feeType" {...register('feeType')}>
                <option value="percentage">{t('consultantFees.modal.percentage')}</option>
                <option value="fixed">{t('consultantFees.modal.fixed')}</option>
              </NativeSelect>
            </Field>

            <Field
              label={t(
                feeType === 'percentage'
                  ? 'consultantFees.modal.percentageLabel'
                  : 'consultantFees.modal.amountLabel'
              )}
              htmlFor="feeValue"
              required
              error={errors.feeValue?.message}
              hint={
                feeType === 'percentage'
                  ? t('consultantFees.modal.percentageHint')
                  : t('consultantFees.modal.fixedHint')
              }
            >
              {/*
                One field, two meanings: a percentage of the billed line, or a
                fixed amount of money. Only the second is currency, so only the
                second says so — a "Ks" beside a 30 that means 30% would be
                worse than no unit at all.
              */}
              {feeType === 'percentage' ? (
                <Input
                  id="feeValue"
                  inputMode="decimal"
                  className="tabular-nums"
                  {...register('feeValue')}
                />
              ) : (
                <MoneyInput id="feeValue" {...register('feeValue')} />
              )}
            </Field>
          </div>

          <CheckboxField
            id="feeIsActive"
            label={t('common.status.active')}
            description={t('consultantFees.modal.activeHint')}
            {...register('isActive')}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(fee ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
