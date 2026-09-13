import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { NativeSelect } from './native-select';
import { PAGE_SIZE_OPTIONS } from '@/constants/pagination';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  const { t } = useTranslation();
  const firstRow = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col items-center justify-between gap-3 py-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        {totalCount === 0
          ? t('common.pagination.noRecords')
          : t('common.pagination.showing', {
              from: firstRow,
              to: lastRow,
              total: totalCount.toLocaleString()
            })}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('common.pagination.rows')}</span>
          <NativeSelect
            value={pageSize}
            onChange={event => onPageSizeChange(Number(event.target.value))}
            className="h-8 w-auto px-2 text-sm"
            aria-label={t('common.pagination.rowsPerPage')}
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label={t('common.pagination.previous')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-2 text-sm">
            {currentPage} / {Math.max(totalPages, 1)}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label={t('common.pagination.next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
