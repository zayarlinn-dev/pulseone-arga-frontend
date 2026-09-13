import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';
import { useEntityOptions } from '@/hooks/api/useEntityOptions';
import { itemService } from '@/services';
import { formatCurrency } from '@/lib/utils';
import type { Item } from '@/types/models';

interface ItemUnitsEditorProps {
  item: Item;
}

/**
 * The units one item may be bought and counted in.
 *
 * It only appears once the item exists, and that is not a limitation to work
 * around: a unit is a row against an item id, and an item being typed into the
 * form above does not have one yet. The base and sale units are created with
 * the item, so the list is never empty when it opens.
 *
 * Adding a unit is always allowed. Changing a factor is not, once a document
 * has been keyed in that unit — the backend refuses it, because the documents
 * that used it recorded that factor and are read back through it.
 */
export function ItemUnitsEditor({ item }: ItemUnitsEditorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const uoms = useEntityOptions('UOM');

  const [newUomId, setNewUomId] = useState('');
  const [newFactor, setNewFactor] = useState('');
  // Blank on purpose: a unit with no price is one the item is bought or counted
  // in, and the sale screens leave it out rather than guessing what to charge.
  const [newPrice, setNewPrice] = useState('');

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['item-units', item.id],
    queryFn: () => itemService.getUnits(item.id)
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['item-units', item.id] });
    queryClient.invalidateQueries({ queryKey: ['items'] });
  };

  const { mutateAsync: addUnit, isPending: adding } = useMutation({
    mutationFn: () =>
      itemService.addUnit(item.id, {
        uomId: Number(newUomId),
        factorToBase: Number(newFactor),
        isPurchaseDefault: false,
        salePrice: newPrice.trim() ? newPrice.trim() : null
      }),
    onSuccess: () => {
      invalidate();
      setNewUomId('');
      setNewFactor('');
      setNewPrice('');
      toast.success(t('items.units.added'));
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const { mutateAsync: setPurchaseDefault } = useMutation({
    mutationFn: (unitId: number) => {
      const unit = units.find(row => row.id === unitId)!;
      return itemService.updateUnit(item.id, unitId, {
        uomId: unit.uomId,
        factorToBase: unit.factorToBase,
        isPurchaseDefault: true,
        // Carried through: the update replaces the row, so omitting the price
        // here would clear it and quietly stop the unit being sellable.
        salePrice: unit.salePrice ?? null
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success(t('items.units.defaultSet'));
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const { mutateAsync: removeUnit, isPending: removing } = useMutation({
    mutationFn: (unitId: number) => itemService.removeUnit(item.id, unitId),
    onSuccess: () => {
      invalidate();
      toast.success(t('items.units.removed'));
    },
    onError: (error: Error) => toast.error(error.message)
  });

  // The price is optional — a carton is added without one — but a price that is
  // typed has to be a price the column can hold.
  const priceOk = newPrice.trim() === '' || /^\d+(\.\d{1,2})?$/.test(newPrice.trim());
  const canAdd =
    newUomId !== '' &&
    /^\d+(\.\d+)?$/.test(newFactor) &&
    Number(newFactor) > 0 &&
    priceOk &&
    !adding;

  // The base and sale units belong to the item's own fields, so they are shown
  // as what they are rather than offered for deletion.
  const roleOf = (uomId: number): string | null => {
    if (uomId === item.baseUomId) return t('items.units.base');
    if (uomId === item.saleUomId) return t('items.units.sale');
    return null;
  };

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">{t('items.units.title')}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t('items.units.description')}</p>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">{t('common.label.loading')}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {units.map(unit => {
            const role = roleOf(unit.uomId);

            return (
              <li key={unit.id} className="flex items-center gap-2 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm">
                  {unit.uom?.entityName ?? `#${unit.uomId}`}
                  {role && (
                    <Badge variant="secondary" className="ml-2">
                      {role}
                    </Badge>
                  )}
                  {unit.isPurchaseDefault && (
                    <Badge variant="default" className="ml-2">
                      {t('items.units.purchaseDefault')}
                    </Badge>
                  )}
                </span>

                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  ×{unit.factorToBase}
                  {/*
                    The sale unit is priced by the item, so its row shows that
                    price rather than an empty one it does not use.
                  */}
                  {unit.uomId === item.saleUomId
                    ? ` · ${formatCurrency(item.salePrice)}`
                    : unit.salePrice
                      ? ` · ${formatCurrency(unit.salePrice)}`
                      : ` · ${t('items.units.notSold')}`}
                </span>

                {!unit.isPurchaseDefault && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 shrink-0 text-xs"
                    onClick={() => setPurchaseDefault(unit.id)}
                  >
                    {t('items.units.makeDefault')}
                  </Button>
                )}

                {!role && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive"
                    disabled={removing}
                    onClick={() => removeUnit(unit.id)}
                    aria-label={t('items.units.remove', {
                      unit: unit.uom?.entityName ?? String(unit.uomId)
                    })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_110px_130px_auto]">
        <Field label={t('items.units.newUnit')} htmlFor="newUomId" className="sm:col-span-1">
          <NativeSelect
            id="newUomId"
            value={newUomId}
            disabled={uoms.isLoading || uoms.categoryMissing}
            onChange={event => setNewUomId(event.target.value)}
          >
            <option value="">{t('items.form.selectUnit')}</option>
            {uoms.options
              // A unit the item already has would only collide with its row.
              .filter(option => !units.some(unit => unit.uomId === option.id))
              .map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
          </NativeSelect>
        </Field>

        <Field
          label={t('items.units.factor')}
          htmlFor="newFactor"
          hint={t('items.units.factorHint', {
            unit: item.baseUom?.entityName ?? t('items.units.baseUnitFallback')
          })}
        >
          <Input
            id="newFactor"
            inputMode="decimal"
            className="tabular-nums"
            value={newFactor}
            onChange={event => setNewFactor(event.target.value)}
          />
        </Field>

        <Field
          label={t('items.units.price')}
          htmlFor="newPrice"
          hint={t('items.units.priceHint')}
        >
          <MoneyInput
            id="newPrice"
            value={newPrice}
            onChange={event => setNewPrice(event.target.value)}
          />
        </Field>

        <div className="flex items-start pt-6">
          <Button type="button" variant="outline" disabled={!canAdd} onClick={() => addUnit()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t('items.units.add')}
          </Button>
        </div>
      </div>
    </div>
  );
}
