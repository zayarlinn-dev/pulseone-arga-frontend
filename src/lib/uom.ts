/**
 * Units of measure, and saying which one a number is in.
 *
 * An item is counted in a base unit (tablets) and sold in a sale unit (a box of
 * them), with `conversionFactor` bridging the two. The backend applies that
 * factor on goods received, pharmacy dispensing and counter sales, and applies
 * nothing on transfers, damage, consumption, adjustments and openings — those
 * are keyed in base units already.
 *
 * That split is defensible. What is not is a screen showing a bare number: the
 * same "Qty" box means boxes on one form and tablets on the next, and nothing
 * on screen says which. These helpers exist so every quantity can carry its
 * unit, which is the only thing that makes the factor safe to use.
 */

/** A factor that cannot be divided or multiplied by is treated as 1-to-1. */
export function safeFactor(factor: number | null | undefined): number {
  return factor != null && Number.isFinite(factor) && factor > 0 ? factor : 1;
}

/**
 * Base units expressed in sale units, rounded down.
 *
 * Down, because a part-full box is not a box: seven loose tablets out of a
 * ten-tablet box cannot be handed over as a box, and rounding up would offer
 * the counter stock that is not there.
 */
export function toSaleUnits(baseQty: number, factor: number | null | undefined): number {
  return Math.floor(baseQty / safeFactor(factor));
}

/** Sale units in base units — what the backend will actually take off the shelf. */
export function toBaseUnits(saleQty: number, factor: number | null | undefined): number {
  return Math.round(saleQty * safeFactor(factor));
}

/**
 * A quantity with its unit: "12 boxes".
 *
 * The unit is optional throughout, because an item whose UOM lookup row was
 * deleted still has stock and still has to be dispensable. A missing unit
 * prints the bare number rather than an empty word.
 */
export function formatQty(qty: number, unit?: string | null): string {
  const amount = qty.toLocaleString();
  return unit ? `${amount} ${unit}` : amount;
}

/**
 * What a quantity keyed in sale units comes to in base units: "2 box = 20 tab".
 *
 * Returns null when there is nothing worth saying — no quantity yet, or a
 * one-to-one item, where the restatement would be noise on every line.
 */
export function conversionNote(
  saleQty: number,
  factor: number | null | undefined,
  saleUom?: string | null,
  baseUom?: string | null
): string | null {
  const resolved = safeFactor(factor);
  if (resolved === 1 || !Number.isFinite(saleQty) || saleQty <= 0) return null;

  return `${formatQty(saleQty, saleUom)} = ${formatQty(toBaseUnits(saleQty, resolved), baseUom)}`;
}
