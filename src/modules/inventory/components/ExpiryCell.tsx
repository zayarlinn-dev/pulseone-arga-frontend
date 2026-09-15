import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { lotService } from '@/services';
import { cn, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/userStore';
import type { ExpiryStatus } from '@/types/models';

/** Badge colour per expiry band. `ok` and `none` get no badge at all. */
const statusVariant: Record<ExpiryStatus, 'destructive' | 'warning' | null> = {
  expired: 'destructive',
  critical: 'destructive',
  warning: 'warning',
  ok: null,
  none: null
};

interface ExpiryCellProps {
  /** The batch row this cell belongs to. The lot is widened from it server-side. */
  itemBatchId: number;
  /** `yyyy-MM-dd`, or null for a batch with no printed expiry. */
  expiryDate?: string | null;
  expiryStatus: ExpiryStatus;
  daysToExpiry?: number | null;
  /** Earliest date the correction will accept — the day the stock arrived. */
  batchDate?: string | null;
  /**
   * Replaces the default status badge. The expiry report words the same bands
   * differently — "12d ago" where this says "expired" — and a cell shared
   * between screens should not quietly retranslate the one it was dropped into.
   */
  badge?: ReactNode;
  className?: string;
}

/**
 * An expiry date that can be corrected where it is read.
 *
 * A wrong expiry date is nearly always spotted on a screen like this one, with
 * the carton in somebody's hand — not on the goods received note that first
 * recorded it, which by then is weeks old and may have been paid. Sending the
 * user off to find that document is how a known-wrong date survives on the
 * shelf, and a wrong date is not cosmetic: under FEFO it decides which stock
 * goes out next, and a date in the past makes the batch unsellable.
 *
 * So the cell reads as an ordinary date until it is clicked. Users without the
 * privilege get exactly the text they had before — no disabled control hinting
 * at something they cannot do.
 *
 * The correction lands on every batch of the same delivery, in whatever stores
 * hold it, because they all came off one carton with one printed date. The
 * toast says how many rows moved rather than staying silent about it, since a
 * change that quietly touched three stores should not look like it touched one.
 */
export function ExpiryCell({
  itemBatchId,
  expiryDate,
  expiryStatus,
  daysToExpiry,
  batchDate,
  badge,
  className
}: ExpiryCellProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const canEdit = useAuthStore(state => state.can('update-batch-expiry'));

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(expiryDate ?? '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Reopening starts from whatever is on file now, not from the last thing that
  // was typed and abandoned.
  useEffect(() => {
    if (editing) {
      setDraft(expiryDate ?? '');
      inputRef.current?.focus();
    }
  }, [editing, expiryDate]);

  const correct = useMutation({
    mutationFn: (value: string | null) => lotService.updateExpiry(itemBatchId, value),
    onSuccess: result => {
      setEditing(false);
      toast.success(
        result.updated > 1
          ? t('inventory.batches.expirySavedAcrossStores', { count: result.updated })
          : t('inventory.batches.expirySaved')
      );
      // A corrected date changes the issue queue in every batch panel and can
      // drop the row off the expiry report altogether, so both go rather than
      // being left to look right until the next navigation.
      queryClient.invalidateQueries({ queryKey: ['stock-batches'] });
      queryClient.invalidateQueries({ queryKey: ['expiry-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['lot-trace'] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message)
  });

  const save = () => {
    const next = draft.trim() ? draft : null;
    // Nothing typed and nothing on file is a cancel, not a correction to null.
    if (next === (expiryDate ?? null)) {
      setEditing(false);
      return;
    }
    correct.mutate(next);
  };

  if (editing) {
    return (
      <span className={cn('flex items-center gap-1', className)}>
        <DateField
          ref={inputRef}
          value={draft}
          min={batchDate ?? undefined}
          disabled={correct.isPending}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={event => {
            // A date cell is small enough that reaching for the buttons is the
            // slow path; both keys do what they do in every other grid.
            if (event.key === 'Enter') {
              event.preventDefault();
              save();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setEditing(false);
            }
          }}
          className="h-7 w-36 text-xs"
          aria-label={t('inventory.batches.expiryEditLabel')}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7"
          disabled={correct.isPending}
          onClick={save}
          aria-label={t('common.action.save')}
        >
          {correct.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-7"
          disabled={correct.isPending}
          onClick={() => setEditing(false)}
          aria-label={t('common.action.cancel')}
        >
          <X className="size-3.5" />
        </Button>
      </span>
    );
  }

  const variant = statusVariant[expiryStatus];
  const statusBadge =
    badge ??
    (variant && (
      <Badge variant={variant}>
        {expiryStatus === 'expired'
          ? t('inventory.batches.expired')
          : t('inventory.batches.inDays', { days: daysToExpiry ?? 0 })}
      </Badge>
    ));

  const label = expiryDate ? (
    <>
      {formatDate(expiryDate)}
      {statusBadge}
    </>
  ) : (
    <span className="text-muted-foreground">{t('inventory.batches.noExpiry')}</span>
  );

  if (!canEdit) {
    return <span className={cn('flex items-center gap-2', className)}>{label}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={t('inventory.batches.expiryEditHint')}
      className={cn(
        'group flex items-center gap-2 rounded-sm text-left',
        'hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        className
      )}
    >
      {label}
      {/*
        Hidden until the row is hovered: a pencil on every line of a stock
        report turns a list of dates into a list of buttons, and the dates are
        what the screen is for. It stays visible to the keyboard, which has no
        hover to reveal it with.
      */}
      <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
    </button>
  );
}
