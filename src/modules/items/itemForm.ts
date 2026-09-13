import { z } from 'zod';
import { fieldRules } from '@/i18n/validation';
import type { TFunction } from 'i18next';
import type { Item } from '@/types/models';
import type { ItemCreatePayload } from '@/services';

/**
 * Shape, validation and API mapping for the item form.
 *
 * Every control holds a string — that is what `<input>` and `<select>` produce
 * — and the conversion to ids, numbers and nulls happens once in
 * toItemPayload, so no field has to remember its own wire format.
 */

/**
 * Built per language rather than once at import: a schema defined at module
 * scope would freeze its messages in whichever language the tab loaded in.
 */
export const buildItemSchema = (t: TFunction) => {
  const v = fieldRules(t);
  const code = t('items.form.itemCode');
  const name = t('common.label.name');
  const generic = t('items.form.genericName');

  return z.object({
    itemCode: z.string().min(1, t('items.validation.codeRequired')).max(20, v.max(code, 20)),
    itemName: z.string().min(1, v.required(name)).max(50, v.max(name, 50)),
    genericName: z.string().max(50, v.max(generic, 50)).optional(),
    itemCategoryId: z.string().min(1, t('items.validation.categoryRequired')),
    baseUomId: z.string().min(1, t('items.validation.baseUnitRequired')),
    saleUomId: z.string().min(1, t('items.validation.saleUnitRequired')),
    // The column is decimal(19,2); the value stays a string all the way to the
    // API so no rounding happens in JavaScript's binary floats on the way.
    salePrice: z
      .string()
      .min(1, t('items.validation.priceRequired'))
      .regex(/^\d+(\.\d{1,2})?$/, t('items.validation.priceFormat')),
    conversionFactor: z
      .string()
      .min(1, t('items.validation.conversionRequired'))
      .refine(
        value => /^\d+(\.\d+)?$/.test(value) && Number(value) > 0,
        t('items.validation.conversionPositive')
      ),
    itemDescription: z.string().max(65535).optional(),
    isActive: z.boolean(),
    isManual: z.boolean(),
    /** Create only — the stores to open this item in. */
    storeIds: z.array(z.string())
  });
};

export type ItemFormValues = z.infer<ReturnType<typeof buildItemSchema>>;

export const EMPTY_ITEM_FORM: ItemFormValues = {
  itemCode: '',
  itemName: '',
  genericName: '',
  itemCategoryId: '',
  baseUomId: '',
  saleUomId: '',
  salePrice: '0',
  conversionFactor: '1',
  itemDescription: '',
  isActive: true,
  isManual: false,
  storeIds: []
};

const asText = (value: string | null | undefined) => value ?? '';
const asId = (value: number | null | undefined) => (value != null ? String(value) : '');

/** Seeds the form from an existing record when the dialog opens on an edit. */
export function toFormValues(item: Item): ItemFormValues {
  return {
    itemCode: item.itemCode,
    itemName: item.itemName,
    genericName: asText(item.genericName),
    itemCategoryId: asId(item.itemCategoryId),
    baseUomId: asId(item.baseUomId),
    saleUomId: asId(item.saleUomId),
    salePrice: item.salePrice ?? '0',
    conversionFactor: String(item.conversionFactor ?? 1),
    itemDescription: asText(item.itemDescription),
    isActive: item.isActive ?? true,
    isManual: item.isManual ?? false,
    // Store mappings are not edited here — the backend only opens stores when
    // the item is created.
    storeIds: []
  };
}

/**
 * Maps the form to the API payload.
 *
 * Every field the model marks required is sent on an edit as well as a create:
 * the generic Update binds the body to the whole model, so a body missing
 * `itemCode` or `baseUomId` fails validation before it reaches the database.
 */
export function toItemPayload(values: ItemFormValues, isCreate: boolean): ItemCreatePayload {
  const payload: ItemCreatePayload = {
    itemCode: values.itemCode.trim(),
    itemName: values.itemName.trim(),
    genericName: values.genericName?.trim() || null,
    itemCategoryId: Number(values.itemCategoryId),
    baseUomId: Number(values.baseUomId),
    saleUomId: Number(values.saleUomId),
    salePrice: values.salePrice,
    conversionFactor: Number(values.conversionFactor),
    itemDescription: values.itemDescription?.trim() || null,
    isActive: values.isActive,
    isManual: values.isManual
  };

  // storeIds is a create-time argument, not a column. Sending it on an update
  // would be silently ignored, which reads as a store picker that does nothing.
  if (isCreate && values.storeIds.length > 0) {
    payload.storeIds = values.storeIds.map(Number);
  }

  return payload;
}
