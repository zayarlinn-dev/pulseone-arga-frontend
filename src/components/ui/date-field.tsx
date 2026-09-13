import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import { Calendar } from './calendar';
import { controlEvent, scalar, writeValue } from '@/lib/form-events';
import { cn } from '@/lib/utils';

/**
 * `yyyy-MM-dd[Thh:mm]` — the wire format of `<input type="date">` and
 * `type="datetime-local"` — as a local `Date`.
 *
 * Picked apart by hand on purpose: `new Date('2026-09-06')` is read as UTC and
 * lands on the 5th for anyone west of Greenwich.
 */
function parseValue(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value);
  if (!match) return undefined;
  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour ?? 0),
    Number(minute ?? 0)
  );
  return Number.isNaN(date.getTime()) ? undefined : date;
}

const pad = (value: number) => String(value).padStart(2, '0');

function formatValue(date: Date, withTime: boolean): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return withTime ? `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
}

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

interface TimeColumnProps {
  label: string;
  options: { value: number; label: string }[];
  value: number;
  open: boolean;
  onPick: (value: number) => void;
}

/** One scrolling column of the time panel, scrolled to its selection on open. */
function TimeColumn({ label, options, value, open, onPick }: TimeColumnProps) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const activeRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    const list = listRef.current;
    const active = activeRef.current;
    // Scrolled by hand rather than with scrollIntoView, which would drag the
    // dialog behind the popover along with it.
    if (open && list && active) {
      list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
    }
  }, [open, value]);

  return (
    // Stacked under the month grid the three columns share its width; beside it
    // they go back to being as narrow as two digits need.
    <div
      ref={listRef}
      className="flex-1 overflow-y-auto p-1 sm:w-14 sm:flex-none"
      role="group"
      aria-label={label}
    >
      {options.map(option => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            ref={active ? activeRef : undefined}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(option.value)}
            className={cn(
              'w-full rounded-md px-2 py-1.5 text-center text-sm tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground',
              active && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export interface DateFieldProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  /** Adds the time panel and switches the value to `yyyy-MM-ddThh:mm`. */
  withTime?: boolean;
}

/**
 * A date (or date and time) field with the app's own calendar.
 *
 * The field itself is a real `<input type="date">`, so typing a date still
 * works and `register(...)`, `value`/`onChange` and `min`/`max` behave exactly
 * as they always did. Only the browser's popup is replaced: its calendar button
 * is hidden and ours opens a themed one in its place.
 */
const DateField = React.forwardRef<HTMLInputElement, DateFieldProps>(
  ({ className, withTime = false, min, max, disabled, onChange, ...props }, forwardedRef) => {
    const { t } = useTranslation();
    const nodeRef = React.useRef<HTMLInputElement | null>(null);
    const [text, setText] = React.useState(() => scalar(props.value ?? props.defaultValue));
    const [open, setOpen] = React.useState(false);
    const [month, setMonth] = React.useState<Date | undefined>(undefined);

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        nodeRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef]
    );

    /*
     * The input is the source of truth. Typing reaches us through onChange, but
     * `reset(...)` and `setValue(...)` write to the node through the ref without
     * raising anything, so it is read back after every render as well.
     */
    React.useEffect(() => {
      const node = nodeRef.current;
      if (node && node.value !== text) setText(node.value);
    });

    const selected = parseValue(text);
    const lower = typeof min === 'string' ? parseValue(min) : undefined;
    const upper = typeof max === 'string' ? parseValue(max) : undefined;

    const commit = (next: Date) => {
      const node = nodeRef.current;
      if (!node) return;
      const value = formatValue(next, withTime);
      writeValue(node, value);
      setText(value);
      onChange?.(controlEvent(node, 'change'));
    };

    // Time edits before a day is chosen hang off today, the same day the
    // calendar opens on.
    const anchor = selected ?? new Date(new Date().setHours(0, 0, 0, 0));
    const hour24 = anchor.getHours();

    const setTime = (hours: number, minutes: number) => {
      commit(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate(), hours, minutes));
    };

    const handleOpenChange = (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) setMonth(selected ?? new Date());
    };

    const handleSelect = (day: Date | undefined) => {
      if (!day) return;
      commit(
        new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          withTime ? hour24 : 0,
          withTime ? anchor.getMinutes() : 0
        )
      );
      // A date-only field is finished the moment a day is clicked; a date and
      // time one still has the time panel to offer.
      if (!withTime) setOpen(false);
    };

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <div className="relative">
          <input
            ref={setRefs}
            type={withTime ? 'datetime-local' : 'date'}
            min={min}
            max={max}
            disabled={disabled}
            onChange={event => {
              setText(event.target.value);
              onChange?.(event);
            }}
            className={cn(
              'flex h-9 w-full rounded-md border border-input bg-transparent py-1 pl-3 pr-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50',
              // The browser's own button is what opens the unthemed popup.
              '[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none',
              className
            )}
            {...props}
          />

          <PopoverPrimitive.Trigger asChild>
            <button
              type="button"
              disabled={disabled}
              aria-label={t('common.calendar.open')}
              className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </PopoverPrimitive.Trigger>
        </div>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="end"
            sideOffset={6}
            className={cn(
              'z-50 w-auto max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0'
            )}
          >
            {/* The three time columns sit beside the month grid on a desktop.
                A phone has no room for both, so they drop underneath it. */}
            <div className="flex flex-col sm:flex-row">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={handleSelect}
                month={month ?? selected ?? new Date()}
                onMonthChange={setMonth}
                captionLayout="dropdown"
                startMonth={lower ?? new Date(new Date().getFullYear() - 100, 0)}
                endMonth={upper ?? new Date(new Date().getFullYear() + 10, 11)}
                disabled={[
                  ...(lower ? [{ before: lower }] : []),
                  ...(upper ? [{ after: upper }] : [])
                ]}
              />

              {withTime && (
                <div className="flex h-48 border-t border-border sm:h-[19.5rem] sm:border-l sm:border-t-0">
                  <TimeColumn
                    label={t('common.calendar.hour')}
                    open={open}
                    options={HOURS.map(hour => ({ value: hour, label: pad(hour) }))}
                    value={((hour24 + 11) % 12) + 1}
                    onPick={hour => setTime((hour % 12) + (hour24 >= 12 ? 12 : 0), anchor.getMinutes())}
                  />
                  <TimeColumn
                    label={t('common.calendar.minute')}
                    open={open}
                    options={MINUTES.map(minute => ({ value: minute, label: pad(minute) }))}
                    value={anchor.getMinutes()}
                    onPick={minute => setTime(hour24, minute)}
                  />
                  <TimeColumn
                    label={t('common.calendar.meridiem')}
                    open={open}
                    options={[
                      { value: 0, label: t('common.calendar.am') },
                      { value: 1, label: t('common.calendar.pm') }
                    ]}
                    value={hour24 >= 12 ? 1 : 0}
                    onPick={half => setTime((hour24 % 12) + half * 12, anchor.getMinutes())}
                  />
                </div>
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);
DateField.displayName = 'DateField';

export { DateField };
