import { Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { cn } from '@/lib/utils';

/**
 * Breakpoint below which a column is dropped.
 *
 * A phone fits three or four columns before the rest become a sideways scroll
 * nobody discovers, so each list names the few columns that carry the row and
 * hides the others until there is room. The row still opens the full record,
 * so nothing marked here is the only way to reach a value.
 */
export type ColumnBreakpoint = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Spelled out rather than assembled from the prop: Tailwind scans source text,
 * so a template literal would compile to no class at all.
 */
const HIDE_BELOW_CLASS: Record<ColumnBreakpoint, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell'
};

export interface Column<T> {
  /** Property key used for sorting; omit for non-sortable columns. */
  key?: string;
  header: string;
  /** Renders the cell. Falls back to the raw value at `key` when omitted. */
  render?: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  /** Hides the column on screens narrower than this breakpoint. */
  hideBelow?: ColumnBreakpoint;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  /** Shown when there are no rows and nothing is loading. */
  emptyMessage?: string;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  /**
   * Renders a full-width panel beneath one row. Used for drill-downs where the
   * detail belongs to the row it opens under — the batches behind a stock
   * balance, say — and would lose that connection on a page of its own.
   *
   * The panel is rendered for whichever row `expandedRowKey` names, so the
   * caller owns the open/closed state and can allow one at a time or several.
   */
  renderExpanded?: (row: T) => ReactNode;
  expandedRowKey?: string | number | null;
}

/**
 * Table with sortable headers, a loading state and an empty state.
 *
 * Sorting is server-side: clicking a header calls `onSort`, which re-runs the
 * query rather than reordering the current page in memory.
 */
export function DataTable<T>({
  columns,
  rows,
  loading = false,
  emptyMessage,
  sortBy,
  sortOrder = 'asc',
  onSort,
  rowKey,
  onRowClick,
  renderExpanded,
  expandedRowKey = null
}: DataTableProps<T>) {
  const { t } = useTranslation();

  const renderSortIcon = (key: string) => {
    if (sortBy !== key) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 inline h-3 w-3" />
    );
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(column => {
              const sortable = column.sortable !== false && !!column.key && !!onSort;
              return (
                <TableHead
                  key={column.header}
                  className={cn(
                    column.className,
                    column.hideBelow && HIDE_BELOW_CLASS[column.hideBelow],
                    sortable && 'cursor-pointer select-none'
                  )}
                  onClick={sortable ? () => onSort!(column.key!) : undefined}
                >
                  {column.header}
                  {sortable && renderSortIcon(column.key!)}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center text-muted-foreground"
              >
                {emptyMessage ?? t('common.table.noResults')}
              </TableCell>
            </TableRow>
          ) : (
            rows.map(row => {
              const key = rowKey(row);
              const expanded = renderExpanded != null && expandedRowKey === key;

              return (
                <Fragment key={key}>
                  <TableRow
                    className={cn(
                      onRowClick && 'cursor-pointer',
                      // The open row keeps its own background so it reads as the
                      // heading of the panel below it rather than as one more
                      // row with something unrelated underneath.
                      expanded && 'bg-muted/50'
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    {columns.map(column => (
                      <TableCell
                        key={column.header}
                        className={cn(
                          column.className,
                          column.hideBelow && HIDE_BELOW_CLASS[column.hideBelow]
                        )}
                      >
                        {column.render
                          ? column.render(row)
                          : String((row as Record<string, unknown>)[column.key ?? ''] ?? '-')}
                      </TableCell>
                    ))}
                  </TableRow>

                  {expanded && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={columns.length} className="bg-muted/30 p-0">
                        {renderExpanded(row)}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
