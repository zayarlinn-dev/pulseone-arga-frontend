import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { en } from '@/i18n/locales/en';
import { my } from '@/i18n/locales/my';
import { settings as enSettings } from '@/i18n/locales/en/settings';
import { settings as mySettings } from '@/i18n/locales/my/settings';
import { management as enManagement } from '@/i18n/locales/en/management';
import { management as myManagement } from '@/i18n/locales/my/management';
import { erp as enErp } from '@/i18n/locales/en/erp';
import { erp as myErp } from '@/i18n/locales/my/erp';
import {
  applyLanguageToDocument,
  DEFAULT_LANGUAGE,
  isLanguage,
  LANGUAGE_STORAGE_KEY,
  type Language
} from '@/i18n/config';

/**
 * Almost everything lives in one namespace. The app is a single bundle with no
 * route-level code splitting, so per-namespace lazy loading would add wiring
 * without saving a request.
 *
 * The settings screens are the exception, and not for loading reasons. Typing
 * `t()` against the catalogue turns it into a union of every key, and
 * `translation` is at the size where that union stops being representable —
 * past it, keys four levels deep start being rejected in files nobody touched.
 * A second namespace is a second, small union, so these screens can have their
 * strings without spending the last of that budget. Anything added here from
 * now on should go the same way.
 */
export const resources = {
  en: { translation: en, settings: enSettings, management: enManagement, erp: enErp },
  my: { translation: my, settings: mySettings, management: myManagement, erp: myErp }
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ['en', 'my'],
    // Burmese has no plural inflection and the English copy here is short, so
    // a missing key should surface the English string rather than a raw key in
    // front of a user at the counter.
    fallbackNS: 'translation',
    defaultNS: 'translation',
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage']
    },
    interpolation: {
      // React escapes for us; double-escaping turns "R&D" into "R&amp;D".
      escapeValue: false
    },
    returnNull: false
  });

applyLanguageToDocument(isLanguage(i18n.language) ? i18n.language : DEFAULT_LANGUAGE);
i18n.on('languageChanged', language => {
  if (isLanguage(language)) applyLanguageToDocument(language);
});

/** Changes the active language and persists it for the next visit. */
export function setLanguage(language: Language) {
  void i18n.changeLanguage(language);
}

export default i18n;
