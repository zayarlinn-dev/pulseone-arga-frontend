import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { setLanguage } from '@/i18n';
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGES } from '@/i18n/config';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
  /** Inverts the colours for the dark brand panel on the login screen. */
  tone?: 'default' | 'onBrand';
}

/**
 * A standalone language switcher for screens outside the app shell.
 *
 * Inside the shell the setting lives in the profile menu, but the login page
 * has no profile menu — and it is the one screen where the control matters
 * most, because someone who cannot read the English form has no way past it
 * otherwise. So the choice is on screen rather than behind a menu.
 */
export function LanguageToggle({ className, tone = 'default' }: LanguageToggleProps) {
  const { t, i18n } = useTranslation();

  const active = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE;
  const onBrand = tone === 'onBrand';

  return (
    <div
      role="group"
      aria-label={t('shell.settings.language')}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border p-1',
        onBrand ? 'border-white/25 bg-white/10' : 'border-border bg-card',
        className
      )}
    >
      <Languages
        aria-hidden
        className={cn('ml-1.5 h-3.5 w-3.5', onBrand ? 'text-white/70' : 'text-muted-foreground')}
      />

      {LANGUAGES.map(language => {
        const selected = language.code === active;

        return (
          <button
            key={language.code}
            type="button"
            onClick={() => setLanguage(language.code)}
            aria-pressed={selected}
            // The button names itself in its own language; the accessible name
            // adds the English name so a screen reader announcing in English
            // does not read "မြန်မာ" out of a Latin voice.
            aria-label={language.englishName}
            lang={language.code}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? onBrand
                  ? 'bg-white text-slate-900'
                  : 'bg-primary text-primary-foreground'
                : onBrand
                  ? 'text-white/75 hover:text-white'
                  : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {language.nativeName}
          </button>
        );
      })}
    </div>
  );
}
