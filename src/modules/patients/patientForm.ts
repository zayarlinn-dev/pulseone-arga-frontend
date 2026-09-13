import { z } from 'zod';
import { fieldRules } from '@/i18n/validation';
import { registrationFieldLabel } from '@/constants/registrationFields';
import type { TFunction } from 'i18next';
import { AlertTriangle, Baby, Footprints } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  EmergencyContactRelationship,
  IdentityType,
  Patient,
  RegistrationCategory
} from '@/types/models';
// Shared with the employee form — the columns behind them are the same enums.
export { GENDERS, MARITAL_STATUSES, NRC_STATE_NUMBERS, NRC_TYPES } from '@/constants/person';

/**
 * Shape, validation and API mapping for the patient registration form.
 *
 * Every control holds a string, because that is what `<input>` and `<select>`
 * actually produce; the conversion to ids, numbers and nulls happens once in
 * toPatientPayload rather than field by field across the page.
 */

export const REGISTRATION_CATEGORIES: { value: RegistrationCategory; icon: LucideIcon }[] = [
  { value: 'walk-in', icon: Footprints },
  { value: 'emergency', icon: AlertTriangle },
  { value: 'new-born', icon: Baby }
];

export const IDENTITY_TYPES: IdentityType[] = ['nrc', 'passport', 'driving-licence'];

export const RELATIONSHIPS: EmergencyContactRelationship[] = [
  'father', 'mother', 'husband', 'wife', 'sister', 'brother', 'partner', 'relative'
];

/**
 * Built per language rather than once at import: a schema defined at module
 * scope would freeze its messages in whichever language the tab loaded in.
 *
 * `required` is the set of fields this hospital insists on, from
 * `/settings/required-fields`. Only three of them are fixed — a patient with no
 * name, gender or category cannot be written at all — and everything else is a
 * policy the hospital sets, so the rules arrive with the page rather than being
 * written into the schema here. The server enforces the same set on the way in;
 * this is what puts the message beside the field instead of in a toast.
 */
export const buildPatientSchema = (t: TFunction, required: ReadonlySet<string> = new Set()) => {
  const v = fieldRules(t);
  const optionalText = (max: number, label: string) =>
    z.string().max(max, v.max(label, max)).optional();

  return z
    .object({
      // Registration
      registrationCategory: z.enum(['walk-in', 'emergency', 'new-born']),
      vip: z.boolean(),

      // Patient details
      patientName: z
        .string()
        .min(1, t('patients.validation.nameRequired'))
        .max(50, v.max(t('common.label.name'), 50)),
      gender: z.enum(['male', 'female', 'others']),
      fatherName: optionalText(50, t('patients.form.fatherName')),
      dob: z.string().optional(),
      age: z.string().optional(),
      maritalStatus: z.union([z.enum(['single', 'married', 'divorced']), z.literal('')]),

      // Contact
      phoneNo: optionalText(30, t('patients.form.phoneNo')),
      secondaryPhoneNo: optionalText(30, t('patients.field.secondaryPhoneNo')),
      address: z.string().optional(),
      stateId: z.string().optional(),
      townshipId: z.string().optional(),

      // Identity
      identityType: z.union([z.enum(['nrc', 'passport', 'driving-licence']), z.literal('')]),
      stateNumber: z.string().optional(),
      districtId: z.string().optional(),
      nrcType: z.union([z.enum(['N', 'A', 'P', 'Y', 'S', 'T']), z.literal('')]),
      nrcNo: optionalText(20, t('employees.form.nrcNo')),

      // Emergency contact
      emergencyContactName: optionalText(50, t('patients.field.contactName')),
      emergencyContactRelationship: z.union([
        z.enum(['father', 'mother', 'husband', 'wife', 'sister', 'brother', 'partner', 'relative']),
        z.literal('')
      ]),
      emergencyContactGender: z.union([z.enum(['male', 'female', 'others']), z.literal('')]),
      emergencyContactPhoneNo: optionalText(30, t('patients.field.contactPhoneNo')),
      emergencyContactSecondaryPhoneNo: optionalText(
        30,
        t('patients.field.contactSecondaryPhoneNo')
      ),
      emergencyContactAddress: z.string().optional(),
      emergencyContactStateId: z.string().optional(),
      emergencyContactTownshipId: z.string().optional(),

      // Referral
      refHospital: optionalText(100, t('patients.field.refHospital')),
      refDoctor: optionalText(50, t('patients.field.refDoctor')),
      refHospitalPatientNo: optionalText(20, t('patients.field.refHospitalPatientNo')),
      refToConsultantId: z.string().optional(),
      refToStaffId: z.string().optional(),
      refVoucher: optionalText(100, t('patients.field.refVoucher')),
      refStaff: optionalText(100, t('patients.field.refStaff')),
      refOther: optionalText(100, t('patients.field.refOther'))
    })
    .superRefine((values, ctx) => {
      // The configured rules first, so a blank mandatory field is reported as
      // blank rather than passing here and failing at the server.
      for (const field of required) {
        if (!(field in values)) continue;

        const value = values[field as PatientFormField];
        const filled = typeof value === 'boolean' ? value : !!value?.toString().trim();
        if (!filled) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: v.required(registrationFieldLabel(t, 'patient', field))
          });
        }
      }

      if (values.dob) {
        const birth = new Date(values.dob);
        if (Number.isNaN(birth.getTime())) {
          ctx.addIssue({
            code: 'custom',
            path: ['dob'],
            message: t('patients.validation.invalidDate')
          });
        } else if (birth.getTime() > Date.now()) {
          ctx.addIssue({
            code: 'custom',
            path: ['dob'],
            message: t('patients.validation.dobFuture')
          });
        }
      }

      if (values.age) {
        const age = Number(values.age);
        if (!/^\d+$/.test(values.age) || age > 150) {
          ctx.addIssue({ code: 'custom', path: ['age'], message: t('person.ageRange') });
        }
      }

      // A half-filled NRC is worse than none: it cannot be matched back to the
      // patient, so the three parts are required together once NRC is chosen.
      if (values.identityType === 'nrc') {
        const required = t('person.nrcRequired');
        if (!values.stateNumber) {
          ctx.addIssue({ code: 'custom', path: ['stateNumber'], message: required });
        }
        if (!values.districtId) {
          ctx.addIssue({ code: 'custom', path: ['districtId'], message: required });
        }
        if (!values.nrcType) {
          ctx.addIssue({ code: 'custom', path: ['nrcType'], message: required });
        }
        if (!values.nrcNo?.trim()) {
          ctx.addIssue({ code: 'custom', path: ['nrcNo'], message: required });
        }
      }
    });
};

