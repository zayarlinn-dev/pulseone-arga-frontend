import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Ban, Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { orderService, type OrderCreatePayload } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Order } from '@/types/models';
import { OrderModal } from '../components/OrderModal';

const STATUS_VARIANT: Record<Order['orderStatus'], BadgeProps['variant']> = {
  ordered: 'warning',
  purchased: 'success',
  dispensed: 'info',
  returned: 'secondary',
  cancelled: 'destructive'
};

export default function OrderListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('');
  const extraParams = useMemo(
    () => (statusFilter ? { orderStatus: statusFilter } : {}),
    [statusFilter]
  );

  const list = useResourceList<Order>('/orders', 'orders', 'orderDate', extraParams);

  const [modalOpen, setModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState<Order | null>(null);

  const mutations = useResourceMutations<Order, OrderCreatePayload>(orderService, 'orders', t('orders.entity'), {
    onSuccess: () => {
      // Ordering changes what the patient's history panel shows as unbilled.
      queryClient.invalidateQueries({ queryKey: ['patient-summary'] });
      setModalOpen(false);
    }
  });

  const { mutateAsync: cancelOrder, isPending: isCancelling } = useMutation({
    mutationFn: (id: number) => orderService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['patient-summary'] });
      toast.success(t('orders.cancel.toast'));
      setCancelling(null);
    },
    onError: (error: Error) => toast.error(error.message || t('orders.cancel.failed'))
  });

  /** Only the unbilled lines are still owed; billed ones left with an invoice. */
  const outstandingTotal = (order: Order) =>
    (order.invoiceDetails ?? [])
      .filter(line => !line.invoiceId && line.orderStatus === 'ordered')
      .reduce((sum, line) => sum + Number(line.totalAmount), 0);

  const columns: Column<Order>[] = [
    { key: 'orderNo', hideBelow: 'md', header: t('orders.column.orderNo'), className: 'font-mono text-xs' },
    {
      header: t('orders.column.patient'),
      sortable: false,
      className: 'font-medium',
      render: row =>
        row.patient ? (
          <span className="flex flex-col">
            <span>{row.patient.patientName}</span>
            <span className="font-mono text-xs text-muted-foreground">{row.patient.patientNo}</span>
          </span>
        ) : (
          '-'
        )
    },
    {
      hideBelow: 'lg',
      header: t('orders.column.visit'),
      sortable: false,
      className: 'font-mono text-xs',
      render: row => row.visit?.visitCode ?? '-'
    },
    {
      header: t('orders.column.services'),
      sortable: false,
      render: row => {
        const details = row.invoiceDetails ?? [];
        if (details.length === 0) return '-';
        const [first, ...rest] = details;
        return (
          <span className="flex flex-col">
            <span className="truncate">
              {first.service?.serviceName ?? t('orders.unnamedService')}
            </span>
            {rest.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {t('orders.more', { count: rest.length })}
              </span>
            )}
          </span>
        );
      }
    },
    {
      hideBelow: 'md',
      header: t('orders.column.unbilled'),
      sortable: false,
      className: 'text-right tabular-nums',
      render: row => {
        const outstanding = outstandingTotal(row);
        return outstanding > 0 ? (
          <span className="font-medium">{formatCurrency(outstanding)}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      }
    },
    {
      key: 'orderStatus',
      header: t('common.label.status'),
      render: row => (
        <Badge variant={STATUS_VARIANT[row.orderStatus] ?? 'secondary'}>
          {t(`orders.status.${row.orderStatus}`)}
        </Badge>
      )
    },
    {
      key: 'orderDate',
      hideBelow: 'lg',
      header: t('orders.column.ordered'),
      render: row => formatDateTime(row.orderDate)
    },
    {
      header: t('common.label.actions'),
      sortable: false,
      className: 'w-32 text-right',
      render: row => {
        const outstanding = outstandingTotal(row);

        return (
          <div className="flex justify-end gap-1">
            {outstanding > 0 && can('create-invoice') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/billing/new?patientId=${row.patientId}`)}
                aria-label={t('orders.billAria', { number: row.orderNo })}
              >
                <Receipt className="h-4 w-4" />
                {t('orders.bill')}
              </Button>
            )}
            {row.orderStatus === 'ordered' && can('update-order') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => setCancelling(row)}
                aria-label={t('orders.cancelAria', { number: row.orderNo })}
              >
                <Ban className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <>
      <PageHeader
        title={t('orders.title')}
        description={t('orders.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('orders.searchPlaceholder')}
        actions={
          can('create-order') && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { item: t('orders.entity') })}
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NativeSelect
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className="h-8 w-auto min-w-40 text-xs"
          aria-label={t('orders.filter.label')}
        >
          <option value="">{t('orders.filter.all')}</option>
          <option value="ordered">{t('orders.status.ordered')}</option>
          <option value="purchased">{t('orders.status.purchased')}</option>
          <option value="cancelled">{t('orders.status.cancelled')}</option>
          <option value="returned">{t('orders.status.returned')}</option>
        </NativeSelect>
        {statusFilter && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('')}>
            {t('common.action.clear')}
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        emptyMessage={t('orders.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <OrderModal
        open={modalOpen}
        submitting={mutations.isCreating}
        onClose={() => setModalOpen(false)}
        onSubmit={payload => mutations.create(payload).then(() => undefined)}
      />

      <ConfirmDeleteModal
        open={!!cancelling}
        title={t('orders.cancel.title')}
        confirmLabel={t('orders.cancel.confirm')}
        description={cancelling ? t('orders.cancel.body', { number: cancelling.orderNo }) : ''}
        deleting={isCancelling}
        onCancel={() => setCancelling(null)}
        onConfirm={async () => {
          if (cancelling) await cancelOrder(cancelling.id);
        }}
      />
    </>
  );
}
