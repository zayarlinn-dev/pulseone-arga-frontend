import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Which printer the receipt is going to.
 *
 * `a4` is the office laser: a full sheet, wide margins, the layout the screen
 * already shows. `thermal` is the till roll beside the cashier — 80mm of
 * one-bit paper on a continuous feed, so there is no page height to fill and
 * no grey to render, only a narrow column of black text.
 */
export type PrintFormat = 'a4' | 'thermal';

export const PRINT_FORMATS: PrintFormat[] = ['a4', 'thermal'];

const STORAGE_KEY = 'pulseone-print-format';

/**
 * `@page` cannot be conditioned on a selector — the paper size is a property
 * of the document, not of an element — so the rule is swapped wholesale rather
 * than shipped twice in index.css and toggled by class.
 *
 * `auto` height on the roll is what stops an 80mm receipt from being padded
 * out to a letter-sized sheet and fed through half a metre of blank paper.
 */
const PAGE_RULES: Record<PrintFormat, string> = {
  a4: '@page { size: A4 portrait; margin: 14mm; }',
  thermal: '@page { size: 80mm auto; margin: 3mm; }'
};

const PAGE_STYLE_ID = 'pulseone-print-page';

/**
 * Paints the format onto <html>, the same way applyTheme does: the attribute
 * is what index.css keys the narrow-roll layout off, and it is set outside of
 * the print handler so a plain Ctrl+P obeys the stored choice too.
 */
export function applyPrintFormat(format: PrintFormat) {
  document.documentElement.dataset.printFormat = format;

  let style = document.getElementById(PAGE_STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = PAGE_STYLE_ID;
    document.head.append(style);
  }
  style.textContent = PAGE_RULES[format];
}

interface PrintFormatState {
  format: PrintFormat;
  setFormat: (format: PrintFormat) => void;
}

/**
 * A counter keeps one printer, so the choice is remembered per browser rather
 * than asked for on every bill.
 */
export const usePrintFormatStore = create<PrintFormatState>()(
  persist(
    set => ({
      format: 'a4',

      setFormat: format => {
        applyPrintFormat(format);
        set({ format });
      }
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => state => applyPrintFormat(state?.format ?? 'a4')
    }
  )
);
