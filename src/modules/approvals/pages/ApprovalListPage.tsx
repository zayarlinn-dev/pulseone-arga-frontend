import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Inbox, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { useResourceList } from '@/hooks/api/useResource';
import { approvalService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { ApprovalRequest, ApprovalStatus } from '@/types/erp';
import { ApprovalDecisionDialog, type DecisionAction } from '../components/ApprovalDecisionDialog';
import { ApprovalDetailDialog } from '../components/ApprovalDetailDialog';

interface ApprovalListPageProps {
  /**
   * The inbox is the same table narrowed to "waiting on me". It is a mode
   * rather than a second page because the columns, the actions and the decision
   * dialog are identical — only the source query differs.
   */
  inbox?: boolean;
}

export default function ApprovalListPage({ inbox = false }: ApprovalListPageProps) {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<string>(inbox ? '' : 'pending');
  const [documentType, setDocumentType] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);
  const [decision, setDecision] = useState<{ id: number; no: string; action: DecisionAction } | null>(
    null
  );

  const filters = {
    ...(status ? { status } : {}),
    ...(documentType ? { documentType } : {})
  };

  // The inbox has its own endpoint — "waiting on me" is a join the client
  // cannot express — so the two modes take different paths to the same table.
  const list = useResourceList<ApprovalRequest>(
    inbox ? '/approvals/inbox' : '/approvals',
    inbox ? 'approvals-inbox' : 'approvals',
    'requestedAt',
    inbox ? {} : filters
  );

  const { data: documentTypes } = useQuery({
    queryKey: ['approval-document-types'],
    queryFn: () => approvalService.getDocumentTypes(),
    staleTime: 60 * 60 * 1000
  });

  const decide = useMutation({
    mutationFn: ({ id, action, remarks }: { id: number; action: DecisionAction; remarks: string }) =>
      approvalService.decide(id, action, remarks),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approvals-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['approval-inbox-count'] });
      // A decision can change the document it was raised over — leave granted,
      // payroll approved — so the owning module's lists go stale with it.
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });

      toast.success(t(`approvals.toast.${variables.action}d` as 'approvals.toast.approved'));
      setDecision(null);
      setDetailId(null);
    },
    onError: (error: Error) => toast.error(error.message || t('approvals.toast.failed'))
  });

  const columns: Column<ApprovalRequest>[] = [
    {
      key: 'requestNo',
      hideBelow: 'md',
      header: t('approvals.column.requestNo'),
      className: 'font-mono text-xs'
    },
    {
      key: 'documentType',
      header: t('approvals.column.document'),
      render: row => (
        <div>
          <div>{documentTypeLabel(t, row.documentType)}</div>
          {row.documentNo && (
            <div className="font-mono text-xs text-muted-foreground">{row.documentNo}</div>
          )}
        </div>
      )
    },
    {
      key: 'amount',
      header: t('approvals.column.amount'),
      className: 'text-right tabular-nums',
      render: row =>
        Number(row.amount) > 0 ? formatCurrency(Number(row.amount)) : <span>-</span>
    },
    {
      hideBelow: 'lg',
      header: t('approvals.column.requestedBy'),
      sortable: false,
      render: row => row.requestedBy?.username ?? '-'
    },
    {
      key: 'requestedAt',
      hideBelow: 'lg',
      header: t('approvals.column.requestedAt'),
      className: 'whitespace-nowrap',
      render: row => formatDateTime(row.requestedAt)
    },
    {
      hideBelow: 'md',
      header: t('approvals.column.step'),
      sortable: false,
      render: row =>
        t('approvals.detail.stepOf', { current: row.currentStepNo, total: row.totalSteps })
    },
    {
      key: 'status',
      header: t('approvals.column.status'),
      render: row => <StatusBadge status={row.status} />
    },
    {
      header: t('common.label.actions', { ns: 'translation' }),
      sortable: false,
      className: 'w-32 text-right',
      render: row =>
        row.status === 'pending' && can('act-approval') ? (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-success"
              aria-label={t('approvals.action.approve')}
              onClick={event => {
                event.stopPropagation();
                setDecision({ id: row.id, no: row.requestNo, action: 'approve' });
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              aria-label={t('approvals.action.reject')}
              onClick={event => {
                event.stopPropagation();
                setDecision({ id: row.id, no: row.requestNo, action: 'reject' });
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null
    }
  ];

  return (
    <>
      <PageHeader
        title={inbox ? t('approvals.inboxTitle') : t('approvals.title')}
        description={inbox ? t('approvals.inboxDescription') : t('approvals.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('approvals.searchPlaceholder')}
      />

      {!inbox && (
        <Card className="mb-4">
          <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-3">
            <Field label={t('approvals.column.status')}>
              <NativeSelect value={status} onChange={event => setStatus(event.target.value)}>
                <option value="">{t('audit.filter.allActions')}</option>
                {(['pending', 'approved', 'rejected', 'cancelled'] as ApprovalStatus[]).map(
                  value => (
                    <option key={value} value={value}>
                      {t(`approvals.status.${value}`)}
                    </option>
                  )
                )}
              </NativeSelect>
            </Field>

            <Field label={t('approvals.column.document')}>
              <NativeSelect
                value={documentType}
                onChange={event => setDocumentType(event.target.value)}
              >
                <option value="">{t('audit.filter.allTypes')}</option>
                {documentTypes?.map(value => (
                  <option key={value} value={value}>
                    {documentTypeLabel(t, value)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </CardContent>
        </Card>
      )}

      {inbox && list.items.length === 0 && !list.loading && (
        <Card className="mb-4">
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('approvals.inboxEmpty')}</p>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        onRowClick={row => setDetailId(row.id)}
        emptyMessage={inbox ? t('approvals.inboxEmpty') : t('approvals.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <ApprovalDetailDialog
        requestId={detailId}
        onClose={() => setDetailId(null)}
        onDecide={(id, no, action) => setDecision({ id, no, action })}
      />

      <ApprovalDecisionDialog
        action={decision?.action ?? null}
        requestNo={decision?.no}
        submitting={decide.isPending}
        onClose={() => setDecision(null)}
        onConfirm={async remarks => {
          if (!decision) return;
          await decide.mutateAsync({ id: decision.id, action: decision.action, remarks });
        }}
      />
    </>
  );
}

export function StatusBadge({ status }: { status: ApprovalStatus }) {
  const { t } = useTranslation('erp');

  const variant =
    status === 'approved'
      ? 'success'
      : status === 'rejected'
        ? 'destructive'
        : status === 'cancelled'
          ? 'secondary'
          : 'warning';

  return <Badge variant={variant}>{t(`approvals.status.${status}`)}</Badge>;
}

/**
 * The document types this catalogue has copy for. Anything the backend adds
 * later is not in here, and falls back to its own slug.
 */
const KNOWN_DOCUMENT_TYPES = [
  'invoice-discount',
  'invoice-cancel',
  'refund-invoice',
  'stock-adjustment',
  'stock-damage',
  'grn',
  'leave-request',
  'payroll-run'
] as const;

type KnownDocumentType = (typeof KNOWN_DOCUMENT_TYPES)[number];

/**
 * Translates a document type, falling back to the raw slug.
 *
 * `t` is typed against the whole catalogue, so a key built at run time has to
 * be narrowed before it is passed. The membership check above is what makes
 * that assertion true rather than merely quiet: only a slug that is in the
 * literal tuple reaches the lookup.
 */
export function documentTypeLabel(t: TFunction<'erp'>, documentType: string): string {
  return KNOWN_DOCUMENT_TYPES.includes(documentType as KnownDocumentType)
    ? t(`approvals.documentType.${documentType as KnownDocumentType}`)
    : documentType;
}
