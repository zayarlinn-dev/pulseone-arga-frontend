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
import { useDropdown } from '@/hooks/api/useDropdown';
import { useEntityOptions } from '@/hooks/api/useEntityOptions';
import { fieldRules } from '@/i18n/validation';
import type { TFunction } from 'i18next';
import type { ServiceCenter } from '@/types/models';

const buildSchema = (t: TFunction) => {
  const v = fieldRules(t);
  const code = t('common.label.code');
  const name = t('common.label.name');

  return z.object({
    serviceCenterCode: z.string().min(1, v.required(code)).max(20, v.max(code, 20)),
    serviceCenterName: z.string().min(1, v.required(name)).max(50, v.max(name, 50)),
    departmentId: z.string().min(1, t('serviceCenters.validation.departmentRequired')),
    serviceCenterTypeId: z.string().min(1, t('serviceCenters.validation.typeRequired')),
    priority: z.union([z.enum(['primary', 'emergency']), z.literal('')]),
    serviceCenterLocation: z.string().max(65535).optional(),
    description: z.string().max(65535).optional(),
    isActive: z.boolean()
  });
};

type ServiceCenterFormValues = z.infer<ReturnType<typeof buildSchema>>;

export interface ServiceCenterPayload {
  serviceCenterCode: string;
  serviceCenterName: string;
  departmentId: number;
  serviceCenterTypeId: number;
  priority: 'primary' | 'emergency' | null;
  serviceCenterLocation: string | null;
  description: string | null;
  isActive: boolean;
}

interface ServiceCenterModalProps {
  open: boolean;
  serviceCenter: ServiceCenter | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: ServiceCenterPayload) => Promise<void>;
}

export function ServiceCenterModal({
  open,
  serviceCenter,
  submitting,
  onClose,
  onSubmit
}: ServiceCenterModalProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const { data: departments = [], isLoading: loadingDepartments } =
    useDropdown('/dropdown/departments');
  const centerTypes = useEntityOptions('Service Center Type');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ServiceCenterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceCenterCode: '',
      serviceCenterName: '',
      departmentId: '',
      serviceCenterTypeId: '',
      priority: '',
      serviceCenterLocation: '',
      description: '',
      isActive: true
    }
  });

  useEffect(() => {
    if (!open) return;

    reset({
      serviceCenterCode: serviceCenter?.serviceCenterCode ?? '',
      serviceCenterName: serviceCenter?.serviceCenterName ?? '',
      departmentId: serviceCenter?.departmentId ? String(serviceCenter.departmentId) : '',
      serviceCenterTypeId: serviceCenter?.serviceCenterTypeId
        ? String(serviceCenter.serviceCenterTypeId)
        : '',
      priority: serviceCenter?.priority ?? '',
      serviceCenterLocation: serviceCenter?.serviceCenterLocation ?? '',
      description: serviceCenter?.description ?? '',
      isActive: serviceCenter?.isActive ?? true
    });
  }, [open, serviceCenter, reset]);

  const submit = handleSubmit(values =>
    onSubmit({
      serviceCenterCode: values.serviceCenterCode,
      serviceCenterName: values.serviceCenterName,
      departmentId: Number(values.departmentId),
      serviceCenterTypeId: Number(values.serviceCenterTypeId),
      priority: values.priority === '' ? null : values.priority,
      serviceCenterLocation: values.serviceCenterLocation?.trim() || null,
      description: values.description?.trim() || null,
      isActive: values.isActive
    })
  );

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(serviceCenter ? 'serviceCenters.modal.editTitle' : 'serviceCenters.modal.newTitle')}
          </DialogTitle>
          <DialogDescription>
            {t(
              serviceCenter
                ? 'serviceCenters.modal.editDescription'
                : 'serviceCenters.modal.newDescription'
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('common.label.code')}
              htmlFor="serviceCenterCode"
              required
              error={errors.serviceCenterCode?.message}
            >
              <Input id="serviceCenterCode" {...register('serviceCenterCode')} />
            </Field>

            <Field
              label={t('common.label.name')}
              htmlFor="serviceCenterName"
              required
              error={errors.serviceCenterName?.message}
            >
              <Input id="serviceCenterName" {...register('serviceCenterName')} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('serviceCenters.column.department')}
              htmlFor="departmentId"
              required
              error={errors.departmentId?.message}
            >
              <NativeSelect
                id="departmentId"
                disabled={loadingDepartments}
                {...register('departmentId')}
              >
                <option value="">
                  {loadingDepartments
                    ? t('common.label.loading')
                    : t('serviceCenters.form.selectDepartment')}
                </option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              label={t('common.label.type')}
              htmlFor="serviceCenterTypeId"
              required
              error={errors.serviceCenterTypeId?.message}
              hint={
                centerTypes.categoryMissing
                  ? t('serviceCenters.form.noTypeCategory')
                  : undefined
              }
            >
              <NativeSelect
                id="serviceCenterTypeId"
                disabled={centerTypes.isLoading || centerTypes.categoryMissing}
                {...register('serviceCenterTypeId')}
              >
                <option value="">
                  {centerTypes.isLoading
                    ? t('common.label.loading')
                    : t('serviceCenters.form.selectType')}
                </option>
                {centerTypes.options.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field
            label={t('serviceCenters.column.priority')}
            htmlFor="priority"
            error={errors.priority?.message}
          >
            <NativeSelect id="priority" {...register('priority')}>
              <option value="">{t('common.label.notSet')}</option>
              <option value="primary">{t('serviceCenters.priority.primary')}</option>
              <option value="emergency">{t('serviceCenters.priority.emergency')}</option>
            </NativeSelect>
          </Field>

          <Field
            label={t('serviceCenters.form.location')}
            htmlFor="serviceCenterLocation"
            error={errors.serviceCenterLocation?.message}
          >
            <Textarea id="serviceCenterLocation" rows={2} {...register('serviceCenterLocation')} />
          </Field>

          <Field label={t('common.label.description')} htmlFor="description" error={errors.description?.message}>
            <Textarea id="description" {...register('description')} />
          </Field>

          <CheckboxField id="serviceCenterIsActive" label={t('common.status.active')} {...register('isActive')} />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(serviceCenter ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
