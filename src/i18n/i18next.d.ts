import type { en } from '@/i18n/locales/en';
import type { settings } from '@/i18n/locales/en/settings';
import type { management } from '@/i18n/locales/en/management';
import type { erp } from '@/i18n/locales/en/erp';

/**
 * Makes `t('...')` reject keys that do not exist in the English catalogue,
 * which is the source of truth — a typo becomes a build error rather than a
 * key rendered verbatim in the UI.
 *
 * The catalogue is handed over nested, as the object it is. Flattening it first
 * into `Record<'a.b.c', string>` types the same keys but hands i18next a union
 * of every path at once, and at this catalogue's size that union stops being
 * representable: keys four levels deep start being rejected in files nobody
 * touched, and which files depends on how many keys the catalogue happens to
 * hold. Adding a single string anywhere breaks something elsewhere.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
      // Its own namespace, and its own much smaller key union — see the note
      // on `resources` in i18n/index.ts for why that matters.
      settings: typeof settings;
      // Same reason as settings: the owner's screen carries a lot of copy, and
      // it is four levels deep in places.
      management: typeof management;
      // The six ERP modules — the audit trail, approvals, appointments and the
      // queue, the clinical record, HR and payroll, and the report builder.
      // Far and away the largest catalogue here, so it gets its own union for
      // the same reason the two above do.
      erp: typeof erp;
    };
    returnNull: false;
  }
}
