/**
 * The counter's ticket.
 *
 * A cart line is deliberately not a copy of an API payload: the screen needs a
 * name and a unit price to show, and the API wants neither (it reads both from
 * the catalogue). Keeping them apart means the tile grid can hand over whatever
 * it has and the submit step maps it down to the two line shapes the endpoint
 * accepts.
 */
export type CartKind = 'service' | 'item';

export interface CartLine {
  /** `service:12` / `item:34` — stable, so tapping a tile twice finds the line. */
  key: string;
  kind: CartKind;
  /** The catalogue id: a serviceId for services, an itemId for medicine. */
  refId: number;
  name: string;
  code: string;
  /** Display only. The backend prices the line from its own catalogue. */
  unitPrice: number;
  qty: number;
  /** 0–100. A flat discount is taken on the whole ticket instead. */
  percentageDiscount: number;
  /**
   * Whole sale units still sellable, for medicine only. In sale units so it
   * compares directly against `qty`, which is what the counter enters.
   */
  stockOnHand?: number;
  /** The name of the unit this line is sold in, so a shortage says "2 box". */
  uom?: string | null;
  /**
   * The unit the line is sold in, when it is not the item's own sale unit —
   * a loose tablet out of a box-priced medicine. Undefined means the sale unit,
   * which is what the backend assumes for a line that names none.
   */
  uomId?: number;
  /** Base units in one of that unit, for turning the balance into it. */
  factorToBase?: number;
  /**
   * The units this line could be switched to, carried from the store's stock so
   * the ticket can offer them without another request.
   */
  unitOptions?: CartUnitOption[];
}

/** One unit a ticket line can be switched to, with the price that comes with it. */
export interface CartUnitOption {
  /** Undefined for the item's own sale unit. */
  uomId?: number;
  name: string | null;
  unitPrice: number;
  factorToBase: number;
  /** Whole units of this size still on the shelf. */
  stockOnHand: number;
}

export const cartKey = (kind: CartKind, refId: number) => `${kind}:${refId}`;

export const round2 = (value: number) => Math.round(value * 100) / 100;

/** Parses a money field, treating anything unparseable as zero. */
export const num = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const lineTotal = (line: CartLine): number => {
  const gross = line.unitPrice * line.qty;
  return round2(Math.max(gross - (gross * line.percentageDiscount) / 100, 0));
};
