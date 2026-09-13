import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RadioCardProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  label: string;
  description?: string;
  icon?: LucideIcon;
}

/**
 * A radio button rendered as a selectable card.
 *
 * For a short, meaningful set of choices — how a patient arrived, their gender —
 * one click on a visible option beats opening a select and reading a list. The
 * input stays native and hidden, so `{...register('field')}` and keyboard arrow
 * navigation both work unchanged.
 */
const RadioCard = React.forwardRef<HTMLInputElement, RadioCardProps>(
  ({ className, label, description, icon: Icon, ...props }, ref) => (
    <label
      className={cn(
        'relative flex cursor-pointer items-start gap-2.5 rounded-lg border border-input p-3 transition-colors',
        'hover:bg-accent/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40',
        'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
        className
      )}
    >
      <input ref={ref} type="radio" className="peer sr-only" {...props} />

      {/* Stands in for the hidden input so the checked state stays visible. */}
      <span
        aria-hidden
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-input peer-checked:border-[5px] peer-checked:border-primary"
      />

      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium leading-tight">
          {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </label>
  )
);
RadioCard.displayName = 'RadioCard';

export { RadioCard };
