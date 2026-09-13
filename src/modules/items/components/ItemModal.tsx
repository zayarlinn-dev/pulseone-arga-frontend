import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { CheckboxField } from '@/components/ui/checkbox-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useDropdown } from '@/hooks/api/useDropdown';
import { useEntityOptions } from '@/hooks/api/useEntityOptions';
import { ItemUnitsEditor } from './ItemUnitsEditor';
import type { Item } from '@/types/models';
import type { ItemCreatePayload } from '@/services';
import {
  buildItemSchema,
  EMPTY_ITEM_FORM,
  toFormValues,
  toItemPayload,
  type ItemFormValues
} from '../itemForm';

interface ItemModalProps {
  open: boolean;
  item: Item | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: ItemCreatePayload) => Promise<void>;
}

export function ItemModal({ open, item, submitting, onClose, onSubmit }: ItemModalProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildItemSchema(t), [t]);

  const categories = useEntityOptions('Item Category');
  const uoms = useEntityOptions('UOM');
  const { data: stores = [], isLoading: loadingStores } = useDropdown('/dropdown/stores');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ItemFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_ITEM_FORM
  });

  // The store boxes are driven by hand rather than by register(): a name shared
  // by several checkboxes only collects into an array while there is more than
  // one of them, so a deployment with a single store would submit a bare value
  // where the schema expects a list.
  const selectedStoreIds = watch('storeIds');

  const toggleStore = (storeId: number, checked: boolean) => {
    const value = String(storeId);
    setValue(
      'storeIds',
      checked ? [...selectedStoreIds, value] : selectedStoreIds.filter(id => id !== value)
    );
  };

  // Re-seed whenever the dialog opens, so switching from "edit A" to "new"
  // does not leave A's values behind.
  useEffect(() => {
    if (!open) return;
    reset(item ? toFormValues(item) : EMPTY_ITEM_FORM);
  }, [open, item, reset]);

  const submit = handleSubmit(values => onSubmit(toItemPayload(values, !item)));

  const uomOptions = uoms.options.map(option => (
    <option key={option.id} value={option.id}>
      {option.name}
    </option>
  ));

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t(item ? 'items.modal.editTitle' : 'items.modal.newTitle')}</DialogTitle>
          <DialogDescription>
            {item
              ? t('items.modal.editDescription')
              : t('items.modal.newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('items.form.itemCode')}
              htmlFor="itemCode"
              required
              error={errors.itemCode?.message}
            >
              <Input id="itemCode" {...register('itemCode')} />
            </Field>

            <Field label={t('common.label.name')} htmlFor="itemName" required error={errors.itemName?.message}>
              <Input id="itemName" {...register('itemName')} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('items.form.genericName')}
              htmlFor="genericName"
              error={errors.genericName?.message}
            >
              <Input id="genericName" {...register('genericName')} />
            </Field>

            <Field
              label={t('common.label.category')}
              htmlFor="itemCategoryId"
              required
              error={errors.itemCategoryId?.message}
              hint={
                categories.categoryMissing
                  ? t('items.form.noCategory')
                  : undefined
              }
            >
              <NativeSelect
                id="itemCategoryId"
                disabled={categories.isLoading || categories.categoryMissing}
                {...register('itemCategoryId')}
              >
                <option value="">
                  {categories.isLoading ? t('common.label.loading') : t('items.form.selectCategory')}
                </option>
                {categories.options.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          {/*
            The three fields below are left editable on an existing item, and
            the warning is shown rather than the controls disabled: an item that
            has never held stock is a setup mistake worth correcting, and only
            the backend knows whether this one has history. It refuses the
            change with a message if it does — see ItemService.Update.
          */}
          {item && (
            <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-muted-foreground">
              {t('items.form.unitsLocked')}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label={t('items.form.baseUnit')}
              htmlFor="baseUomId"
              required
              error={errors.baseUomId?.message}
              hint={
                uoms.categoryMissing ? t('items.form.noUom') : t('items.form.baseUnitHint')
              }
            >
              <NativeSelect
                id="baseUomId"
                disabled={uoms.isLoading || uoms.categoryMissing}
                {...register('baseUomId')}
              >
                <option value="">
                  {uoms.isLoading ? t('common.label.loading') : t('items.form.selectUnit')}
                </option>
                {uomOptions}
              </NativeSelect>
            </Field>

            <Field
              label={t('items.form.saleUnit')}
              htmlFor="saleUomId"
              required
              error={errors.saleUomId?.message}
              hint={uoms.categoryMissing ? undefined : t('items.form.saleUnitHint')}
            >
              <NativeSelect
                id="saleUomId"
                disabled={uoms.isLoading || uoms.categoryMissing}
                {...register('saleUomId')}
              >
                <option value="">
                  {uoms.isLoading ? t('common.label.loading') : t('items.form.selectUnit')}
                </option>
                {uomOptions}
              </NativeSelect>
            </Field>

            <Field
              label={t('items.form.conversionFactor')}
              htmlFor="conversionFactor"
              required
              error={errors.conversionFactor?.message}
              hint={t('items.form.conversionHint')}
            >
              <Input
                id="conversionFactor"
                inputMode="decimal"
                className="tabular-nums"
                {...register('conversionFactor')}
              />
            </Field>
          </div>

          <Field
            label={t('items.form.salePrice')}
            htmlFor="salePrice"
            required
            error={errors.salePrice?.message}
            className="sm:max-w-[50%]"
          >
            <MoneyInput
              id="salePrice"
              {...register('salePrice')}
            />
          </Field>

          <Field
            label={t('common.label.description')}
            htmlFor="itemDescription"
            error={errors.itemDescription?.message}
          >
            <Textarea id="itemDescription" rows={2} {...register('itemDescription')} />
          </Field>

          {/*
            Store mappings are only opened when the item is created — the update
            endpoint does not touch them — so the picker would be a lie on an
            edit and is left out there.
          */}
          {!item && (
            <Field
              label={t('items.form.openInStores')}
              hint={t('items.form.openInStoresHint')}
            >
              {loadingStores ? (
                <p className="text-xs text-muted-foreground">{t('items.form.loadingStores')}</p>
              ) : stores.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t('items.form.noStores')}</p>
              ) : (
                <div className="grid max-h-40 gap-2 overflow-y-auto sm:grid-cols-2">
                  {stores.map(store => (
                    <CheckboxField
                      key={store.id}
                      id={`store-${store.id}`}
                      label={store.name}
                      checked={selectedStoreIds.includes(String(store.id))}
                      onChange={event => toggleStore(store.id, event.target.checked)}
                    />
                  ))}
                </div>
              )}
            </Field>
          )}

          {/*
            Units are rows against an item id, so they can only be managed once
            the item exists. A new item gets its base and sale units created
            with it; a carton is added here afterwards.
          */}
          {item && <ItemUnitsEditor item={item} />}

          <div className="grid gap-2 sm:grid-cols-2">
            <CheckboxField id="itemIsActive" label={t('common.status.active')} {...register('isActive')} />
            <CheckboxField
              id="itemIsManual"
              label={t('items.form.drug')}
              description={t('items.form.drugHint')}
              {...register('isManual')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(item ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
