/**
 * The languages the app ships in.
 *
 * `nativeName` is what the switcher shows: someone looking for Burmese scans
 * for "မြန်မာ", not for the English word "Burmese", so the list is written in
 * each language rather than translated into the current one.
 */
export const LANGUAGES = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'my', nativeName: 'မြန်မာ', englishName: 'Myanmar' }
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: Language = 'en';

/** Must match the key read by the boot script in index.html. */
export const LANGUAGE_STORAGE_KEY = 'pulseone-language';

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some(language => language.code === value);
}

/**
 * Mirrors the language onto <html> so CSS and screen readers agree with the UI.
 * The `lang` attribute is what drives the Myanmar font stack in index.css, and
 * it is also what tells a reader to switch voices mid-page.
 */
export function applyLanguageToDocument(language: Language) {
  document.documentElement.lang = language;
}
