import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/services';
import type { RegistrationForm, RequiredFieldSettings } from '@/types/models';

/** The shared cache key, so a save on the settings screen refreshes the forms. */
export const REQUIRED_FIELDS_QUERY_KEY = ['required-fields'] as const;

export function useRequiredFieldSettings() {
  return useQuery<RequiredFieldSettings>({
    queryKey: REQUIRED_FIELDS_QUERY_KEY,
    // These change perhaps twice a year and are read on every registration, so
    // they are cached rather than re-fetched per mount. The settings screen
    // invalidates this key on save, so an edit still lands immediately.
    staleTime: 5 * 60_000,
    queryFn: settingsService.getRequiredFields
  });
}

/**
 * Which fields a registration form must not be submitted without.
 *
 * Returns the always-required fields and the configured ones together: the form
 * marks and refuses both the same way, and which of the two a field is belongs
 * to the settings screen, not to the desk filling it in.
 *
 * `loading` matters. Until the rules arrive the set is empty, and a form that
 * let someone submit in that window would bounce off the server's copy of the
 * same rules — so the save button waits for it.
 */
export function useRequiredFields(form: RegistrationForm) {
  const { data, isLoading } = useRequiredFieldSettings();

  const required = useMemo(() => {
    const fields = data?.forms.find(entry => entry.form === form)?.fields ?? [];
    return new Set(fields.filter(field => field.required).map(field => field.key));
  }, [data, form]);

  return { required, loading: isLoading };
}
