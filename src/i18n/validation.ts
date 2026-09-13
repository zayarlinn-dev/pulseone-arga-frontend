import type { TFunction } from 'i18next';

/**
 * The two validation messages every form in this app repeats.
 *
 * Zod schemas take their messages as plain strings, which means a schema
 * defined at module scope bakes in whichever language the tab happened to load
 * in. So schemas here are built by a factory that takes `t`, and the component
 * rebuilds its schema when the language changes:
 *
 * ```ts
 * const buildSchema = (t: TFunction) => {
 *   const v = fieldRules(t);
 *   return z.object({ code: z.string().min(1, v.required(...)).max(20, v.max(..., 20)) });
 * };
 *
 * const schema = useMemo(() => buildSchema(t), [t]);
 * ```
 *
 * Both messages name the field rather than saying "this field", because a form
 * that fails validation scrolls the first error into view and the reader may
 * not have the label in front of them.
 */
export function fieldRules(t: TFunction) {
  return {
    required: (field: string) => t('common.validation.requiredField', { field }),
    max: (field: string, max: number) => t('common.validation.maxLength', { field, max })
  };
}
