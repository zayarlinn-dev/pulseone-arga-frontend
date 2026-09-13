import type { ParseKeys, TFunction } from 'i18next';
import type { RegistrationForm } from '@/types/models';

/**
 * What each configurable registration field is called, and which part of the
 * form it sits in.
 *
 * The server decides which fields exist and which are required; this decides
 * what they are called on screen. Keeping the labels here rather than sending
 * them from Go is what lets the settings screen and the form it governs read
 * identically in both languages — the entries below point at the very keys the
 * patient page and the employee dialog already render.
 *
 * A field the server sends that is missing from these maps still appears on the
 * settings screen, labelled with its own key. That is deliberate: a field added
 * to the Go catalogue and not yet translated should look untranslated, not
 * vanish from the list of things the desk must collect.
 */
export const FIELD_LABEL_KEYS: Record<RegistrationForm, Record<string, ParseKeys>> = {
  patient: {
    registrationCategory: 'patients.summary.checklistCategory',
    patientName: 'patients.summary.checklistName',
    gender: 'patients.summary.checklistGender',
    fatherName: 'patients.form.fatherName',
    dob: 'patients.form.dob',
    age: 'patients.form.age',
    maritalStatus: 'patients.form.maritalStatus',

    phoneNo: 'patients.form.phoneNo',
    secondaryPhoneNo: 'patients.form.secondaryPhone',
    address: 'common.label.address',
    stateId: 'patients.form.state',
    townshipId: 'patients.form.township',

    identityType: 'patients.form.documentType',

    emergencyContactName: 'patients.form.contactName',
    emergencyContactRelationship: 'patients.form.relationship',
    emergencyContactGender: 'patients.summary.checklistGender',
    emergencyContactPhoneNo: 'patients.form.phoneNo',
    emergencyContactSecondaryPhoneNo: 'patients.form.secondaryPhone',
    emergencyContactAddress: 'common.label.address',
    emergencyContactStateId: 'patients.form.state',
    emergencyContactTownshipId: 'patients.form.township',

    refHospital: 'patients.form.refHospital',
    refDoctor: 'patients.form.refDoctor',
    refHospitalPatientNo: 'patients.form.refHospitalPatientNo',
    refToConsultantId: 'patients.form.refToConsultant',
    refToStaffId: 'patients.form.refToStaff',
    refVoucher: 'patients.form.refVoucher',
    refStaff: 'patients.form.refStaff',
    refOther: 'patients.form.refOther'
  },

  employee: {
    employeeNo: 'employees.form.employeeNumber',
    fullName: 'employees.form.fullName',
    departmentId: 'employees.form.department',
    employmentCategory: 'employees.form.category',
    shortName: 'employees.form.shortName',
    employmentStatus: 'employees.form.employmentStatus',
    qualification: 'employees.form.qualification',

    gender: 'employees.form.gender',
    fatherName: 'employees.form.fatherName',
    dob: 'employees.form.dob',
    age: 'employees.form.age',
    maritalStatus: 'employees.form.maritalStatus',

    phoneNo: 'employees.form.phoneNo',
    email: 'common.label.email',
    stateId: 'employees.form.state',
    townshipId: 'employees.form.township',
    address: 'common.label.address',

    nrcNo: 'employees.form.nrcNo'
  }
};

/** The section headings, mirroring the ones the forms themselves show. */
export const SECTION_LABEL_KEYS: Record<RegistrationForm, Record<string, ParseKeys>> = {
  patient: {
    registration: 'patients.form.section.registration',
    details: 'patients.form.section.details',
    contact: 'patients.form.section.contact',
    identity: 'patients.form.section.identity',
    emergency: 'patients.form.section.emergency',
    referral: 'patients.form.section.referral'
  },
  employee: {
    employment: 'employees.section.employment',
    personal: 'employees.section.personal',
    contact: 'employees.section.contact',
    nrc: 'employees.section.nrc'
  }
};

/**
 * Fields whose rule pulls others in with it.
 *
 * Neither is an exception the server has to know about — both are rules the
 * forms already enforced before any of this was configurable — but an
 * administrator switching one on deserves to be told what else it makes
 * mandatory, rather than finding out from the desk.
 */
export const FIELD_IMPLICATION_KEYS: Record<RegistrationForm, Record<string, ParseKeys<'settings'>>> = {
  patient: { identityType: 'requiredFields.implication.identityType' },
  employee: { nrcNo: 'requiredFields.implication.nrcNo' }
};

/**
 * What to call one field, for the settings screen and for the "X is required"
 * message the form shows when it is left blank.
 *
 * Both name the field the same way, because the person who ticked it on the
 * settings screen is often the person the desk phones about it.
 */
export function registrationFieldLabel(
  t: TFunction,
  form: RegistrationForm,
  field: string
): string {
  const key = FIELD_LABEL_KEYS[form][field];
  return key ? t(key) : field;
}
