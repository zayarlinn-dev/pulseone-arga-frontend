import { common } from '@/i18n/locales/en/common';
import { nav } from '@/i18n/locales/en/nav';
import { shell } from '@/i18n/locales/en/shell';
import { auth } from '@/i18n/locales/en/auth';
import { admin } from '@/i18n/locales/en/admin';
import { person } from '@/i18n/locales/en/person';
import { clinical } from '@/i18n/locales/en/clinical';
import { billing } from '@/i18n/locales/en/billing';
import { dashboard } from '@/i18n/locales/en/dashboard';
import { procurement } from '@/i18n/locales/en/procurement';
import { pharmacy } from '@/i18n/locales/en/pharmacy';
import { inventory } from '@/i18n/locales/en/inventory';

/**
 * The English catalogue is the source of truth: it types `t()` and it is what
 * a missing Myanmar string falls back to.
 */
export const en = {
  common,
  nav,
  shell,
  auth,
  person,
  ...admin,
  ...clinical,
  ...billing,
  ...procurement,
  pharmacy,
  inventory,
  dashboard
} as const;
