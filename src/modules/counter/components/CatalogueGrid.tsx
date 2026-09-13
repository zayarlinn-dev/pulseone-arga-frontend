import { Loader2, PackageX, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { formatQty } from '@/lib/uom';
import type { CounterViewMode } from '@/stores/counterViewStore';
import type { CartUnitOption } from '../types';

export interface CatalogueTile {
  refId: number;
  name: string;
  code: string;
  unitPrice: number;
  /**
   * Whole sale units still sellable — boxes, not tablets, because that is what
   * the operator types. Undefined for services, which hold no stock.
   */
  stockOnHand?: number;
  /**
   * The name of that sale unit, so the tile says "3 box left" rather than a
   * bare 3 — the stock behind it is held in tablets and the difference is the
   * conversion factor.
   */
  uom?: string | null;
  /** Base units in one of that unit. */
  factorToBase?: number;
  /** Every unit the item is priced in, for the ticket to switch between. */
  unitOptions?: CartUnitOption[];
  /** Second line under the name — a generic name or a service centre. */
  subtitle?: string | null;
}

interface CatalogueGridProps {
  tiles: CatalogueTile[];
  /** Quantity of each tile already on the ticket, keyed by refId. */
  inCart: Map<number, number>;
  loading: boolean;
  emptyMessage: string;
  mode: CounterViewMode;
  onPick: (tile: CatalogueTile) => void;
}

/**
 * The pick list, drawn two ways.
 *
 * On touch it is tiles: a counter is worked standing up with a finger, so the
 * target is the whole 96px card rather than a row with a small button on the
 * end of it. On a computer that same card wastes most of the screen — a pointer
 * lands on a 32px row perfectly well, and a dense list puts three times as many
 * things within reach of the eye, which is what someone with a keyboard and a
 * search box actually wants.
 *
 * Either way an entry already on the ticket shows how many, because the second
 * thing an operator does after adding something is check they added it once.
 */
export function CatalogueGrid({
  tiles,
  inCart,
  loading,
  emptyMessage,
  mode,
  onPick
}: CatalogueGridProps) {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tiles.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
        <PackageX className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  if (mode === 'desktop') {
    return (
      <div className="grid gap-1 lg:grid-cols-2 2xl:grid-cols-3">
        {tiles.map(tile => {
          const picked = inCart.get(tile.refId) ?? 0;
          const outOfStock = tile.stockOnHand !== undefined && tile.stockOnHand <= 0;

          return (
            <button
              key={tile.refId}
              type="button"
              disabled={outOfStock}
              onClick={() => onPick(tile)}
              className={cn(
                'group flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                picked > 0 ? 'border-primary bg-primary/5' : 'bg-card hover:bg-accent',
                outOfStock && 'cursor-not-allowed opacity-50'
              )}
            >
              <Plus
                className={cn(
                  'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-opacity',
                  'opacity-0 group-hover:opacity-100',
                  picked > 0 && 'opacity-100 text-primary'
                )}
              />

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm leading-tight">{tile.name}</span>
                <span className="block truncate font-mono text-[11px] leading-tight text-muted-foreground">
                  {tile.code}
                  {tile.subtitle ? ` · ${tile.subtitle}` : ''}
                </span>
              </span>

              {tile.stockOnHand !== undefined && (
                <span
                  className={cn(
                    'shrink-0 text-xs tabular-nums',
                    outOfStock ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {outOfStock ? 'none' : `×${formatQty(tile.stockOnHand!, tile.uom)}`}
                </span>
              )}

              <span className="w-20 shrink-0 text-right text-sm font-medium tabular-nums">
                {formatCurrency(tile.unitPrice)}
              </span>

              {picked > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold tabular-nums text-primary-foreground">
                  {picked}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
      {tiles.map(tile => {
        const picked = inCart.get(tile.refId) ?? 0;
        const outOfStock = tile.stockOnHand !== undefined && tile.stockOnHand <= 0;

        return (
          <button
            key={tile.refId}
            type="button"
            disabled={outOfStock}
            onClick={() => onPick(tile)}
            className={cn(
              'relative flex min-h-24 flex-col justify-between rounded-xl border p-3 text-left transition-colors',
              'active:scale-[0.98] active:bg-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              picked > 0 ? 'border-primary bg-primary/5' : 'bg-card hover:bg-accent/50',
              outOfStock && 'cursor-not-allowed opacity-50 active:scale-100'
            )}
          >
            {picked > 0 && (
              <span className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold tabular-nums text-primary-foreground">
                {picked}
              </span>
            )}

            <span className="min-w-0 pr-7">
              <span className="line-clamp-2 text-sm font-medium leading-snug">{tile.name}</span>
              {tile.subtitle && (
                <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {tile.subtitle}
                </span>
              )}
            </span>

            <span className="mt-2 flex items-end justify-between gap-2">
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(tile.unitPrice)}
              </span>
              {tile.stockOnHand !== undefined && (
                <Badge variant={outOfStock ? 'destructive' : 'secondary'} className="shrink-0">
                  {outOfStock
                    ? t('counter.tile.none')
                    : t('counter.tile.left', {
                        qty: formatQty(tile.stockOnHand!, tile.uom)
                      })}
                </Badge>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
