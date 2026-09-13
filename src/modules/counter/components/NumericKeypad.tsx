import { Delete } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface NumericKeypadProps {
  value: string;
  onChange: (next: string) => void;
  /** Rendered above the keys as one-tap amounts — usually cash denominations. */
  quickAmounts?: number[];
  onQuickAmount?: (amount: number) => void;
  className?: string;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '.'];

/**
 * The amount pad.
 *
 * A counter is often a touchscreen with no keyboard attached, and the mobile
 * soft keyboard covers the very total the operator is reading while they type
 * into it. So the amount is entered here instead: 56px keys, no focus to
 * manage, and the running change stays visible the whole time.
 *
 * It edits a string rather than a number on purpose — a half-typed "1200." has
 * to survive the next keystroke, and Number() would eat the trailing dot.
 */
export function NumericKeypad({
  value,
  onChange,
  quickAmounts,
  onQuickAmount,
  className
}: NumericKeypadProps) {
  const { t } = useTranslation();
  const press = (key: string) => {
    if (key === '.' && value.includes('.')) return;
    // A lone leading zero is replaced rather than appended to, so tapping 5 on
    // an untouched pad reads 5 and not 05.
    if (value === '0' && key !== '.') return onChange(key);
    onChange(value + key);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {quickAmounts && quickAmounts.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map(amount => (
            <button
              key={amount}
              type="button"
              onClick={() => onQuickAmount?.(amount)}
              className="h-11 rounded-lg border bg-card text-sm font-medium tabular-nums transition-colors hover:bg-accent active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {amount >= 1000 ? `${amount / 1000}k` : amount}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {KEYS.map(key => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            className="h-14 rounded-lg border bg-card text-lg font-medium tabular-nums transition-colors hover:bg-accent active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {key}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange('')}
          className="h-12 rounded-lg border bg-card text-sm font-medium transition-colors hover:bg-accent active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t('common.action.clear')}
        </button>
        <button
          type="button"
          onClick={() => onChange(value.slice(0, -1))}
          aria-label={t('counter.keypad.deleteDigit')}
          className="flex h-12 items-center justify-center rounded-lg border bg-card transition-colors hover:bg-accent active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
