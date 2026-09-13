import * as React from 'react';
import { cn } from '@/lib/utils';

interface CheckboxFieldProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  label: string;
  description?: string;
}

/**
 * Checkbox with its label, as one focusable row.
 *
 * It stays a native input so `{...register('isActive')}` works without a
 * Controller — the boolean flags on these forms are not worth the wrapper.
 */
const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ className, label, description, id, ...props }, ref) => (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-2.5 rounded-md border border-input px-3 py-2.5 transition-colors hover:bg-accent/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
        className
      )}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        {...props}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
    </label>
  )
);
CheckboxField.displayName = 'CheckboxField';

export { CheckboxField };
