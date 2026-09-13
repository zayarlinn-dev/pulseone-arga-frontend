import { z } from 'zod';
import { fieldRules } from '@/i18n/validation';
import { registrationFieldLabel } from '@/constants/registrationFields';
import type { TFunction } from 'i18next';
import type { Employee } from '@/types/models';

/**
 * Shape, validation and API mapping for the employee form.
 *
 * Every control holds a string — that is what `<input>` and `<select>` produce
 * — and the conversion to ids, numbers and nulls happens once in
 * toEmployeePayload, so no field has to remember its own wire format.
 */

export const EMPLOYMENT_CATEGORIES: Employee['employmentCategory'][] = [
  'doctor',
  'nurse',
  'general'
];

export const EMPLOYMENT_STATUSES: NonNullable<Employee['employmentStatus']>[] = [
  'permanent',
  'temporary',
  'internship'
];

/**
 * Built per language rather than once at import: a schema defined at module
 * scope would freeze its messages in whichever language the tab loaded in.
 *
 * `required` is the set of fields this hospital insists on, from
 * `/settings/required-fields`. The five the record cannot exist without are
 * written into the shape below; everything else is a policy the hospital sets,
 * and the server enforces the same set on the way in.
 */
export const buildEmployeeSchema = (t: TFunction, required: ReadonlySet<string> = new Set()) => {
  const v = fieldRules(t);
  const optionalText = (max: number, label: string) =>
    z.string().max(max, v.max(label, max)).optional();

  return z
    .object({
      employeeNo: z
        .string()
        .min(1, t('employees.validation.employeeNoRequired'))
        .max(20, v.max(t('employees.form.employeeNumber'), 20)),
      fullName: z
        .string()
        .min(1, t('employees.validation.fullNameRequired'))
        .max(60, v.max(t('common.label.name'), 60)),
      shortName: optionalText(20, t('employees.form.shortName')),
      fatherName: optionalText(50, t('employees.form.fatherName')),
      employmentCategory: z.enum(['doctor', 'nurse', 'general']),
      employmentStatus: z.union([z.enum(['permanent', 'temporary', 'internship']), z.literal('')]),
      gender: z.enum(['male', 'female', 'others']),
      maritalStatus: z.union([z.enum(['single', 'married', 'divorced']), z.literal('')]),
      dob: z.string().optional(),
      age: z.string().optional(),
      qualification: optionalText(100, t('employees.form.qualification')),
      phoneNo: optionalText(30, t('employees.form.phoneNo')),
      email: optionalText(50, t('common.label.email')),
      departmentId: z.string().min(1, t('employees.validation.departmentRequired')),
      stateId: z.string().optional(),
      townshipId: z.string().optional(),
      address: z.string().optional(),
      stateNumber: z.string().optional(),
      districtId: z.string().optional(),
      nrcType: z.union([z.enum(['N', 'A', 'P', 'Y', 'S', 'T']), z.literal('')]),
      nrcNo: optionalText(20, t('employees.form.nrcNo')),
      isActive: z.boolean()
    })
    .superRefine((values, ctx) => {
      // The configured rules first, so a blank mandatory field is reported as
      // blank rather than passing here and failing at the server.
      for (const field of required) {
        if (!(field in values)) continue;

        const value = values[field as keyof typeof values];
        const filled = typeof value === 'boolean' ? value : !!value?.toString().trim();
        if (!filled) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: v.required(registrationFieldLabel(t, 'employee', field))
          });
        }
      }

      if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        ctx.addIssue({
          code: 'custom',
          path: ['email'],
          message: t('employees.validation.invalidEmail')
        });
      }

      if (values.dob) {
        const birth = new Date(values.dob);
        if (Number.isNaN(birth.getTime())) {
          ctx.addIssue({
            code: 'custom',
            path: ['dob'],
            message: t('employees.validation.invalidDate')
          });
        } else if (birth.getTime() > Date.now()) {
          ctx.addIssue({
            code: 'custom',
            path: ['dob'],
            message: t('employees.validation.dobFuture')
          });
        }
      }

      if (values.age) {
        const age = Number(values.age);
        if (!/^\d+$/.test(values.age) || age > 150) {
          ctx.addIssue({ code: 'custom', path: ['age'], message: t('person.ageRange') });
        }
      }

      // The NRC is stored in four columns and only means something as a whole: a
      // record carrying two of them cannot be matched back to the person, so the
      // rest become required as soon as one is filled in.
      const nrcParts = [values.stateNumber, values.districtId, values.nrcType, values.nrcNo?.trim()];
      if (nrcParts.some(Boolean)) {
        // Named `message` rather than `required`, which is the configured set
        // this schema was built with.
        const message = t('person.nrcRequired');
        if (!values.stateNumber) {
          ctx.addIssue({ code: 'custom', path: ['stateNumber'], message });
        }
        if (!values.districtId) {
          ctx.addIssue({ code: 'custom', path: ['districtId'], message });
        }
        if (!values.nrcType) {
          ctx.addIssue({ code: 'custom', path: ['nrcType'], message });
        }
        if (!values.nrcNo?.trim()) {
          ctx.addIssue({ code: 'custom', path: ['nrcNo'], message });
        }
      }
    });
};