export type PatientFormValues = z.infer<ReturnType<typeof buildPatientSchema>>;
export type PatientFormField = keyof PatientFormValues;

export type SectionId =
  | 'registration'
  | 'details'
  | 'contact'
  | 'identity'
  | 'emergency'
  | 'referral';

/** Lets a validation error reopen and scroll to the section that holds it. */
export const SECTION_FIELDS: Record<SectionId, PatientFormField[]> = {
  registration: ['registrationCategory', 'vip'],
  details: ['patientName', 'gender', 'fatherName', 'dob', 'age', 'maritalStatus'],
  contact: ['phoneNo', 'secondaryPhoneNo', 'address', 'stateId', 'townshipId'],
  identity: ['identityType', 'stateNumber', 'districtId', 'nrcType', 'nrcNo'],
  emergency: [
    'emergencyContactName',
    'emergencyContactRelationship',
    'emergencyContactGender',
    'emergencyContactPhoneNo',
    'emergencyContactSecondaryPhoneNo',
    'emergencyContactAddress',
    'emergencyContactStateId',
    'emergencyContactTownshipId'
  ],
  referral: [
    'refHospital',
    'refDoctor',
    'refHospitalPatientNo',
    'refToConsultantId',
    'refToStaffId',
    'refVoucher',
    'refStaff',
    'refOther'
  ]
};

export const EMPTY_PATIENT_FORM: PatientFormValues = {
  registrationCategory: 'walk-in',
  vip: false,
  patientName: '',
  gender: 'male',
  fatherName: '',
  dob: '',
  age: '',
  maritalStatus: '',
  phoneNo: '',
  secondaryPhoneNo: '',
  address: '',
  stateId: '',
  townshipId: '',
  identityType: '',
  stateNumber: '',
  districtId: '',
  nrcType: '',
  nrcNo: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactGender: '',
  emergencyContactPhoneNo: '',
  emergencyContactSecondaryPhoneNo: '',
  emergencyContactAddress: '',
  emergencyContactStateId: '',
  emergencyContactTownshipId: '',
  refHospital: '',
  refDoctor: '',
  refHospitalPatientNo: '',
  refToConsultantId: '',
  refToStaffId: '',
  refVoucher: '',
  refStaff: '',
  refOther: ''
};

const asText = (value: string | null | undefined) => value ?? '';
const asId = (value: number | null | undefined) => (value != null ? String(value) : '');

