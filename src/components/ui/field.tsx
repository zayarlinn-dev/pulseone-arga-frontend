import type { ReactNode } from 'react';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  /** Id of the control this label points at. */
  htmlFor?: string;
  /** Validation message from react-hook-form; replaces the hint when present. */
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Label + control + message, the layout every form row in this app repeats.
 *
 * The message slot shows the validation error when there is one and the hint
 * otherwise, so a field never grows or shrinks as the user fixes it.
 */
export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
