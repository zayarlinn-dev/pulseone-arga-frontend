import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

/** Must match the key read by the anti-flash script in index.html. */
export const THEME_STORAGE_KEY = 'pulseone-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

/**
 * Paints the resolved theme onto <html>. "system" is resolved here rather than
 * left to a CSS media query so that the variables and the `dark:` variant —
 * which keys off the class — can never disagree.
 */
export function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.classList.toggle('light', resolved === 'light');
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      theme: 'system',

      setTheme: theme => {
        applyTheme(theme);
        set({ theme });
      }
    }),
    {
      name: THEME_STORAGE_KEY,
      // The inline script already painted the class from storage; re-applying
      // on rehydrate covers the case where storage changed in another tab.
      onRehydrateStorage: () => state => state && applyTheme(state.theme)
    }
  )
);

/**
 * Keeps "system" honest: without this the class stays on whatever the OS was
 * when the tab loaded, because nothing re-evaluates the media query.
 */
export function watchSystemTheme() {
  const media = window.matchMedia(DARK_QUERY);
  const handleChange = () => {
    if (useThemeStore.getState().theme === 'system') applyTheme('system');
  };

  media.addEventListener('change', handleChange);
  return () => media.removeEventListener('change', handleChange);
}
