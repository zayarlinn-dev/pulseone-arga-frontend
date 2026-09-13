import { DayPicker, type ChevronProps, type DropdownProps } from 'react-day-picker';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import { NativeSelect } from './native-select';
import { cn, getIntlLocale } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/** react-day-picker asks for one chevron component and says which way to point it. */
function CalendarChevron({ orientation, className }: ChevronProps) {
  const Icon =
    orientation === 'left'
      ? ChevronLeft
      : orientation === 'right'
        ? ChevronRight
        : orientation === 'up'
          ? ChevronUp
          : ChevronDown;
  return <Icon className={cn('h-4 w-4', className)} />;
}

/**
 * The month and year pickers in the caption.
 *
 * The stock one is a bare `<select>`, which is the browser-drawn popup this
 * whole control exists to get away from, so it goes through `NativeSelect` like
 * every other dropdown in the app.
 */
function CalendarDropdown({ options = [], value, onChange, disabled, ...props }: DropdownProps) {
  return (
    <NativeSelect
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-label={props['aria-label']}
      className="h-7 w-auto border-transparent px-2 text-sm font-medium shadow-none hover:bg-accent"
    >
      {options.map(option => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </NativeSelect>
  );
}

/**
 * The month grid behind every date field.
 *
 * react-day-picker ships a stylesheet, but importing it would drop a second,
 * differently-tokened palette into the bundle and it would need overriding
 * anyway; the class map below dresses the same markup in the app's own tokens.
 */
/**
 * Month, weekday and dropdown labels for a language react-day-picker cannot
 * name itself.
 *
 * The library takes its month and weekday names from a date-fns locale, and
 * date-fns has no Burmese one — so under `my` the caption would stay
 * "September" while every label around it was translated. Intl does know the
 * language, so these formatters hand react-day-picker the names it is missing.
 * English keeps the library's own output, which the class map was laid out
 * against.
 */
function getMyanmarFormatters() {
  const locale = getIntlLocale();

  return {
    formatCaption: (month: Date) =>
      month.toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
    formatMonthDropdown: (month: Date) =>
      month.toLocaleDateString(locale, { month: 'long' }),
    // Narrow rather than short: the grid columns are 36px, and a Burmese
    // weekday name spelled out overflows every one of them.
    formatWeekdayName: (weekday: Date) =>
      weekday.toLocaleDateString(locale, { weekday: 'narrow' })
  };
}

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const { i18n } = useTranslation();
  const formatters = i18n.resolvedLanguage === 'my' ? getMyanmarFormatters() : undefined;

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'relative flex flex-col gap-4',
        month: 'space-y-2',
        // The nav buttons sit over the caption row, so it keeps its right edge clear.
        month_caption: 'flex h-8 items-center pr-16',
        caption_label: 'text-sm font-medium',
        dropdowns: 'flex items-center gap-1',
        dropdown_root: 'relative',
        nav: 'absolute right-0 top-0 flex h-8 items-center gap-1',
        button_previous:
          'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40',
        button_next:
          'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-40',
        month_grid: 'w-full border-collapse',
        weekday: 'w-9 pb-1 text-[0.7rem] font-normal uppercase tracking-wide text-muted-foreground',
        day: 'p-0.5 text-center',
        day_button:
          'mx-auto flex h-8 w-8 items-center justify-center rounded-md text-sm tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        // The state classes land on the cell, so they reach in for the button.
        selected:
          '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
        today: '[&>button]:ring-1 [&>button]:ring-primary/60',
        outside: 'text-muted-foreground/40',
        disabled: 'text-muted-foreground/30 [&>button]:pointer-events-none',
        hidden: 'invisible',
        footer: 'pt-2 text-center text-xs text-muted-foreground',
        ...classNames
      }}
      components={{ Chevron: CalendarChevron, Dropdown: CalendarDropdown }}
      formatters={formatters}
      {...props}
    />
  );
}
