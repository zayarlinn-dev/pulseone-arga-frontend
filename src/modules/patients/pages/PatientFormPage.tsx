import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBlocker, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ClipboardList,
  IdCard,
  Loader2,
  MapPin,
  Phone,
  Save,
  ShieldAlert,
  Star,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { CheckboxField } from '@/components/ui/checkbox-field';
import { RadioCard } from '@/components/ui/radio-card';
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
import { registrationFieldLabel } from '@/constants/registrationFields';
import { patientService } from '@/services';
import { getInitials } from '@/components/layout/navigation';
import { calculateAge, cn, formatDate } from '@/lib/utils';
import type { Patient } from '@/types/models';
import { FormSection } from '../components/FormSection';
import {
  countFilled,
  EMPTY_PATIENT_FORM,
  GENDERS,
  IDENTITY_TYPES,
  MARITAL_STATUSES,
  NRC_STATE_NUMBERS,
  NRC_TYPES,
  buildPatientSchema,
  REGISTRATION_CATEGORIES,
  RELATIONSHIPS,
  SECTION_FIELDS,
  toFormValues,
  toPatientPayload,
  type PatientFormField,
  type PatientFormValues,
  type SectionId
} from '../patientForm';

const CATEGORY_VARIANT = {
  'walk-in': 'secondary',
  emergency: 'destructive',
  'new-born': 'default'
} as const;

/**
 * Registers a patient, or edits one.
 *
 * This is a page rather than a dialog because the record has thirty-odd
 * columns: in a modal the desk would be scrolling a scroll area inside a
 * scrolling page. The two sections a walk-in actually needs are open on
 * arrival and the rest are collapsed, so the common case is a short form and
 * the full record is still one click away.
 */
