/**
 * Draft storage for the long transactional forms.
 *
 * Drafts live in localStorage rather than on the server on purpose: a draft
 * here is scratch paper for the person filling the form in, not something the
 * hospital has any record of. Giving it a table and a status would put
 * half-entered stock on reports and drag permissions, list views and a cleanup
 * job along behind it.
 */

const PREFIX = 'pulseone:draft:';

/** A stock count from last week is noise, not a rescue. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface StoredDraft<T> {
  savedAt: number;
  data: T;
}

/**
 * Drafts are keyed per user: these forms get filled in on shared ward and
 * store-room machines, and the next person at the keyboard must not be handed
 * someone else's half-finished delivery.
 */
export function draftKey(name: string, userId: number): string {
  return `${PREFIX}${name}:${userId}`;
}

export function readDraft<T>(key: string): StoredDraft<T> | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const draft = JSON.parse(raw) as StoredDraft<T>;
    if (typeof draft?.savedAt !== 'number' || draft.data === undefined) {
      throw new Error('malformed draft');
    }
    if (Date.now() - draft.savedAt > MAX_AGE_MS) {
      removeDraft(key);
      return null;
    }
    return draft;
  } catch {
    // A draft that cannot be read is a draft that cannot be offered — most
    // likely written by an older version of the form.
    removeDraft(key);
    return null;
  }
}

/** Returns when the draft was written, or null if storage refused it. */
export function writeDraft<T>(key: string, data: T): number | null {
  const savedAt = Date.now();
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt, data } satisfies StoredDraft<T>));
    return savedAt;
  } catch {
    // Out of quota, or storage blocked in private browsing. Autosave is a
    // convenience and must never be the reason a form stops working.
    return null;
  }
}

export function removeDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* nothing worth doing */
  }
}

/** Drops every draft on this machine. Called on logout, for the reason above. */
export function clearAllDrafts(): void {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(PREFIX))
      .forEach(key => localStorage.removeItem(key));
  } catch {
    /* nothing worth doing */
  }
}
