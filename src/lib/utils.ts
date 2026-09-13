import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
// The i18next singleton directly rather than '@/i18n', which would import the
// catalogues back through this module.
import i18n from 'i18next';

/** Merges Tailwind classes, letting later classes win over earlier conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * The BCP-47 tag the Intl formatters should use for the language now active.
 *
 * Burmese is pinned to Latin digits with `-u-nu-latn`: CLDR's default numbering
 * system for `my` is Myanmar digits, which would render an invoice total as
 * "၁,၂၃၄". Staff cross-check those figures against printed receipts, bank
 * slips and the backend's own responses, all of which use Latin digits, so the
 * month names translate but the numerals deliberately do not.
 */
export function getIntlLocale(): string {
  return i18n.resolvedLanguage === 'my' ? 'my-u-nu-latn' : 'en-GB';
}

/**
 * How the kyat is written, per language.
 *
 * Kept here rather than in the translation catalogues because formatCurrency is
 * a plain function called from render paths that run before i18next has
 * finished initialising; a missing key would print as `common.currency` in the
 * middle of an invoice total. Reading the resolved language and falling back to
 * English cannot fail that way.
 *
 * MMK is the ISO code and is right on an export or a bank instruction, but it
 * is not what anyone at a counter in Yangon reads, so the screens say Ks and
 * ကျပ်.
 */
const CURRENCY_SUFFIX: Record<string, string> = {
  en: 'Ks',
  my: 'ကျပ်'
};

/** The kyat as the current language writes it. */
export function currencySuffix(): string {
  return CURRENCY_SUFFIX[i18n.resolvedLanguage ?? 'en'] ?? CURRENCY_SUFFIX.en;
}

/**
 * Formats a number as an amount of money — "1,200 Ks", "၁,၂၀၀ ကျပ်".
 *
 * The digits are fixed to en-US rather than the active language: this is money,
 * and the grouping and decimal marks have to read the same on a receipt no
 * matter who printed it. The currency word does follow the language, because
 * that part is read rather than compared.
 *
 * The unit is on by default and on purpose. Every figure in this system is in
 * kyat, and a bare 1,200 next to a quantity of 1,200 is two numbers a tired
 * reader has to tell apart from context.
 *
 * `withUnit: false` is for the few places where the unit is already stated
 * elsewhere — an axis whose ticks would repeat it five times, or a field whose
 * label carries it.
 */
export function formatCurrency(
  value: number | string | null | undefined,
  { withUnit = true }: { withUnit?: boolean } = {}
): string {
  const amount = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  const digits = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number.isNaN(amount) ? 0 : amount);

  return withUnit ? `${digits} ${currencySuffix()}` : digits;
}

/**
 * A money figure short enough for a chart axis — 1,250,000 as "1.3M".
 *
 * Axis ticks, not values a reader works from: the unit is stated once on the
 * chart and the exact number is in the tooltip and the table view. Negatives
 * keep their sign, because a profit axis crosses zero.
 */
export function formatCompactMoney(value: number): string {
  const magnitude = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (magnitude >= 1_000_000) return `${sign}${(magnitude / 1_000_000).toFixed(1)}M`;
  if (magnitude >= 1_000) return `${sign}${Math.round(magnitude / 1_000)}k`;
  return String(value);
}

/** Formats an ISO timestamp as a short local date. Empty input yields "-". */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(getIntlLocale(), { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Completed years between a date of birth and today, or null when the input is
 * unusable. Mirrors the backend's yearsSince so the age shown while typing
 * matches the age stored on save.
 */
export function calculateAge(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  // Subtract one if this year's birthday has not happened yet.
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years--;

  if (years < 0 || years > 150) return null;
  return years;
}

/**
 * Rebuilt per call rather than held in a module constant: the constant was
 * created once at import time and would have kept formatting in English for
 * the rest of the session after a language switch. Intl caches its own
 * internals, so the cost is a lookup, not a re-parse.
 */
function getRelativeFormatter() {
  return new Intl.RelativeTimeFormat(getIntlLocale(), { numeric: 'auto' });
}

/** How each unit divides into the next, largest last. */
const RELATIVE_DIVISIONS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.35],
  ['month', 12],
  ['year', Number.POSITIVE_INFINITY]
];

/**
 * "4 minutes ago" — for places where how long ago matters and the exact
 * timestamp would be more precision than the reader wants.
 */
export function formatRelativeTime(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  let delta = (date.getTime() - Date.now()) / 1000;
  for (const [unit, size] of RELATIVE_DIVISIONS) {
    if (Math.abs(delta) < size) return getRelativeFormatter().format(Math.round(delta), unit);
    delta /= size;
  }
  return getRelativeFormatter().format(Math.round(delta), 'year');
}

/** Formats an ISO timestamp as a local date and time. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(getIntlLocale(), {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
