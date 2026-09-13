import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Info, Loader2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckboxField } from '@/components/ui/checkbox-field';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  REQUIRED_FIELDS_QUERY_KEY,
  useRequiredFieldSettings
} from '@/hooks/api/useRequiredFields';
import {
  FIELD_IMPLICATION_KEYS,
  SECTION_LABEL_KEYS,
  registrationFieldLabel
} from '@/constants/registrationFields';
import { useAuthStore } from '@/stores/userStore';
import { settingsService } from '@/services';
import type { RegistrationForm, RequiredFieldForm, RequiredFieldSetting } from '@/types/models';

/**
 * Which fields patient and employee registration insist on.
 *
 * The columns behind almost every field on those two forms are nullable, so
 * what the desk must collect is a decision each hospital makes rather than
 * something the schema settled. One chases unpaid bills by phone and wants a
 * number on every patient; the next registers unconscious emergency arrivals
 * all night and cannot ask them anything.
 *
 * The fields the record cannot exist without are shown too, locked. A screen
 * that listed only the optional half could not answer "what does registration
 * ask for?", which is the question someone opens this page with.
 */
export default function RegistrationFieldsPage() {
  // Two catalogues: this screen's own strings, and the shared ones it borrows
  // — the field labels come from the very forms this page governs, so they are
  // read from where those forms read them. See i18n/index.ts for why the
  // settings strings sit in a namespace of their own.
  const { t } = useTranslation('settings');
  const { t: shared } = useTranslation();
  const queryClient = useQueryClient();
  const canEdit = useAuthStore(state => state.can('update-setting'));

  const { data, isLoading, error } = useRequiredFieldSettings();

  const save = useMutation({
    mutationFn: ({ form, fields }: { form: RegistrationForm; fields: string[] }) =>
      settingsService.updateRequiredFields(form, fields),
    onSuccess: () => {
      toast.success(t('requiredFields.saved'));
      // The two registration forms read the same key, so they pick the new
      // rules up on their next render rather than on the next reload.
      queryClient.invalidateQueries({ queryKey: REQUIRED_FIELDS_QUERY_KEY });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        {shared('common.label.loading')}
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="py-16 text-center text-sm text-destructive">
        {(error as Error)?.message ?? t('requiredFields.failed')}
      </p>
    );
  }

  return (
    <>
      <PageHeader
        title={t('requiredFields.title')}
        description={t('requiredFields.description')}
      />

      <div className="space-y-6">
        <LockedFieldNotice />

        {data.forms.map(form => (
          <FormCard
            key={form.form}
            form={form}
            canEdit={canEdit}
            saving={save.isPending && save.variables?.form === form.form}
            onSave={fields => save.mutate({ form: form.form, fields })}
          />
        ))}
      </div>
    </>
  );
}

/**
 * Why some switches cannot be moved.
 *
 * Stated once at the top rather than as a tooltip per row: someone looking for
 * the switch that turns off "patient name" needs the answer before they go
 * hunting for it.
 */
function LockedFieldNotice() {
  const { t } = useTranslation('settings');

  return (
    <div className="flex gap-3 rounded-lg border border-info/30 bg-info/5 p-4 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-info" />
      <div className="space-y-1">
        <p className="font-medium">{t('requiredFields.guard.title')}</p>
        <p className="text-muted-foreground">{t('requiredFields.guard.body')}</p>
      </div>
    </div>
  );
}

/**
 * One form's rules, saved as a whole.
 *
 * Whole set rather than a switch that saves on toggle: turning three fields on
 * is one decision, and a row-by-row save turns a change of mind halfway through
 * into a form the desk is already being held to.
 */
function FormCard({
  form,
  canEdit,
  saving,
  onSave
}: {
  form: RequiredFieldForm;
  canEdit: boolean;
  saving: boolean;
  onSave: (fields: string[]) => void;
}) {
  const { t } = useTranslation('settings');
  const { t: shared } = useTranslation();

  // What the server holds, as a set, so the draft below can be compared to it.
  const stored = useMemo(
    () => new Set(form.fields.filter(field => field.required).map(field => field.key)),
    [form.fields]
  );

  const [draft, setDraft] = useState<Set<string>>(stored);

  // A save returns the stored rules, and another administrator may have saved
  // in between, so the switches follow the server rather than keeping whatever
  // was clicked here.
  useEffect(() => setDraft(stored), [stored]);

  const dirty =
    draft.size !== stored.size || [...draft].some(field => !stored.has(field));

  const toggle = (key: string) =>
    setDraft(current => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Sections in the order the server sent them, which is the order the form
  // itself shows them in.
  const sections = useMemo(() => {
    const grouped = new Map<string, RequiredFieldSetting[]>();
    for (const field of form.fields) {
      const bucket = grouped.get(field.section);
      if (bucket) bucket.push(field);
      else grouped.set(field.section, [field]);
    }
    return [...grouped.entries()];
  }, [form.fields]);

  const configurable = form.fields.filter(field => !field.alwaysRequired);
  const chosen = configurable.filter(field => draft.has(field.key)).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>{t(`requiredFields.form.${form.form}`)}</CardTitle>
            <CardDescription>
              {t(`requiredFields.formHint.${form.form}`)}
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {/* Named `chosen` rather than `count`, which i18next would read as
                a plural selector and look for keys that do not exist. */}
            {t('requiredFields.chosen', { chosen, total: configurable.length })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {sections.map(([section, fields]) => {
          // A section the server sends and this app has no heading for is shown
          // under its own name: a new group of fields should look untranslated
          // rather than unlabelled.
          const heading = SECTION_LABEL_KEYS[form.form][section];

          return (
          <div key={section} className="space-y-3">
            <h3 className="border-b pb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {heading ? shared(heading) : section}
            </h3>

            <div className="grid gap-2 sm:grid-cols-2">
              {fields.map(field => (
                <FieldSwitch
                  key={field.key}
                  form={form.form}
                  field={field}
                  checked={field.alwaysRequired || draft.has(field.key)}
                  disabled={!canEdit || field.alwaysRequired}
                  onToggle={() => toggle(field.key)}
                />
              ))}
            </div>
          </div>
          );
        })}

        {canEdit && (
          <div className="flex items-center gap-2 border-t pt-4">
            <Button size="sm" disabled={!dirty || saving} onClick={() => onSave([...draft])}>
              {saving && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              {shared('common.action.save')}
            </Button>
            {dirty && (
              <Button variant="ghost" size="sm" onClick={() => setDraft(stored)}>
                {shared('common.action.cancel')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** One field's switch, with the badge or note that explains its state. */
function FieldSwitch({
  form,
  field,
  checked,
  disabled,
  onToggle
}: {
  form: RegistrationForm;
  field: RequiredFieldSetting;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation('settings');
  const { t: shared } = useTranslation();
  const implication = FIELD_IMPLICATION_KEYS[form][field.key];

  return (
    <div className="space-y-1">
      <CheckboxField
        id={`${form}-${field.key}`}
        label={registrationFieldLabel(shared, form, field.key)}
        description={
          field.alwaysRequired ? t('requiredFields.alwaysHint') : undefined
        }
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
      />

      {field.alwaysRequired && (
        <p className="flex items-center gap-1 pl-1 text-xs text-muted-foreground">
          <Lock className="size-3" />
          {t('requiredFields.always')}
        </p>
      )}

      {/*
        Requiring one of these requires more than itself. Saying so here is what
        stops it being discovered at the desk.
      */}
      {implication && checked && !field.alwaysRequired && (
        <p className="pl-1 text-xs text-muted-foreground">{t(implication)}</p>
      )}
    </div>
  );
}
