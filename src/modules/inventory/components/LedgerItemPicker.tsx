import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { itemService } from '@/services';
import type { Item } from '@/types/models';

const MIN_SEARCH_LENGTH = 2;
const MAX_RESULTS = 8;

export interface LedgerItem {
  id: number;
  itemCode: string;
  itemName: string;
}

interface LedgerItemPickerProps {
  value: LedgerItem | null;
  onChange: (item: LedgerItem | null) => void;
}

/**
 * Picks the item whose ledger is being read.
 *
 * It searches the item catalogue rather than the stock balance, which is the
 * opposite choice from StockLinePicker and for the opposite reason: that picker
 * is used to move stock, so an item with no row in the store is genuinely
 * unusable, while this one is used to audit, and an item that sits at zero — or
 * that a store stopped carrying — still has a history worth reading. Hiding it
 * would hide exactly the case a stock check is opened to investigate.
 */
export function LedgerItemPicker({ value, onChange }: LedgerItemPickerProps) {
  const { t } = useTranslation();
  const [term, setTerm] = useState('');
  const debouncedTerm = useDebouncedValue(term);
  const isSearchable = debouncedTerm.trim().length >= MIN_SEARCH_LENGTH;

  const { data, isFetching } = useQuery({
    queryKey: ['ledger-item-picker', debouncedTerm],
    enabled: isSearchable,
    queryFn: () => itemService.getList({ search: debouncedTerm.trim(), limit: MAX_RESULTS })
  });

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5">
        <span className="min-w-0 flex-1 truncate text-sm">
          <span className="font-mono text-xs text-muted-foreground">{value.itemCode}</span>{' '}
          <span className="font-medium">{value.itemName}</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2"
          onClick={() => {
            onChange(null);
            setTerm('');
          }}
        >
          <X className="size-3.5" />
          {t('inventory.ledger.changeItem')}
        </Button>
      </div>
    );
  }

  const items: Item[] = data?.data ?? [];

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={event => setTerm(event.target.value)}
          placeholder={t('inventory.ledger.searchPlaceholder')}
          className="pl-8"
        />
        {isFetching && (
          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isSearchable && (
        <div className="max-h-56 overflow-y-auto rounded-md border">
          {items.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              {isFetching ? t('inventory.ledger.searching') : t('inventory.ledger.noItems')}
            </p>
          ) : (
            items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  onChange({ id: item.id, itemCode: item.itemCode, itemName: item.itemName })
                }
                className="flex w-full items-center gap-2 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.itemName}</span>
                  <span className="block truncate font-mono text-xs text-muted-foreground">
                    {item.itemCode}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
