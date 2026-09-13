import { useEffect, useState } from 'react';

/**
 * Tracks a CSS media query from JS. Needed where a breakpoint changes
 * behaviour rather than only styling — the sidebar renders label tooltips on a
 * desktop rail but not in the full-width mobile drawer.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const handleChange = () => setMatches(media.matches);

    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
