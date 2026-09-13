import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FormSectionProps {
  id: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  /** Omit to render a section that is always open (the required ones). */
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
  /** How many of this section's fields carry a value, shown when collapsed. */
  filledCount?: number;
  /** Set when a validation error lives inside, so it cannot hide when closed. */
  hasError?: boolean;
  children: ReactNode;
}

/**
 * One titled block of the registration form.
 *
 * The optional sections collapse because a walk-in registration only needs the
 * first two: the desk should be able to finish in under a minute without
 * scrolling past emergency-contact and referral fields it will not fill in.
 */
export function FormSection({
  id,
  title,
  description,
  icon: Icon,
  collapsible = false,
  open = true,
  onToggle,
  filledCount = 0,
  hasError = false,
  children
}: FormSectionProps) {
  const heading = (
    <>
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          hasError ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-semibold leading-tight">{title}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
    </>
  );

  return (
    <Card id={id} className={cn('scroll-mt-20 overflow-hidden', hasError && 'border-destructive/60')}>
      {collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-content`}
          className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-accent/40"
        >
          {heading}
          {!open && filledCount > 0 && <Badge variant="info">{filledCount} filled</Badge>}
          {hasError && <Badge variant="destructive">check</Badge>}
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
      ) : (
        <div className="flex items-center gap-3 p-4">{heading}</div>
      )}

      {open && (
        <div id={`${id}-content`} className="border-t p-4">
          {children}
        </div>
      )}
    </Card>
  );
}
