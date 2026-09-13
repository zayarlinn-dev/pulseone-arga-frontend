import { useTranslation } from 'react-i18next';
import { Hand, Monitor, Moon, Sun, Wand2 } from 'lucide-react';
import { useThemeStore, type Theme } from '@/stores/themeStore';
import { useCounterViewStore, type CounterViewPreference } from '@/stores/counterViewStore';
import { useAuthStore } from '@/stores/userStore';
import { setLanguage } from '@/i18n';
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGES, type Language } from '@/i18n/config';
import { cn } from '@/lib/utils';

interface Choice<T> {
  value: T;
  label: string;
  /** Omitted by the language row, where the native name is the whole signal. */
  icon?: typeof Sun;
}

interface SegmentedProps<T extends string> {
  label: string;
  hint: string;
  choices: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * One preference as a row of buttons rather than a select.
 *
 * The options fit across the menu, and showing all of them means the current
 * one is visible without opening anything — which is the whole reason someone
 * comes here, since these settings are ones you check more often than you
 * change.
 */
function Segmented<T extends string>({ label, hint, choices, value, onChange }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="px-2 py-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      {/*
        Column count follows the row rather than being fixed at three: the
        language row has two options, and stretching them across a three-column
        track would leave a gap that reads as a missing third language.
      */}
      <div
        className="mt-1.5 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${choices.length}, minmax(0, 1fr))` }}
      >
        {choices.map(choice => {
          const Icon = choice.icon;
          const active = value === choice.value;

          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => onChange(choice.value)}
              aria-pressed={active}
              className={cn(
                // min-height rather than a fixed height, and wrapping allowed:
                // a Burmese label is longer than the English one it replaces
                // and used to spill out of the button onto the hint below.
                'flex min-h-8 items-center justify-center gap-1.5 rounded-md border px-1.5 py-1',
                'text-center text-xs font-medium leading-tight transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
              {choice.label}
            </button>
          );
        })}
      </div>

      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p>
    </div>
  );
}

/**
 * The settings block inside the profile menu.
 *
 * These are per-device rather than per-account — they describe the screen in
 * front of you, not who you are — so they live in browser storage and are
 * reachable from every page rather than sitting behind a settings route nobody
 * would find twice. Language is here for the same reason: a shared counter
 * terminal is set once by whoever works at it, not carried between accounts.
 */
export function AppSettings() {
  const { t, i18n } = useTranslation();
  const theme = useThemeStore(state => state.theme);
  const setTheme = useThemeStore(state => state.setTheme);
  const counterPreference = useCounterViewStore(state => state.preference);
  const setCounterPreference = useCounterViewStore(state => state.setPreference);
  const can = useAuthStore(state => state.can);
  // Only offered to whoever can actually open the counter — a setting for a
  // screen you cannot reach is noise in a menu everyone opens. Read at render
  // rather than subscribed to, which is safe here because the menu is mounted
  // fresh each time it opens.
  const showCounterLayout = can('create-invoice');

  const themeChoices: Choice<Theme>[] = [
    { value: 'system', label: t('shell.settings.themeSystem'), icon: Monitor },
    { value: 'light', label: t('shell.settings.themeLight'), icon: Sun },
    { value: 'dark', label: t('shell.settings.themeDark'), icon: Moon }
  ];

  const counterChoices: Choice<CounterViewPreference>[] = [
    { value: 'auto', label: t('shell.settings.counterAuto'), icon: Wand2 },
    { value: 'touch', label: t('shell.settings.counterTouch'), icon: Hand },
    { value: 'desktop', label: t('shell.settings.counterDesktop'), icon: Monitor }
  ];

  // Each language names itself. Someone hunting for Burmese looks for "မြန်မာ",
  // and they are by definition looking at a UI they cannot read yet.
  const languageChoices: Choice<Language>[] = LANGUAGES.map(language => ({
    value: language.code,
    label: language.nativeName
  }));

  // i18next reports whatever the detector resolved, which can be a regional tag
  // such as "en-GB" that no button matches.
  const activeLanguage = isLanguage(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LANGUAGE;

  return (
    <div className="border-b py-1">
      <p className="px-2 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t('shell.settings.title')}
      </p>

      <Segmented
        label={t('shell.settings.language')}
        hint={t('shell.settings.languageHint')}
        choices={languageChoices}
        value={activeLanguage}
        onChange={setLanguage}
      />

      <Segmented
        label={t('shell.settings.appearance')}
        hint={t('shell.settings.appearanceHint')}
        choices={themeChoices}
        value={theme}
        onChange={setTheme}
      />

      {showCounterLayout && (
        <Segmented
          label={t('shell.settings.counterLayout')}
          hint={t('shell.settings.counterHint')}
          choices={counterChoices}
          value={counterPreference}
          onChange={setCounterPreference}
        />
      )}
    </div>
  );
}
