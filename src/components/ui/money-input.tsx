import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from './input';
import { currencySuffix } from '@/lib/utils';
import { cn } from '@/lib/utils';

/**
 * An amount field that says what currency it is in.
 *
 * Every figure in this system is kyat, but a bare box next to a quantity box
 * does not say so, and the two are the same shape. The unit sits inside the
 * field rather than in the label because that is where the eye is when the
 * number is being typed — and because a label can scroll out of a long form
 * while the field cannot.
 *
 * It is display only: the value is still a plain number string, so nothing
 * downstream has to strip a currency word back out before parsing it.
 *
 * useTranslation is called for its subscription, not its `t` — without it the
 * suffix would keep the language the field first rendered in after a switch.
 */
const MoneyInput = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => {
    useTranslation();

    return (
      <span className="relative block">
        <Input
          ref={ref}
          inputMode="decimal"
          className={cn('pr-12 tabular-nums', className)}
          {...props}
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {currencySuffix()}
        </span>
      </span>
    );
  }
);
MoneyInput.displayName = 'MoneyInput';

export { MoneyInput };
