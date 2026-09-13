import type { ChangeEvent, FocusEvent } from 'react';

/**
 * A change/blur event shaped like the one a native form control would raise.
 *
 * The select and date controls in `components/ui` draw their own popup over a
 * real `<select>`/`<input>`. When the user picks something the control writes
 * the value straight to that element and hands this to the caller's handler:
 * `target` is the actual node, so `register(...)` finds the `name`, `type` and
 * `value` it reads, and plain `event.target.value` callers see what they expect.
 */
export function controlEvent<T extends HTMLElement>(node: T, type: 'change' | 'blur') {
  return {
    type,
    target: node,
    currentTarget: node,
    bubbles: true,
    cancelable: false,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: false,
    timeStamp: Date.now(),
    isDefaultPrevented: () => false,
    isPropagationStopped: () => false,
    persist: () => {},
    preventDefault: () => {},
    stopPropagation: () => {}
  } as unknown as ChangeEvent<T> & FocusEvent<T>;
}

/**
 * Writes a value past React's change tracker, so a controlled field is left to
 * re-apply its own value on the next render rather than being fought over.
 */
export function writeValue(node: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype = node instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (setter) setter.call(node, value);
  else node.value = value;
}

/** `value` may arrive as a number; the multi-select array form is unused here. */
export function scalar(value: string | number | readonly string[] | undefined): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}