export default function PatientFormPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Which fields this hospital insists on. Only the category, the name and the
  // gender are fixed — a patient record cannot exist without them — and
  // everything else is a setting, so the asterisks, the validation and the
  // checklist in the side panel all come from the server.
  const { required, loading: loadingRules } = useRequiredFields('patient');
  const isRequired = (field: string) => required.has(field);

  const schema = useMemo(() => buildPatientSchema(t, required), [t, required]);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    enabled: isEdit,
    queryFn: () => patientService.getById(id!)
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<PatientFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_PATIENT_FORM
  });

  const values = watch();

  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    registration: true,
    details: true,
    contact: true,
    identity: false,
    emergency: false,
    referral: false
  });

  useEffect(() => {
    if (patient) reset(toFormValues(patient));
  }, [patient, reset]);

  // ---------------------------------------------------------------------
  // Option lists. Townships and NRC districts are cascades: each depends on
  // the state chosen above it, so they stay idle until there is one.
  // ---------------------------------------------------------------------
  const { data: states = [] } = useDropdown('/dropdown/states');
  const { data: townships = [] } = useDropdown(
    `/dropdown/states/${values.stateId}/townships`,
    {},
    !!values.stateId
  );
  const { data: contactTownships = [] } = useDropdown(
    `/dropdown/states/${values.emergencyContactStateId}/townships`,
    {},
    !!values.emergencyContactStateId
  );
  const { data: districts = [] } = useDropdown(
    '/dropdown/districts',
    { stateNumber: values.stateNumber },
    !!values.stateNumber
  );
  const { data: doctors = [] } = useDropdown('/dropdown/employees', {
    employmentCategory: 'doctor'
  });
  const { data: staff = [] } = useDropdown('/dropdown/employees');

  // A successful save navigates away while the form is still dirty, which the
  // guard below would otherwise read as an abandoned edit.
  const savedRef = useRef(false);

  const { mutateAsync: save, isPending: saving } = useMutation({
    mutationFn: (payload: Partial<Patient>) =>
      isEdit ? patientService.update(id!, payload) : patientService.create(payload),
    onSuccess: saved => {
      savedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', id] });
      toast.success(
        isEdit
          ? t('patients.toast.updated')
          : saved.patientNo
            ? t('patients.toast.registered', { number: saved.patientNo })
            : t('patients.toast.registeredNoNumber')
      );
      navigate('/registration/patients');
    },
    onError: (error: Error) => toast.error(error.message || t('patients.toast.saveFailed'))
  });

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !savedRef.current && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!isDirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  /**
   * A collapsed section must not be able to hide the reason a save failed, so
   * the first invalid field reopens its section and takes focus.
   */
  const onInvalid = (formErrors: FieldErrors<PatientFormValues>) => {
    const firstField = Object.keys(formErrors)[0] as PatientFormField | undefined;
    if (!firstField) return;

    const section = (Object.keys(SECTION_FIELDS) as SectionId[]).find(key =>
      SECTION_FIELDS[key].includes(firstField)
    );
    if (section) setOpenSections(current => ({ ...current, [section]: true }));

    toast.error(t('patients.toast.missingRequired'));

    // Wait for the section to render before scrolling to what is inside it.
    requestAnimationFrame(() => {
      const target =
        document.getElementById(firstField) ??
        (section ? document.getElementById(`section-${section}`) : null);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
    });
  };

  const sectionHasError = (section: SectionId) =>
    SECTION_FIELDS[section].some(field => !!errors[field]);

  const toggleSection = (section: SectionId) =>
    setOpenSections(current => ({ ...current, [section]: !current[section] }));

  const previewAge = values.age || calculateAge(values.dob || null);

  const nrcPreview = useMemo(() => {
    if (values.identityType !== 'nrc') return null;
    const district = districts.find(option => String(option.id) === values.districtId);
    if (!values.stateNumber || !district || !values.nrcType || !values.nrcNo) return null;
    return `${values.stateNumber}/${district.name}(${values.nrcType})${values.nrcNo}`;
  }, [values.identityType, values.stateNumber, values.districtId, values.nrcType, values.nrcNo, districts]);

  /**
   * The "still needed" list in the side panel, built from the same rules the
   * schema validates against.
   *
   * It used to name the three fixed fields. Now that a hospital can add to
   * them, a list that still showed only those three would be telling the desk
   * the form was complete while the save was about to be refused — so it walks
   * the sections in form order and shows whatever is actually required.
   */
  const requiredChecklist = useMemo(() => {
    const inFormOrder = (Object.keys(SECTION_FIELDS) as SectionId[]).flatMap(
      section => SECTION_FIELDS[section]
    );

    return inFormOrder
      .filter(field => required.has(field))
      .map(field => {
        const value = values[field];
        return {
          field,
          label: registrationFieldLabel(t, 'patient', field),
          done: typeof value === 'boolean' ? value : !!value?.toString().trim()
        };
      });
  }, [required, values, t]);

  const submit = handleSubmit(formValues => save(toPatientPayload(formValues)), onInvalid);

  if (isEdit && isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const actions = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate('/registration/patients')}
        disabled={saving}
      >
              {t('common.action.cancel')}
            </Button>
      {/*
        Saving waits for the rules as well. Submitting before they arrive would
        skip checks the server applies anyway, and the desk would get an error
        back that the form could have shown beside the field.
      */}
      <Button type="submit" form="patient-form" disabled={saving || loadingRules}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {t(isEdit ? 'common.action.saveChanges' : 'patients.form.submitNew')}
      </Button>
    </>
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 h-8 w-8"
            onClick={() => navigate('/registration/patients')}
            aria-label={t('patients.form.back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {t(isEdit ? 'patients.form.editTitle' : 'patients.form.newTitle')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEdit
                ? t('patients.form.editSubtitle', {
                    name: patient?.patientName ?? t('patients.form.thisRecord')
                  })
                : t('patients.form.newSubtitle')}
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 lg:flex">{actions}</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form id="patient-form" onSubmit={submit} className="space-y-4" noValidate>
          {/* ---------------- Registration ---------------- */}
          <FormSection
            id="section-registration"
            title={t('patients.form.section.registration')}
            description={t('patients.form.section.registrationHint')}
            icon={ClipboardList}
            hasError={sectionHasError('registration')}
          >
            <div className="space-y-4">
              <Field
                label={t('common.label.category')}
                required
                error={errors.registrationCategory?.message}
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  {REGISTRATION_CATEGORIES.map(category => (
                    <RadioCard
                      key={category.value}
                      label={t(`patients.category.${category.value}`)}
                      description={t(`patients.categoryHint.${category.value}`)}
                      icon={category.icon}
                      value={category.value}
                      {...register('registrationCategory')}
                    />
                  ))}
                </div>
              </Field>

              <CheckboxField
                id="vip"
                label={t('patients.form.vip')}
                description={t('patients.form.vipHint')}
                {...register('vip')}
              />
            </div>
          </FormSection>

          {/* ---------------- Patient details ---------------- */}
          <FormSection
            id="section-details"
            title={t('patients.form.section.details')}
            description={t('patients.form.section.detailsHint')}
            icon={User}
            hasError={sectionHasError('details')}
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t('patients.form.fullName')}
                  htmlFor="patientName"
                  required={isRequired('patientName')}
                  error={errors.patientName?.message}
                >
                  <Input id="patientName" autoFocus={!isEdit} {...register('patientName')} />
                </Field>

                <Field
                  label={t('patients.form.fatherName')}
                  htmlFor="fatherName"
                  required={isRequired('fatherName')}
                  error={errors.fatherName?.message}
                >
                  <Input id="fatherName" {...register('fatherName')} />
                </Field>
              </div>

              <Field label={t('patients.summary.checklistGender')} required error={errors.gender?.message}>
                <div className="grid gap-2 sm:grid-cols-3">
                  {GENDERS.map(gender => (
                    <RadioCard
                      key={gender}
                      label={t(`person.gender.${gender}`)}
                      value={gender}
                      {...register('gender')}
                    />
                  ))}
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label={t('patients.form.dob')}
                  htmlFor="dob"
                  required={isRequired('dob')}
                  error={errors.dob?.message}
                  className="sm:col-span-2"
                >
                  <DateField
                    id="dob"
                    max={new Date().toISOString().slice(0, 10)}
                    {...register('dob', {
                      // Filling the age from the date of birth is the whole
                      // reason both columns exist; typing it twice is a chance
                      // for them to disagree.
                      onChange: event => {
                        const derived = calculateAge(event.target.value);
                        setValue('age', derived != null ? String(derived) : '', {
                          shouldDirty: true
                        });
                      }
                    })}
                  />
                </Field>

                <Field
                  label={t('patients.form.age')}
                  htmlFor="age"
                  required={isRequired('age')}
                  error={errors.age?.message}
                  hint={
                    values.dob ? t('patients.form.ageFromDob') : t('patients.form.ageManual')
                  }
                >
                  <Input id="age" inputMode="numeric" {...register('age')} />
                </Field>
              </div>

              <Field
                label={t('patients.form.maritalStatus')}
                htmlFor="maritalStatus"
                required={isRequired('maritalStatus')}
                error={errors.maritalStatus?.message}
              >
                <NativeSelect id="maritalStatus" {...register('maritalStatus')}>
                  <option value="">{t('common.label.notSet')}</option>
                  {MARITAL_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </FormSection>

          {/* ---------------- Contact ---------------- */}
          <FormSection
            id="section-contact"
            title={t('patients.form.section.contact')}
            description={t('patients.form.section.contactHint')}
            icon={Phone}
            hasError={sectionHasError('contact')}
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t('patients.form.phoneNo')}
                  htmlFor="phoneNo"
                  required={isRequired('phoneNo')}
                  error={errors.phoneNo?.message}
                >
                  <Input id="phoneNo" type="tel" {...register('phoneNo')} />
                </Field>

                <Field
                  label={t('patients.form.secondaryPhone')}
                  htmlFor="secondaryPhoneNo"
                  required={isRequired('secondaryPhoneNo')}
                  error={errors.secondaryPhoneNo?.message}
                >
                  <Input id="secondaryPhoneNo" type="tel" {...register('secondaryPhoneNo')} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t('patients.form.state')}
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
                  label={t('patients.form.township')}
                  htmlFor="townshipId"
                  required={isRequired('townshipId')}
                  error={errors.townshipId?.message}
                  hint={!values.stateId ? t('patients.form.townshipHint') : undefined}
                >
                  <NativeSelect
                    id="townshipId"
                    disabled={!values.stateId}
                    {...register('townshipId')}
                  >
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
                <Textarea id="address" {...register('address')} />
              </Field>
            </div>
          </FormSection>

          {/* ---------------- Identity ---------------- */}
          <FormSection
            id="section-identity"
            title={t('patients.form.section.identity')}
            description={t('patients.form.section.identityHint')}
            icon={IdCard}
            collapsible
            open={openSections.identity}
            onToggle={() => toggleSection('identity')}
            filledCount={countFilled(values, 'identity')}
            hasError={sectionHasError('identity')}
          >
            <div className="space-y-4">
              <Field
                label={t('patients.form.documentType')}
                htmlFor="identityType"
                required={isRequired('identityType')}
                error={errors.identityType?.message}
              >
                <NativeSelect id="identityType" {...register('identityType')}>
                  <option value="">{t('patients.form.notRecorded')}</option>
                  {IDENTITY_TYPES.map(type => (
                    <option key={type} value={type}>
                      {t(`patients.identityType.${type}`)}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              {values.identityType === 'nrc' && (
                <div className="space-y-4 rounded-lg border border-dashed p-3">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label={t('patients.form.stateNumber')}
                      htmlFor="stateNumber"
                      required
                      error={errors.stateNumber?.message}
                    >
                      <NativeSelect
                        id="stateNumber"
                        {...register('stateNumber', {
                          // Districts are listed per state number.
                          onChange: () => setValue('districtId', '', { shouldDirty: true })
                        })}
                      >
                        <option value="">Select</option>
                        {NRC_STATE_NUMBERS.map(number => (
                          <option key={number} value={number}>
                            {number}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>

                    <Field
                      label={t('patients.form.district')}
                      htmlFor="districtId"
                      required
                      error={errors.districtId?.message}
                      hint={!values.stateNumber ? t('patients.form.districtHint') : undefined}
                    >
                      <NativeSelect
                        id="districtId"
                        disabled={!values.stateNumber}
                        {...register('districtId')}
                      >
                        <option value="">Select</option>
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
                      label={t('common.label.type')}
                      htmlFor="nrcType"
                      required
                      error={errors.nrcType?.message}
                    >
                      <NativeSelect id="nrcType" {...register('nrcType')}>
                        <option value="">{t('patients.form.select')}</option>
                        {NRC_TYPES.map(type => (
                          <option key={type} value={type}>
                            {t(`person.nrcType.${type}`)}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>

                    <Field
                      label={t('patients.form.nrcNumber')}
                      htmlFor="nrcNo"
                      required
                      error={errors.nrcNo?.message}
                    >
                      <Input id="nrcNo" inputMode="numeric" {...register('nrcNo')} />
                    </Field>
                  </div>

                  <div className="rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-xs text-muted-foreground">Full NRC</p>
                    <p className="font-mono text-sm">
                      {nrcPreview ?? <span className="text-muted-foreground">Incomplete</span>}
                    </p>
                  </div>
                </div>
              )}

              {values.identityType && values.identityType !== 'nrc' && (
                <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Scanned copies of the document are attached from the patient's record after
                  registration.
                </p>
              )}
            </div>
          </FormSection>

          {/* ---------------- Emergency contact ---------------- */}
          <FormSection
            id="section-emergency"
            title={t('patients.form.section.emergency')}
            description={t('patients.form.section.emergencyHint')}
            icon={ShieldAlert}
            collapsible
            open={openSections.emergency}
            onToggle={() => toggleSection('emergency')}
            filledCount={countFilled(values, 'emergency')}
            hasError={sectionHasError('emergency')}
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t('patients.form.contactName')}
                  htmlFor="emergencyContactName"
                  required={isRequired('emergencyContactName')}
                  error={errors.emergencyContactName?.message}
                >
                  <Input id="emergencyContactName" {...register('emergencyContactName')} />
                </Field>

                <Field
                  label={t('patients.form.relationship')}
                  htmlFor="emergencyContactRelationship"
                  required={isRequired('emergencyContactRelationship')}
                  error={errors.emergencyContactRelationship?.message}
                >
                  <NativeSelect
                    id="emergencyContactRelationship"
                    {...register('emergencyContactRelationship')}
                  >
                    <option value="">{t('common.label.notSet')}</option>
                    {RELATIONSHIPS.map(relationship => (
                      <option key={relationship} value={relationship}>
                        {t(`patients.relationship.${relationship}`)}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label={t('patients.form.phoneNo')}
                  htmlFor="emergencyContactPhoneNo"
                  required={isRequired('emergencyContactPhoneNo')}
                  error={errors.emergencyContactPhoneNo?.message}
                >
                  <Input
                    id="emergencyContactPhoneNo"
                    type="tel"
                    {...register('emergencyContactPhoneNo')}
                  />
                </Field>

                <Field
                  label={t('patients.form.secondaryPhone')}
                  htmlFor="emergencyContactSecondaryPhoneNo"
                  required={isRequired('emergencyContactSecondaryPhoneNo')}
                  error={errors.emergencyContactSecondaryPhoneNo?.message}
                >
                  <Input
                    id="emergencyContactSecondaryPhoneNo"
                    type="tel"
                    {...register('emergencyContactSecondaryPhoneNo')}
                  />
                </Field>

                <Field
                  label={t('patients.summary.checklistGender')}
                  htmlFor="emergencyContactGender"
                  required={isRequired('emergencyContactGender')}
                  error={errors.emergencyContactGender?.message}
                >
                  <NativeSelect id="emergencyContactGender" {...register('emergencyContactGender')}>
                    <option value="">{t('common.label.notSet')}</option>
                    {GENDERS.map(gender => (
                      <option key={gender} value={gender}>
                        {t(`person.gender.${gender}`)}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t('patients.form.state')}
                  htmlFor="emergencyContactStateId"
                  required={isRequired('emergencyContactStateId')}
                  error={errors.emergencyContactStateId?.message}
                >
                  <NativeSelect
                    id="emergencyContactStateId"
                    {...register('emergencyContactStateId', {
                      onChange: () =>
                        setValue('emergencyContactTownshipId', '', { shouldDirty: true })
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
                  label={t('patients.form.township')}
                  htmlFor="emergencyContactTownshipId"
                  required={isRequired('emergencyContactTownshipId')}
                  error={errors.emergencyContactTownshipId?.message}
                  hint={
                    !values.emergencyContactStateId ? t('patients.form.townshipHint') : undefined
                  }
                >
                  <NativeSelect
                    id="emergencyContactTownshipId"
                    disabled={!values.emergencyContactStateId}
                    {...register('emergencyContactTownshipId')}
                  >
                    <option value="">{t('common.label.notSet')}</option>
                    {contactTownships.map(township => (
                      <option key={township.id} value={township.id}>
                        {township.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>

              <Field
                label={t('common.label.address')}
                htmlFor="emergencyContactAddress"
                required={isRequired('emergencyContactAddress')}
                error={errors.emergencyContactAddress?.message}
              >
                <Textarea
                  id="emergencyContactAddress"
                  rows={2}
                  {...register('emergencyContactAddress')}
                />
              </Field>
            </div>
          </FormSection>

          {/* ---------------- Referral ---------------- */}
          <FormSection
            id="section-referral"
            title={t('patients.form.section.referral')}
            description={t('patients.form.section.referralHint')}
            icon={MapPin}
            collapsible
            open={openSections.referral}
            onToggle={() => toggleSection('referral')}
            filledCount={countFilled(values, 'referral')}
            hasError={sectionHasError('referral')}
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t('patients.form.refHospital')}
                  htmlFor="refHospital"
                  required={isRequired('refHospital')}
                  error={errors.refHospital?.message}
                >
                  <Input id="refHospital" {...register('refHospital')} />
                </Field>

                <Field
                  label={t('patients.form.refDoctor')}
                  htmlFor="refDoctor"
                  required={isRequired('refDoctor')}
                  error={errors.refDoctor?.message}
                >
                  <Input id="refDoctor" {...register('refDoctor')} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t('patients.form.refHospitalPatientNo')}
                  htmlFor="refHospitalPatientNo"
                  required={isRequired('refHospitalPatientNo')}
                  error={errors.refHospitalPatientNo?.message}
                >
                  <Input id="refHospitalPatientNo" {...register('refHospitalPatientNo')} />
                </Field>

                <Field
                  label={t('patients.form.refVoucher')}
                  htmlFor="refVoucher"
                  required={isRequired('refVoucher')}
                  error={errors.refVoucher?.message}
                >
                  <Input id="refVoucher" {...register('refVoucher')} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t('patients.form.refToConsultant')}
                  htmlFor="refToConsultantId"
                  required={isRequired('refToConsultantId')}
                  error={errors.refToConsultantId?.message}
                >
                  <NativeSelect id="refToConsultantId" {...register('refToConsultantId')}>
                    <option value="">{t('common.label.notSet')}</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>

                <Field
                  label={t('patients.form.refToStaff')}
                  htmlFor="refToStaffId"
                  required={isRequired('refToStaffId')}
                  error={errors.refToStaffId?.message}
                >
                  <NativeSelect id="refToStaffId" {...register('refToStaffId')}>
                    <option value="">{t('common.label.notSet')}</option>
                    {staff.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={t('patients.form.refStaff')}
                  htmlFor="refStaff"
                  required={isRequired('refStaff')}
                  error={errors.refStaff?.message}
                >
                  <Input id="refStaff" {...register('refStaff')} />
                </Field>

                <Field
                  label={t('patients.form.refOther')}
                  htmlFor="refOther"
                  required={isRequired('refOther')}
                  error={errors.refOther?.message}
                >
                  <Input id="refOther" {...register('refOther')} />
                </Field>
              </div>
            </div>
          </FormSection>
        </form>

        {/* ---------------- Summary rail ---------------- */}
        <aside className="hidden lg:block">
          <Card className="sticky top-20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {values.patientName ? getInitials(values.patientName) : <User className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {values.patientName || t('patients.summary.newPatient')}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {isEdit ? patient?.patientNo : t('patients.summary.numberOnSave')}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant={CATEGORY_VARIANT[values.registrationCategory]}>
                {t(`patients.category.${values.registrationCategory}`)}
              </Badge>
              {values.gender && (
                <Badge variant="outline">{t(`person.gender.${values.gender}`)}</Badge>
              )}
              {previewAge !== null && previewAge !== '' && (
                <Badge variant="outline">
                  {t('patients.summary.years', { count: Number(previewAge) })}
                </Badge>
              )}
              {values.vip && (
                <Badge variant="warning">
                  <Star className="mr-1 h-3 w-3" />
                  VIP
                </Badge>
              )}
            </div>

            {isEdit && patient?.createdAt && (
              <p className="mt-3 text-xs text-muted-foreground">
                {t('patients.summary.registeredOn', { date: formatDate(patient.createdAt) })}
              </p>
            )}

            <div className="mt-4 border-t pt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('patients.summary.required')}
              </p>
              <ul className="mt-2 space-y-1.5">
                {requiredChecklist.map(entry => (
                  // Keyed by the field, not the label: a patient's phone number
                  // and their emergency contact's carry the same label.
                  <li key={entry.field} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                        entry.done
                          ? 'border-success bg-success/15 text-success'
                          : 'border-muted-foreground/40'
                      )}
                    >
                      {entry.done && <Check className="h-3 w-3" />}
                    </span>
                    <span className={entry.done ? 'text-muted-foreground' : ''}>{entry.label}</span>
                  </li>
                ))}
              </ul>

              {!isEdit && (
                <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t(
                    values.registrationCategory === 'emergency'
                      ? 'patients.summary.opensErVisit'
                      : 'patients.summary.opensVisit'
                  )}
                </p>
              )}
            </div>

            <div className="mt-4 grid gap-2 border-t pt-4">
              {/* Never disabled for a missing field: a greyed-out button
                  explains nothing, while submitting jumps to whichever one is
                  still empty. It does wait for the required-field rules, which
                  decide what "missing" means. */}
              <Button type="submit" form="patient-form" disabled={saving || loadingRules}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t(isEdit ? 'common.action.saveChanges' : 'patients.form.submitNew')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/registration/patients')}
                disabled={saving}
              >
              {t('common.action.cancel')}
            </Button>
            </div>
          </Card>
        </aside>
      </div>

      {/* On a phone the rail is off-screen, so the actions follow the thumb. */}
      <div className="sticky bottom-0 -mx-4 mt-4 flex items-center justify-end gap-2 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
        {actions}
      </div>

      <Dialog
        open={blocker.state === 'blocked'}
        onOpenChange={isOpen => !isOpen && blocker.reset?.()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('common.confirm.discardTitle')}</DialogTitle>
            <DialogDescription>{t('patients.form.discardBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => blocker.reset?.()}>
              {t('common.confirm.keepEditing')}
            </Button>
            <Button variant="destructive" onClick={() => blocker.proceed?.()}>
              {t('common.action.discard')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
