import { common } from '@/i18n/locales/my/common';
import { nav } from '@/i18n/locales/my/nav';
import { shell } from '@/i18n/locales/my/shell';
import { auth } from '@/i18n/locales/my/auth';
import { admin } from '@/i18n/locales/my/admin';
import { person } from '@/i18n/locales/my/person';
import { clinical } from '@/i18n/locales/my/clinical';
import { billing } from '@/i18n/locales/my/billing';
import { dashboard } from '@/i18n/locales/my/dashboard';
import { procurement } from '@/i18n/locales/my/procurement';
import { pharmacy } from '@/i18n/locales/my/pharmacy';
import { inventory } from '@/i18n/locales/my/inventory';

export const my = {
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
};
