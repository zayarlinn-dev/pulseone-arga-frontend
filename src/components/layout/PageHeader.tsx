import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Action buttons rendered on the right, e.g. "New Patient". */
  actions?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...'
}: PageHeaderProps) {
  return (
    <div className="mb-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {/* Actions wrap onto their own line on a phone and stretch to fill it,
            rather than crushing the title into two words per line. */}
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 *:flex-1 sm:w-auto sm:*:flex-none">
            {actions}
          </div>
        )}
      </div>

      {onSearchChange && (
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue ?? ''}
            onChange={event => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
      )}
    </div>
  );
}
