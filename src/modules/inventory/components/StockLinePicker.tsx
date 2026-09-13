import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { inventoryService } from '@/services';
import { formatCurrency } from '@/lib/utils';
import { formatQty } from '@/lib/uom';
import type { StockBalanceRow } from '@/types/models';

const MIN_SEARCH_LENGTH = 2;
const MAX_RESULTS = 8;

interface StockLinePickerProps {
  storeId: string;
  /** Rows already on the document, so they cannot be added twice. */
  chosenIds: number[];
  onPick: (row: StockBalanceRow) => void;
}

/**
 * Finds a stock row — this item, in this store — to put on a stock document.
 *
 * It searches the stock balance rather than the item catalogue on purpose: the
 * store keeper is choosing something that is physically on a shelf, and needs
 * to see how much is there before deciding how much to write off, move or
 * count. An item the store has never held has no row and cannot be picked.
 */
export function StockLinePicker({ storeId, chosenIds, onPick }: StockLinePickerProps) {
  const { t } = useTranslation();
  const [term, setTerm] = useState('');
  const debouncedTerm = useDebouncedValue(term);
  const isSearchable = debouncedTerm.trim().length >= MIN_SEARCH_LENGTH;

  const { data, isFetching } = useQuery({
    queryKey: ['stock-picker', storeId, debouncedTerm],
    enabled: !!storeId && isSearchable,
    queryFn: () =>
      inventoryService.getStockBalance({
        storeId,
        search: debouncedTerm.trim(),
        limit: 25
      })
  });

  const rows = (data?.data ?? []).filter(row => !chosenIds.includes(row.itemStoreMapId));

  if (!storeId) {
    return (
      <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
        {t('inventory.picker.chooseStoreFirst')}
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={event => setTerm(event.target.value)}
          placeholder={t('inventory.picker.placeholder')}
          className="pl-8"
        />
        {isFetching && (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isSearchable && (
        <div className="max-h-56 overflow-y-auto rounded-md border">
          {rows.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              {isFetching ? t('inventory.picker.searching') : t('inventory.picker.noResults')}
            </p>
          ) : (
            rows.slice(0, MAX_RESULTS).map(row => (
              <button
                key={row.itemStoreMapId}
                type="button"
                onClick={() => {
                  onPick(row);
                  setTerm('');
                }}
                className="flex w-full items-center gap-2 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{row.itemName}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    <span className="font-mono">{row.itemCode}</span> ·{' '}
                    {formatCurrency(row.salePrice)}
                  </span>
                </span>
                <Badge variant={row.totalQty > 0 ? 'secondary' : 'destructive'}>
                  {formatQty(row.totalQty, row.baseUom)} on hand
                </Badge>
                <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