/** Seeds the form from an existing record for the edit route. */
export function toFormValues(patient: Patient): PatientFormValues {
  return {
    registrationCategory: patient.registrationCategory,
    vip: patient.vip ?? false,
    patientName: patient.patientName,
    gender: patient.gender,
    fatherName: asText(patient.fatherName),
    dob: patient.dob ? patient.dob.slice(0, 10) : '',
    age: patient.age != null ? String(patient.age) : '',
    maritalStatus: patient.maritalStatus ?? '',
    phoneNo: asText(patient.phoneNo),
    secondaryPhoneNo: asText(patient.secondaryPhoneNo),
    address: asText(patient.address),
    stateId: asId(patient.stateId),
    townshipId: asId(patient.townshipId),
    identityType: patient.identityType ?? '',
    stateNumber: asText(patient.stateNumber),
    districtId: asId(patient.districtId),
    nrcType: patient.nrcType ?? '',
    nrcNo: asText(patient.nrcNo),
    emergencyContactName: asText(patient.emergencyContactName),
    emergencyContactRelationship: patient.emergencyContactRelationship ?? '',
    emergencyContactGender: patient.emergencyContactGender ?? '',
    emergencyContactPhoneNo: asText(patient.emergencyContactPhoneNo),
    emergencyContactSecondaryPhoneNo: asText(patient.emergencyContactSecondaryPhoneNo),
    emergencyContactAddress: asText(patient.emergencyContactAddress),
    emergencyContactStateId: asId(patient.emergencyContactStateId),
    emergencyContactTownshipId: asId(patient.emergencyContactTownshipId),
    refHospital: asText(patient.refHospital),
    refDoctor: asText(patient.refDoctor),
    refHospitalPatientNo: asText(patient.refHospitalPatientNo),
    refToConsultantId: asId(patient.refToConsultantId),
    refToStaffId: asId(patient.refToStaffId),
    refVoucher: asText(patient.refVoucher),
    refStaff: asText(patient.refStaff),
    refOther: asText(patient.refOther)
  };
}

/** Blank optional text becomes null, never "". */
const text = (value: string | undefined) => value?.trim() || null;
const id = (value: string | undefined) => (value ? Number(value) : null);

export function toPatientPayload(values: PatientFormValues): Partial<Patient> {
  const isNrc = values.identityType === 'nrc';

  return {
    registrationCategory: values.registrationCategory,
    vip: values.vip,
    patientName: values.patientName.trim(),
    gender: values.gender,
    fatherName: text(values.fatherName),
    dob: values.dob || null,
    // Left blank, the backend derives the age from the date of birth.
    age: values.age ? Number(values.age) : null,
    maritalStatus: values.maritalStatus || null,
    phoneNo: text(values.phoneNo),
    secondaryPhoneNo: text(values.secondaryPhoneNo),
    address: text(values.address),
    stateId: id(values.stateId),
    townshipId: id(values.townshipId),
    identityType: values.identityType || null,
    // The NRC parts belong to an NRC; another document type must not keep them.
    stateNumber: isNrc ? (values.stateNumber as Patient['stateNumber']) || null : null,
    districtId: isNrc ? id(values.districtId) : null,
    nrcType: isNrc ? values.nrcType || null : null,
    nrcNo: isNrc ? text(values.nrcNo) : null,
    emergencyContactName: text(values.emergencyContactName),
    emergencyContactRelationship: values.emergencyContactRelationship || null,
    emergencyContactGender: values.emergencyContactGender || null,
    emergencyContactPhoneNo: text(values.emergencyContactPhoneNo),
    emergencyContactSecondaryPhoneNo: text(values.emergencyContactSecondaryPhoneNo),
    emergencyContactAddress: text(values.emergencyContactAddress),
    emergencyContactStateId: id(values.emergencyContactStateId),
    emergencyContactTownshipId: id(values.emergencyContactTownshipId),
    refHospital: text(values.refHospital),
    refDoctor: text(values.refDoctor),
    refHospitalPatientNo: text(values.refHospitalPatientNo),
    refToConsultantId: id(values.refToConsultantId),
    refToStaffId: id(values.refToStaffId),
    refVoucher: text(values.refVoucher),
    refStaff: text(values.refStaff),
    refOther: text(values.refOther)
  };
}

/** Fields in a section that carry a value — the "3 filled" badge when closed. */
export function countFilled(values: PatientFormValues, section: SectionId): number {
  return SECTION_FIELDS[section].filter(field => {
    const value = values[field];
    return typeof value === 'boolean' ? value : !!value?.toString().trim();
  }).length;
}