export type EmployeeFormValues = z.infer<ReturnType<typeof buildEmployeeSchema>>;

export const EMPTY_EMPLOYEE_FORM: EmployeeFormValues = {
  employeeNo: '',
  fullName: '',
  shortName: '',
  fatherName: '',
  employmentCategory: 'general',
  employmentStatus: '',
  gender: 'male',
  maritalStatus: '',
  dob: '',
  age: '',
  qualification: '',
  phoneNo: '',
  email: '',
  departmentId: '',
  stateId: '',
  townshipId: '',
  address: '',
  stateNumber: '',
  districtId: '',
  nrcType: '',
  nrcNo: '',
  isActive: true
};

const asText = (value: string | null | undefined) => value ?? '';
const asId = (value: number | null | undefined) => (value != null ? String(value) : '');

/** Seeds the form from an existing record when the dialog opens on an edit. */
export function toFormValues(employee: Employee): EmployeeFormValues {
  return {
    employeeNo: employee.employeeNo,
    fullName: employee.fullName,
    shortName: asText(employee.shortName),
    fatherName: asText(employee.fatherName),
    employmentCategory: employee.employmentCategory,
    employmentStatus: employee.employmentStatus ?? '',
    gender: employee.gender,
    maritalStatus: employee.maritalStatus ?? '',
    dob: employee.dob ? employee.dob.slice(0, 10) : '',
    age: employee.age != null ? String(employee.age) : '',
    qualification: asText(employee.qualification),
    phoneNo: asText(employee.phoneNo),
    email: asText(employee.email),
    departmentId: asId(employee.departmentId),
    stateId: asId(employee.stateId),
    townshipId: asId(employee.townshipId),
    address: asText(employee.address),
    stateNumber: asText(employee.stateNumber),
    districtId: asId(employee.districtId),
    nrcType: (employee.nrcType as EmployeeFormValues['nrcType']) ?? '',
    nrcNo: asText(employee.nrcNo),
    isActive: employee.isActive ?? true
  };
}

/** Blank optional text becomes null, never "" — the enum columns reject "". */
const text = (value: string | undefined) => value?.trim() || null;
const id = (value: string | undefined) => (value ? Number(value) : null);

export function toEmployeePayload(values: EmployeeFormValues): Partial<Employee> {
  // The model requires a department, so it is the one id that is never null by
  // the time validation has passed.
  return {
    employeeNo: values.employeeNo.trim(),
    fullName: values.fullName.trim(),
    shortName: text(values.shortName),
    fatherName: text(values.fatherName),
    employmentCategory: values.employmentCategory,
    employmentStatus: values.employmentStatus || null,
    gender: values.gender,
    maritalStatus: values.maritalStatus || null,
    dob: values.dob || null,
    age: values.age ? Number(values.age) : null,
    qualification: text(values.qualification),
    phoneNo: text(values.phoneNo),
    email: text(values.email),
    departmentId: Number(values.departmentId),
    stateId: id(values.stateId),
    townshipId: id(values.townshipId),
    address: text(values.address),
    stateNumber: values.stateNumber || null,
    districtId: id(values.districtId),
    nrcType: values.nrcType || null,
    nrcNo: text(values.nrcNo),
    isActive: values.isActive
  };
}
