import { useCallback, useRef } from 'react';

/**
 * Idempotency keys for the forms that move stock.
 *
 * The problem is specific to this kind of screen. An operator submits a
 * dispense, the connection drops before the response arrives, and — seeing
 * nothing happen — they press the button again. Two requests reach the server,
 * the medicine is deducted twice, and nothing in the second request marks it as
 * a retry rather than a genuine second sale. Only the client knows which it is,
 * and an `Idempotency-Key` header is how it says so: the backend performs the
 * first one and replays its answer for every repeat of the same key.
 *
 * A key has to be stable for exactly as long as the submission is "the same
 * thing", and different the moment it is not. Both halves matter:
 *
 *   - Too volatile — a fresh key per click — and a retry counts as a new sale,
 *     which is the bug this exists to prevent.
 *   - Too stable — one key for the whole session — and a customer legitimately
 *     buying the same item twice gets the first receipt replayed and the second
 *     sale never happens.
 *
 * So a key is built from the payload plus a nonce that moves on once a
 * submission has completed. Press the button twice with the same form and both
 * requests carry one key; complete a sale and the next identical basket gets a
 * key of its own.
 */

/**
 * A short, stable digest of a payload — enough to tell one submission from
 * another inside a key without shipping the whole thing in a header.
 *
 * FNV-1a: a change detector, not a security primitive. Two different payloads
 * colliding would also need the same nonce, and the nonce moves on after every
 * completed submission.
 */
export function fingerprint(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export interface SubmissionKey {
  /**
   * The key for submitting this payload. Called twice with the same payload
   * before any `reset`, it returns the same key — which is what makes the
   * second press of the button a retry rather than a second document.
   */
  keyFor: (payload: unknown) => string;
  /**
   * Call once a submission has completed, from the mutation's `onSuccess`. The
   * next submission then gets a key of its own even if the form is identical.
   */
  reset: () => void;
}

/**
 * Idempotency keys for one form.
 *
 * `prefix` names the screen, which keeps two forms from colliding and makes a
 * key readable in a log: `dispense-…`, `grn-…`, `counter-…`.
 *
 * The nonce lives in a ref rather than in state on purpose. It is read inside
 * the mutation function, never rendered, and moving it to state would re-render
 * the whole form after every save for a value nothing displays.
 */
export function useSubmissionKey(prefix: string): SubmissionKey {
  const nonce = useRef(Date.now());

  const keyFor = useCallback(
    (payload: unknown) =>
      `${prefix}-${nonce.current.toString(36)}-${fingerprint(JSON.stringify(payload))}`,
    [prefix]
  );

  const reset = useCallback(() => {
    nonce.current = Date.now();
  }, []);

  return { keyFor, reset };
}
