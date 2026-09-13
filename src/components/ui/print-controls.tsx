import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { PRINT_FORMATS, usePrintFormatStore, type PrintFormat } from '@/stores/printFormatStore';
import { cn } from '@/lib/utils';

interface PrintControlsProps {
  className?: string;
}

/**
 * Print, plus the paper it comes out on.
 *
 * The two formats are a layout difference, not two documents: the same receipt
 * markup is re-flowed by index.css, so there is nothing here to keep in step
 * with the screen. The picker only records which way, and the choice sticks —
 * a counter changes printer about once a year, so it must not be a decision
 * the cashier makes again on every bill.
 */
export function PrintControls({ className }: PrintControlsProps) {
  const { t } = useTranslation();
  const format = usePrintFormatStore(state => state.format);
  const setFormat = usePrintFormatStore(state => state.setFormat);

  return (
    <div className={cn('flex items-center gap-2', className)} data-print-hide>
      <NativeSelect
        className="h-9 w-[8.5rem]"
        aria-label={t('common.print.format')}
        value={format}
        onChange={event => setFormat(event.target.value as PrintFormat)}
      >
        {PRINT_FORMATS.map(option => (
          <option key={option} value={option}>
            {t(`common.print.${option}`)}
          </option>
        ))}
      </NativeSelect>

      <Button variant="outline" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        {t('common.action.print')}
      </Button>
    </div>
  );
}
