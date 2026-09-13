import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { controlEvent, scalar, writeValue } from '@/lib/form-events';
import { cn } from '@/lib/utils';

/**
 * Radix reserves `""` for "nothing selected" and rejects it as an item value,
 * but nearly every form here opens with a blank `Select a ...` option. That
 * option travels through the listbox under this sentinel and is unwrapped
 * again on the way back out.
 */
const BLANK = '__pulseone_blank__';

interface Choice {
  value: string;
  label: string;
  disabled: boolean;
}

/**
 * Option labels are plain text, but they arrive split across expressions
 * (`{room.roomName} · {room.roomType}`), so the pieces are joined back up.
 */
function readText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(readText).join('');
  if (React.isValidElement(node)) {
    return readText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

/** Flattens `<option>` / `<optgroup>` children into the rows the listbox draws. */
function readChoices(children: React.ReactNode, into: Choice[] = []): Choice[] {
  React.Children.forEach(children, child => {
    if (!React.isValidElement(child)) return;

    if (child.type === 'option') {
      const { value, children: body, disabled } = child.props as React.ComponentProps<'option'>;
      const label = readText(body);
      into.push({
        // A bare `<option>Text</option>` submits its text, same as the browser does.
        value: value === undefined ? label : String(value),
        label,
        disabled: Boolean(disabled)
      });
      return;
    }

    if (child.type === 'optgroup' || child.type === React.Fragment) {
      readChoices((child.props as { children?: React.ReactNode }).children, into);
    }
  });

  return into;
}

const noop = () => {};

/**
 * The app's dropdown: a themed listbox in front of a hidden native `<select>`.
 *
 * The browser draws a native `<select>`'s popup itself, ignoring the theme —
 * on the dark surface that came out as grey-on-grey and barely readable. The
 * popup is ours now, but the element underneath is still a real `<select>`
 * carrying `name`, the ref and the value, so `register(...)`, `reset(...)` and
 * plain `value`/`onChange` all keep working exactly as they did and callers
 * still pass `<option>` children.
 */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(
  (
    {
      className,
      children,
      disabled,
      id,
      onChange,
      onBlur,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      ...props
    },
    forwardedRef
  ) => {
    const nodeRef = React.useRef<HTMLSelectElement | null>(null);
    // Seeded from the props so a pre-filled field paints its label on the first
    // frame; from then on the hidden select below is what it reads.
    const [selected, setSelected] = React.useState(() => scalar(props.value ?? props.defaultValue));
    const [open, setOpen] = React.useState(false);

    const setRefs = React.useCallback(
      (node: HTMLSelectElement | null) => {
        nodeRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef]
    );

    /*
     * The hidden select stays the source of truth. `register` writes to it
     * through the ref and `reset` re-fills it, neither of which raises an
     * event, so reading it back after every render is the only sync that
     * catches those alongside ordinary controlled updates.
     */
    React.useEffect(() => {
      const node = nodeRef.current;
      if (node && node.value !== selected) setSelected(node.value);
    });

    const choices = readChoices(children);
    const current = choices.find(choice => choice.value === selected);

    const commit = (next: string) => {
      const node = nodeRef.current;
      if (!node) return;

      writeValue(node, next);
      setSelected(next);
      onChange?.(controlEvent(node, 'change'));
    };

    const handleOpenChange = (nextOpen: boolean) => {
      setOpen(nextOpen);
      // Closing the listbox is this control's blur: it is what marks the field
      // touched for react-hook-form's onBlur validation.
      if (!nextOpen && nodeRef.current) onBlur?.(controlEvent(nodeRef.current, 'blur'));
    };

    return (
      <SelectPrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        value={selected === '' ? BLANK : selected}
        onValueChange={next => commit(next === BLANK ? '' : next)}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-sm transition-colors',
            'focus:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
            'data-[state=open]:border-ring data-[state=open]:ring-2 data-[state=open]:ring-ring/30',
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Nothing chosen yet reads as a prompt rather than as an answer.
            selected === '' && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{current?.label ?? ''}</span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className={cn(
              'relative z-50 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-lg',
              'max-h-72 min-w-[var(--radix-select-trigger-width)]',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0'
            )}
          >
            <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center bg-popover">
              <ChevronUp className="h-4 w-4 opacity-60" />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport className="max-h-[min(18rem,var(--radix-select-content-available-height))] p-1">
              {choices.map((choice, index) => (
                <SelectPrimitive.Item
                  key={`${choice.value}-${index}`}
                  value={choice.value === '' ? BLANK : choice.value}
                  disabled={choice.disabled}
                  className={cn(
                    // Roomier rows on touch screens, where the list is scrolled
                    // with the same finger that has to land on one option.
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2.5 pl-2 pr-8 text-sm outline-none sm:py-1.5',
                    'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
                    'data-[state=checked]:font-medium',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    choice.value === '' && 'text-muted-foreground'
                  )}
                >
                  <SelectPrimitive.ItemText>{choice.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center bg-popover">
              <ChevronDown className="h-4 w-4 opacity-60" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>

        {/*
          Kept in the DOM (display:none, never focusable) purely as the form
          control: the ref, the name and the submitted value live here.
        */}
        <select
          ref={setRefs}
          className="hidden"
          tabIndex={-1}
          aria-hidden
          disabled={disabled}
          onChange={noop}
          {...props}
        >
          {children}
        </select>
      </SelectPrimitive.Root>
    );
  }
);
NativeSelect.displayName = 'NativeSelect';

export { NativeSelect };
