import { getIntlLocale } from '@/lib/utils';

/** How the trend is bucketed. Mirrors the backend's `groupBy`. */
export type Grouping = 'day' | 'week' | 'month';

/**
 * A bucket key as a label.
 *
 * The key is always a bare `YYYY-MM-DD` — the first day of the bucket — so it
 * is picked apart by hand rather than handed to `new Date()`, which reads a
 * bare date as UTC and lands on the previous day for anyone west of Greenwich.
 * A trend whose first bar is labelled with the wrong day is a bug nobody
 * notices until they reconcile against a printed report.
 *
 * A month reads as "Sep 2026"; a day and a week both read as a date, because a
 * week is identified by the day it starts and inventing "W36" would make the
 * reader do the conversion.
 */
export function formatBucket(bucket: string, grouping: Grouping): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(bucket);
  if (!match) return bucket;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return date.toLocaleDateString(
    getIntlLocale(),
    grouping === 'month'
      ? { month: 'short', year: 'numeric' }
      : { day: '2-digit', month: 'short' }
  );
}

/**
 * The same label, shortened for an axis tick where a full one would collide
 * with its neighbours. Months are already short enough to keep the year.
 */
export function formatBucketTick(bucket: string, grouping: Grouping): string {
  const label = formatBucket(bucket, grouping);
  return grouping === 'month' ? label : label.slice(0, 6);
}

/**
 * A percentage as the reader's language writes it, to one decimal.
 *
 * Burmese is pinned to Latin digits by getIntlLocale for the same reason money
 * is: these figures get read next to printed reports that use them.
 */
export function formatPercent(value: number | string | null | undefined): string {
  const amount = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (Number.isNaN(amount)) return '-';
  return `${new Intl.NumberFormat(getIntlLocale(), { maximumFractionDigits: 1 }).format(amount)}%`;
}

/**
 * The move from one figure to the comparable one before it, as a percentage.
 *
 * Null when the earlier figure is zero: everything is "up ∞%" from nothing, and
 * printing a number there would invite a decision based on it. The caller shows
 * the period as having no comparison instead.
 */
export function percentChange(current: string, previous: string): number | null {
  const now = parseFloat(current);
  const before = parseFloat(previous);
  if (!Number.isFinite(now) || !Number.isFinite(before) || before === 0) return null;
  return ((now - before) / Math.abs(before)) * 100;
}

/**
 * A local calendar date as "YYYY-MM-DD".
 *
 * Built from the local parts rather than through `toISOString()`, which
 * converts to UTC first — in Yangon (UTC+6:30) that turns any time before
 * 06:30 into yesterday, so a report opened early in the morning would silently
 * ask for the wrong range.
 */
function isoLocalDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" for the date that many days before today. */
export function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoLocalDate(date);
}

/** Today as "YYYY-MM-DD". */
export function isoToday(): string {
  return isoLocalDate(new Date());
}
