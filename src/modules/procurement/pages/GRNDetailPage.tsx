import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Ban, Loader2, Printer, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { grnService, type GRNReturnPayload } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { CONFIG } from '@/config/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { formatQty } from '@/lib/uom';
import type { GRNItem } from '@/types/models';

/**
 * A received delivery, and the two ways a line can be undone.
 *
 * Returning sends part of a line back to the vendor and takes that stock out
 * again; cancelling voids the whole line. Both are refused once the stock has
 * moved on — sold, transferred or consumed — because there is nothing left to
 * take back at that point.
 */
export default function GRNDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const can = useAuthStore(state => state.can);

  const [returning, setReturning] = useState<GRNItem | null>(null);
  const [returnQty, setReturnQty] = useState('');
  const [returnBatchId, setReturnBatchId] = useState('');
  const [cancelling, setCancelling] = useState<GRNItem | null>(null);

  const {
    data: grn,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['grn', id],
    enabled: !!id,
    queryFn: () => grnService.getById(id!)
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['grn', id] });
    queryClient.invalidateQueries({ queryKey: ['grns'] });
    queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
  };

  const { mutateAsync: returnLine, isPending: returningLine } = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: GRNReturnPayload }) =>
      grnService.returnItem(itemId, payload),
    onSuccess: () => {
      invalidate();
      toast.success(t('grn.detail.toast.returned'));
      setReturning(null);
      setReturnQty('');
      setReturnBatchId('');
    },
    onError: (mutationError: Error) =>
      toast.error(mutationError.message || t('grn.detail.toast.returnFailed'))
  });

  const { mutateAsync: cancelLine, isPending: cancellingLine } = useMutation({
    mutationFn: (itemId: number) => grnService.cancelItem(itemId),
    onSuccess: () => {
      invalidate();
      toast.success(t('grn.detail.toast.cancelled'));
      setCancelling(null);
    },
    onError: (mutationError: Error) =>
      toast.error(mutationError.message || t('grn.detail.toast.cancelFailed'))
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !grn) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">
          {(error as Error)?.message ?? t('grn.detail.notFound')}
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/procurement/grns')}>
          {t('grn.back')}
        </Button>
      </Card>
    );
  }

  const lines = grn.grnItems ?? [];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3" data-print-hide>
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 h-8 w-8"
            onClick={() => navigate('/procurement/grns')}
            aria-label={t('grn.back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              <span className="font-mono">{grn.grnNo}</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('grn.detail.subtitle', {
                vendor: grn.vendor?.vendorName ?? t('grn.detail.unnamedVendor'),
                invoice: grn.invoiceNo,
                date: formatDate(grn.invoiceDate)
              })}
              {grn.createdUser
                ? ` · ${t('grn.detail.receivedBy', { user: grn.createdUser.username })}`
                : ''}
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          {t('common.action.print')}
        </Button>
      </div>

      {/* 6mm of sheet margin on each side is a quarter of a phone's width; the
          note keeps its paper proportions only where there is paper's room. */}
      <Card className="mx-auto max-w-4xl p-4 sm:p-6 print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">{CONFIG.appName}</p>
            <p className="text-sm text-muted-foreground">{t('grn.detail.noteTitle')}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono font-medium">{grn.grnNo}</p>
            <p className="text-muted-foreground">{formatDate(grn.createdAt)}</p>
          </div>
        </div>

        <div className="grid gap-4 border-b py-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('grn.detail.vendor')}
            </p>
            <p className="font-medium">{grn.vendor?.vendorName ?? '-'}</p>
            {grn.vendor?.contactNo && (
              <p className="text-xs text-muted-foreground">{grn.vendor.contactNo}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('common.label.category')}
            </p>
            <p>{grn.grnCategory?.entityName ?? '-'}</p>
          </div>
        </div>

        <table className="w-full py-4 text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 font-medium">{t('grn.detail.header.item')}</th>
              {/* Seven columns leave about 40px each on a phone, which the
                  amount alone does not fit into. Which store took the goods and
                  which lots they arrived in are what whoever reconciles the
                  filed sheet reads, and they are both still on the printed
                  copy — so they are the two that stand down here. */}
              <th className="hidden py-2 font-medium sm:table-cell print:table-cell">
                {t('grn.detail.header.store')}
              </th>
              <th className="hidden py-2 font-medium sm:table-cell print:table-cell">
                {t('grn.detail.header.batches')}
              </th>
              <th className="py-2 text-right font-medium">{t('grn.detail.header.cost')}</th>
              <th className="py-2 text-right font-medium">{t('grn.detail.header.qty')}</th>
              <th className="py-2 text-right font-medium">{t('grn.detail.header.amount')}</th>
              <th className="py-2 text-right font-medium" data-print-hide />
            </tr>
          </thead>
          <tbody>
            {lines.map(line => {
              const voided = line.isCancelled || line.isReturned;

              return (
                <tr key={line.id} className="border-b last:border-b-0">
                  <td className="py-2">
                    <span className="block">
                      {line.itemStoreMap?.item?.itemName ?? `Item #${line.itemStoreMapId}`}
                    </span>
                    {line.isCancelled && (
                      <Badge variant="destructive">{t('grn.detail.cancelled')}</Badge>
                    )}
                    {line.isReturned && !line.isCancelled && (
                      <Badge variant="warning">{t('grn.detail.returned')}</Badge>
                    )}
                  </td>
                  <td className="hidden py-2 sm:table-cell print:table-cell">
                    {line.store?.storeName ?? '-'}
                  </td>
                  <td className="hidden py-2 sm:table-cell print:table-cell">
                    {(line.itemBatches ?? []).length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {t('grn.detail.untrackedLot')}
                      </span>
                    ) : (
                      (line.itemBatches ?? []).map(batch => (
                        <span key={batch.id} className="block text-xs">
                          {/* The batch number is the way into a recall: this
                              delivery may since have been split across stores,
                              and the trace page is what puts it back together. */}
                          <Link
                            to={`/inventories/lots/${batch.id}`}
                            className="font-mono hover:underline"
                            title={t('grn.detail.traceLot')}
                          >
                            {batch.batchNo}
                          </Link>
                          <span className="text-muted-foreground">
                            {' '}
                            · {t('grn.detail.batchLeft', { count: batch.batchQty })}
                            {batch.expiryDate
                              ? ` · ${t('grn.detail.expiry', { date: formatDate(batch.expiryDate) })}`
                              : ''}
                          </span>
                        </span>
                      ))
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatCurrency(line.itemPrice)}</td>
                  {/*
                    With the unit beside it, "2" reads as two cartons rather
                    than as a number whose unit the reader has to infer from
                    the item — and the note keeps saying so after the item's
                    units change, because the line recorded its own.
                  */}
                  <td className="py-2 text-right tabular-nums">
                    {formatQty(line.qty, line.uom?.entityName)}
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatCurrency(line.subTotal)}</td>
                  <td className="py-2 text-right" data-print-hide>
                    {!voided && can('update-grn') && (
                      <span className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={t('grn.detail.returnAria')}
                          onClick={() => {
                            setReturning(line);
                            setReturnQty(String(line.qty));
                            setReturnBatchId('');
                          }}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          aria-label={t('grn.detail.cancelAria')}
                          onClick={() => setCancelling(line)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {lines.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-muted-foreground">
                  {t('grn.detail.noLines')}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <dl className="ml-auto mt-4 max-w-xs space-y-1.5 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('grn.detail.subtotal')}</dt>
            <dd className="tabular-nums">{formatCurrency(grn.subTotal)}</dd>
          </div>
          {Number(grn.amountDiscount) > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('grn.detail.discount')}</dt>
              <dd className="tabular-nums">−{formatCurrency(grn.amountDiscount)}</dd>
            </div>
          )}
          {Number(grn.taxAmount ?? 0) > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {t('grn.detail.tax', { rate: grn.tax ?? 0 })}
              </dt>
              <dd className="tabular-nums">{formatCurrency(grn.taxAmount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
            <dt>{t('grn.detail.netAmount')}</dt>
            <dd className="tabular-nums">{formatCurrency(grn.netAmount)}</dd>
          </div>
        </dl>
      </Card>

      <Dialog open={!!returning} onOpenChange={isOpen => !isOpen && setReturning(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('grn.detail.returnModal.title')}</DialogTitle>
            <DialogDescription>{t('grn.detail.returnModal.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Field label={t('grn.detail.returnModal.quantity')} htmlFor="returnQty" required>
              <Input
                id="returnQty"
                inputMode="numeric"
                value={returnQty}
                onChange={event => setReturnQty(event.target.value)}
              />
            </Field>

            {(returning?.itemBatches ?? []).length > 0 && (
              <Field
                label={t('grn.detail.returnModal.batch')}
                htmlFor="returnBatchId"
                hint={t('grn.detail.returnModal.batchHint')}
              >
                <NativeSelect
                  id="returnBatchId"
                  value={returnBatchId}
                  onChange={event => setReturnBatchId(event.target.value)}
                >
                  <option value="">{t('grn.detail.returnModal.auto')}</option>
                  {(returning?.itemBatches ?? []).map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {t('grn.detail.returnModal.batchOption', {
                        batch: batch.batchNo,
                        count: batch.batchQty
                      })}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(null)} disabled={returningLine}>
              {t('common.action.cancel')}
            </Button>
            <Button
              disabled={returningLine || !(Number(returnQty) > 0)}
              onClick={() =>
                returning &&
                void returnLine({
                  itemId: returning.id,
                  payload: {
                    qty: Number(returnQty),
                    itemBatchId: returnBatchId ? Number(returnBatchId) : null
                  }
                })
              }
            >
              {returningLine && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('grn.detail.returnModal.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        open={!!cancelling}
        title={t('grn.detail.cancelModal.title')}
        confirmLabel={t('grn.detail.cancelModal.confirm')}
        description={
          cancelling
            ? t('grn.detail.cancelModal.body', {
                qty: cancelling.qty,
                item:
                  cancelling.itemStoreMap?.item?.itemName ??
                  t('grn.detail.cancelModal.unnamedItem')
              })
            : ''
        }
        deleting={cancellingLine}
        onCancel={() => setCancelling(null)}
        onConfirm={async () => {
          if (cancelling) await cancelLine(cancelling.id);
        }}
      />
    </>
  );
}
