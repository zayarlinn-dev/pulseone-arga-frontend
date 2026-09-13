import { useEffect, useMemo, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { DateField } from '@/components/ui/date-field';
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
import { useRequiredFields } from '@/hooks/api/useRequiredFields';
import { GENDERS, MARITAL_STATUSES, NRC_STATE_NUMBERS, NRC_TYPES } from '@/constants/person';
import type { Employee } from '@/types/models';
import {
  EMPLOYMENT_CATEGORIES,
  EMPLOYMENT_STATUSES,
  buildEmployeeSchema,
  EMPTY_EMPLOYEE_FORM,
  toEmployeePayload,
  toFormValues,
  type EmployeeFormValues
} from '../employeeForm';

interface EmployeeModalProps {
  open: boolean;
  employee: Employee | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: Partial<Employee>) => Promise<void>;
}

/** One block of related fields, so the dialog reads as sections not a wall. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 w-full border-b pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function EmployeeModal({
  open,
  employee,
  submitting,
  onClose,
  onSubmit
}: EmployeeModalProps) {
  const { t } = useTranslation();

  // Which fields this hospital insists on. Only five are fixed by the record
  // itself; the rest are a setting, so both the asterisks and the validation
  // come from the server rather than from this file.
  const { required, loading: loadingRules } = useRequiredFields('employee');
  const isRequired = (field: string) => required.has(field);

  const schema = useMemo(() => buildEmployeeSchema(t, required), [t, required]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_EMPLOYEE_FORM
  });

  const values = watch();

  // Re-seed whenever the dialog opens, so switching from "edit A" to "new"
  // does not leave A's values behind.
  useEffect(() => {
    if (!open) return;
    reset(employee ? toFormValues(employee) : EMPTY_EMPLOYEE_FORM);
  }, [open, employee, reset]);

  const { data: departments = [], isLoading: loadingDepartments } =
    useDropdown('/dropdown/departments');
  // Townships and NRC districts are cascades: each stays idle until the field
  // above it has a value to filter by.
  const { data: states = [] } = useDropdown('/dropdown/states');
  const { data: townships = [] } = useDropdown(
    `/dropdown/states/${values.stateId}/townships`,
    {},
    !!values.stateId
  );
  const { data: districts = [] } = useDropdown(
    '/dropdown/districts',
    { stateNumber: values.stateNumber },
    !!values.stateNumber
  );

  const submit = handleSubmit(formValues => onSubmit(toEmployeePayload(formValues)));

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t(employee ? 'employees.modal.editTitle' : 'employees.modal.newTitle')}
          </DialogTitle>
          <DialogDescription>
            {employee
              ? t('employees.modal.editDescription')
              : t('employees.modal.newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6" noValidate>
          <Section title={t('employees.section.employment')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('employees.form.employeeNumber')}
                htmlFor="employeeNo"
                required={isRequired('employeeNo')}
                error={errors.employeeNo?.message}
              >
                <Input id="employeeNo" {...register('employeeNo')} />
              </Field>

              <Field
                label={t('employees.form.department')}
                htmlFor="departmentId"
                required={isRequired('departmentId')}
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
                      : t('employees.form.selectDepartment')}
                  </option>
                  {departments.map(department => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('employees.form.category')}
                htmlFor="employmentCategory"
                required={isRequired('employmentCategory')}
                error={errors.employmentCategory?.message}
                hint={t('employees.form.categoryHint')}
              >
                <NativeSelect id="employmentCategory" {...register('employmentCategory')}>
                  {EMPLOYMENT_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {t(`employees.category.${category}`)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <Field
                label={t('employees.form.employmentStatus')}
                htmlFor="employmentStatus"
                required={isRequired('employmentStatus')}
                error={errors.employmentStatus?.message}
              >
                <NativeSelect id="employmentStatus" {...register('employmentStatus')}>
                  <option value="">{t('common.label.notSet')}</option>
                  {EMPLOYMENT_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {t(`person.employmentStatus.${status}`)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <Field
              label={t('employees.form.qualification')}
              htmlFor="qualification"
              required={isRequired('qualification')}
              error={errors.qualification?.message}
            >
              <Input id="qualification" {...register('qualification')} />
            </Field>

            <CheckboxField
              id="employeeIsActive"
              label={t('common.status.active')}
              description={t('employees.form.activeHint')}
              {...register('isActive')}
            />
          </Section>

          <Section title={t('employees.section.personal')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('employees.form.fullName')}
                htmlFor="fullName"
                required={isRequired('fullName')}
                error={errors.fullName?.message}
              >
                <Input id="fullName" {...register('fullName')} />
              </Field>

              <Field
                label={t('employees.form.shortName')}
                htmlFor="shortName"
                required={isRequired('shortName')}
                error={errors.shortName?.message}
                hint={t('employees.form.shortNameHint')}
              >
                <Input id="shortName" {...register('shortName')} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('employees.form.fatherName')}
                htmlFor="fatherName"
                required={isRequired('fatherName')}
                error={errors.fatherName?.message}
              >
                <Input id="fatherName" {...register('fatherName')} />
              </Field>

              <Field
                label={t('employees.form.gender')}
                htmlFor="gender"
                required={isRequired('gender')}
                error={errors.gender?.message}
              >
                <NativeSelect id="gender" {...register('gender')}>
                  {GENDERS.map(gender => (
                    <option key={gender} value={gender}>
                      {t(`person.gender.${gender}`)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label={t('employees.form.dob')}
                htmlFor="dob"
                required={isRequired('dob')}
                error={errors.dob?.message}
              >
                <DateField id="dob" {...register('dob')} />
              </Field>

              <Field
                label={t('employees.form.age')}
                htmlFor="age"
                required={isRequired('age')}
                error={errors.age?.message}
              >
                <Input id="age" inputMode="numeric" className="tabular-nums" {...register('age')} />
              </Field>

              <Field
                label={t('employees.form.maritalStatus')}
                htmlFor="maritalStatus"
                required={isRequired('maritalStatus')}
                error={errors.maritalStatus?.message}
              >
                <NativeSelect id="maritalStatus" {...register('maritalStatus')}>
                  <option value="">{t('common.label.notSet')}</option>
                  {MARITAL_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {t(`person.maritalStatus.${status}`)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </Section>

          <Section title={t('employees.section.contact')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('employees.form.phoneNo')}
                htmlFor="phoneNo"
                required={isRequired('phoneNo')}
                error={errors.phoneNo?.message}
              >
                <Input id="phoneNo" type="tel" {...register('phoneNo')} />
              </Field>

              <Field
                label={t('common.label.email')}
                htmlFor="email"
                required={isRequired('email')}
                error={errors.email?.message}
              >
                <Input id="email" type="email" {...register('email')} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('employees.form.state')}
                htmlFor="stateId"
                required={isRequired('stateId')}
                error={errors.stateId?.message}
              >
                <NativeSelect
                  id="stateId"
                  {...register('stateId', {
                    // The old township belongs to the old state.
                    onChange: () => setValue('townshipId', '', { shouldDirty: true })
                  })}
                >
                  <option value="">{t('common.label.notSet')}</option>
                  {states.map(state => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <Field
                label={t('employees.form.township')}
                htmlFor="townshipId"
                required={isRequired('townshipId')}
                error={errors.townshipId?.message}
                hint={!values.stateId ? t('employees.form.townshipHint') : undefined}
              >
                <NativeSelect id="townshipId" disabled={!values.stateId} {...register('townshipId')}>
                  <option value="">{t('common.label.notSet')}</option>
                  {townships.map(township => (
                    <option key={township.id} value={township.id}>
                      {township.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <Field
              label={t('common.label.address')}
              htmlFor="address"
              required={isRequired('address')}
              error={errors.address?.message}
            >
              <Textarea id="address" rows={2} {...register('address')} />
            </Field>
          </Section>

          <Section title={t('employees.section.nrc')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('employees.form.stateNumber')}
                htmlFor="stateNumber"
                error={errors.stateNumber?.message}
                hint={t('employees.form.nrcHint')}
              >
                <NativeSelect
                  id="stateNumber"
                  {...register('stateNumber', {
                    // Districts are numbered per state, so the old one no longer
                    // exists once the state number changes.
                    onChange: () => setValue('districtId', '', { shouldDirty: true })
                  })}
                >
                  <option value="">{t('common.label.notSet')}</option>
                  {NRC_STATE_NUMBERS.map(number => (
                    <option key={number} value={number}>
                      {number}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <Field
                label={t('employees.form.district')}
                htmlFor="districtId"
                error={errors.districtId?.message}
                hint={!values.stateNumber ? t('employees.form.districtHint') : undefined}
              >
                <NativeSelect
                  id="districtId"
                  disabled={!values.stateNumber}
                  {...register('districtId')}
                >
                  <option value="">{t('common.label.notSet')}</option>
                  {districts.map(district => (
                    <option key={district.id} value={district.id}>
                      {district.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t('employees.form.nrcType')}
                htmlFor="nrcType"
                error={errors.nrcType?.message}
              >
                <NativeSelect id="nrcType" {...register('nrcType')}>
                  <option value="">{t('common.label.notSet')}</option>
                  {NRC_TYPES.map(type => (
                    <option key={type} value={type}>
                      {t(`person.nrcType.${type}`)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <Field
                label={t('employees.form.nrcNo')}
                htmlFor="nrcNo"
                required={isRequired('nrcNo')}
                error={errors.nrcNo?.message}
              >
                <Input id="nrcNo" {...register('nrcNo')} />
              </Field>
            </div>
          </Section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            {/*
              Saving waits for the rules. Submitting before they arrive would
              skip checks the server is going to apply anyway, and the dialog
              would bounce back with an error it could have shown beside the
              field.
            */}
            <Button type="submit" disabled={submitting || loadingRules}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(employee ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
