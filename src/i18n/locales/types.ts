/**
 * Maps an English catalogue slice onto its translated twin: same keys, same
 * nesting, any string value. Typing each Myanmar file as
 * `Translations<typeof source>` turns a missed or misspelled key into a
 * compile error instead of an English string leaking into a Burmese screen.
 */
export type Translations<T> = {
  [K in keyof T]: T[K] extends string ? string : Translations<T[K]>;
};
