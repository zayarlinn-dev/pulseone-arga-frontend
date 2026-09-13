import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react';
import { Button } from './button';
import { cn, formatRelativeTime } from '@/lib/utils';

interface DraftNoticeProps {
  /** When the waiting draft was saved. Nothing renders without one. */
  savedAt: Date | null;
  /** What is on offer, read as "You left <this> here 5 minutes ago." */
  description: string;
  onRestore: () => void;
  onDiscard: () => void;
  className?: string;
}

/**
 * Offers back a draft the form found waiting for it.
 *
 * Deliberately a decision rather than a notification: a restored count or
 * delivery looks exactly like a fresh one once it is on screen, so the person
 * posting it has to be the one who chose to bring it back.
 */
export function DraftNotice({
  savedAt,
  description,
  onRestore,
  onDiscard,
  className
}: DraftNoticeProps) {
  const { t } = useTranslation();

  if (!savedAt) return null;

  return (
    <div
      className={cn(
        'mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-info/40 bg-info/10 p-3',
        className
      )}
    >
      <History className="h-4 w-4 shrink-0 text-info" />
      {/* One interpolated sentence rather than three concatenated fragments:
          Burmese puts the time before the object and closes with the verb, so a
          sentence assembled in English order cannot be reordered. */}
      <p className="min-w-0 flex-1 text-sm">
        {t('common.draft.notice', { item: description, when: formatRelativeTime(savedAt) })}
      </p>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" onClick={onRestore}>
          {t('common.draft.restore')}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard}>
          {t('common.draft.startFresh')}
        </Button>
      </div>
    </div>
  );
}
