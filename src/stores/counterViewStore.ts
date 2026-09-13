import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * How the counter draws itself.
 *
 * `touch` is a till on a tablet: tiles, steppers and an on-screen pad, sized
 * for a fingertip. `desktop` is the same till on a PC with a keyboard and a
 * mouse, where those same controls are in the way — a pointer hits a 28px
 * target fine, and typing "500" beats tapping five/zero/zero.
 */
export type CounterViewMode = 'touch' | 'desktop';

/**
 * What the user asked for, which is not the same thing as what they get.
 *
 * `auto` is the default and the honest answer almost always: a coarse pointer
 * means a finger and a finger needs finger-sized targets. It also follows a
 * device that is both — a detachable tablet answers coarse undocked and fine on
 * its keyboard — which no stored choice can do.
 *
 * The two explicit values exist for the cases the query gets wrong: a kiosk
 * driven by a touch overlay the browser reports as a mouse, or a tablet used
 * with a stylus by someone who wants the dense layout anyway.
 */
export type CounterViewPreference = 'auto' | CounterViewMode;

/** Matches a finger rather than a pointing device. */
const COARSE_POINTER_QUERY = '(pointer: coarse)';

const STORAGE_KEY = 'pulseone-counter-view';

interface CounterViewState {
  preference: CounterViewPreference;
  setPreference: (preference: CounterViewPreference) => void;
}

export const useCounterViewStore = create<CounterViewState>()(
  persist(
    set => ({
      preference: 'auto',
      setPreference: preference => set({ preference })
    }),
    { name: STORAGE_KEY }
  )
);

/**
 * Resolves the preference against the device, the way resolveTheme does for
 * "system". Components render from this and never from the raw preference, so
 * "auto" can never leak into a layout decision.
 */
export function useCounterViewMode(): CounterViewMode {
  const preference = useCounterViewStore(state => state.preference);
  const coarsePointer = useMediaQuery(COARSE_POINTER_QUERY);

  if (preference !== 'auto') return preference;
  return coarsePointer ? 'touch' : 'desktop';
}
