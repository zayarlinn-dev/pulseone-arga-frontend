import { useCallback, useEffect, useRef, useState } from 'react';
import { draftKey, readDraft, removeDraft, writeDraft } from '@/lib/form-drafts';
import { useAuthStore } from '@/stores/userStore';

/** Long enough that a burst of typing writes once; short enough to survive a crash. */
const WRITE_DELAY_MS = 800;

interface FormDraftOptions<T> {
  /**
   * Whether the form is holding anything worth keeping. An untouched form has
   * to leave nothing behind, or every visit would offer an empty draft back.
   */
  enabled: boolean;
  /** Puts a restored draft back onto the form's state. */
  onRestore: (data: T) => void;
}

export interface FormDraft {
  /** When the waiting draft was written, or null when there is none to offer. */
  offeredAt: Date | null;
  /** When this session last autosaved, for the "draft saved" hint. */
  savedAt: Date | null;
  restore: () => void;
  discard: () => void;
  /** Wipes the draft and stops autosaving. Call after a successful submit. */
  clear: () => void;
}

/**
 * Keeps a long form recoverable across a refresh, a stray back button or a
 * closed tab.
 *
 * A draft found on disk is *offered*, never applied: silently repopulating a
 * form is how someone posts last week's stock count without noticing. Nothing
 * is written until that offer has been answered, so the empty form on screen
 * cannot overwrite the draft being offered.
 *
 * `state` makes a round trip through JSON, so keep it to plain data — strings,
 * numbers and arrays of those. A `Date` in there would come back as a string.
 */
export function useFormDraft<T>(
  name: string,
  state: T,
  { enabled, onRestore }: FormDraftOptions<T>
): FormDraft {
  const userId = useAuthStore(store => store.user?.userId);
  const key = userId == null ? null : draftKey(name, userId);

  const [offered, setOffered] = useState<{ data: T; savedAt: number } | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [stopped, setStopped] = useState(false);

  const stateRef = useRef(state);
  const onRestoreRef = useRef(onRestore);
  useEffect(() => {
    stateRef.current = state;
    onRestoreRef.current = onRestore;
  });

  useEffect(() => {
    if (!key) return;
    const found = readDraft<T>(key);
    if (found) setOffered({ data: found.data, savedAt: found.savedAt });
    setReady(true);
  }, [key]);

  /*
   * Serialising here rather than inside the effect gives it a dependency that
   * changes only when the form's contents actually change — an unrelated
   * re-render must not keep pushing the debounce out.
   */
  const payload = JSON.stringify(state);

  useEffect(() => {
    if (!key || !ready || offered || stopped) return;

    if (!enabled) {
      // The form is back to empty, so there is nothing left to come back to.
      removeDraft(key);
      setSavedAt(null);
      return;
    }

    const timer = setTimeout(() => {
      const written = writeDraft(key, stateRef.current);
      if (written) setSavedAt(written);
    }, WRITE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [key, ready, offered, stopped, enabled, payload]);

  const restore = useCallback(() => {
    if (!offered) return;
    onRestoreRef.current(offered.data);
    setOffered(null);
  }, [offered]);

  const discard = useCallback(() => {
    if (key) removeDraft(key);
    setOffered(null);
  }, [key]);

  const clear = useCallback(() => {
    // Stopping is state rather than a ref so the write effect re-runs and
    // cancels a debounce that is already in flight.
    setStopped(true);
    if (key) removeDraft(key);
    setOffered(null);
    setSavedAt(null);
  }, [key]);

  return {
    offeredAt: offered ? new Date(offered.savedAt) : null,
    savedAt: savedAt ? new Date(savedAt) : null,
    restore,
    discard,
    clear
  };
}
