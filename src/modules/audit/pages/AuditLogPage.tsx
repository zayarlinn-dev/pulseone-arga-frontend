import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useQuery } from '@tanstack/react-query';
import { History, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { useResourceList } from '@/hooks/api/useResource';
import { auditService } from '@/services/erpService';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/types/erp';
import { AuditDetailDialog } from '../components/AuditDetailDialog';

/**
 * The change trail.
 *
 * The list is the screen, and the summary above it describes exactly the rows
 * underneath — both read the same filters, so the counts and the table can
 * never disagree.
 */
export default function AuditLogPage() {
  const { t } = useTranslation('erp');

  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const filters = {
    ...(entityType ? { entityType } : {}),
    ...(action ? { action } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {})
  };

  const list = useResourceList<AuditLog>('/audit-logs', 'audit-logs', 'createdAt', filters);

  const { data: options } = useQuery({
    queryKey: ['audit-filter-options'],
    queryFn: () => auditService.getFilterOptions(),
    // The distinct lists only change when a new kind of record is first
    // touched, so re-reading them on every filter change is wasted work.
    staleTime: 5 * 60 * 1000
  });

  const { data: summary } = useQuery({
    queryKey: ['audit-summary', filters, list.searchQuery],
    queryFn: () =>
      auditService.getSummary({
        ...filters,
        ...(list.searchQuery ? { search: list.searchQuery } : {})
      })
  });

  const hasFilters = Boolean(entityType || action || fromDate || toDate);

  const clearFilters = () => {
    setEntityType('');
    setAction('');
    setFromDate('');
    setToDate('');
  };

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      header: t('audit.column.when'),
      className: 'whitespace-nowrap',
      render: row => formatDateTime(row.createdAt)
    },
    {
      key: 'username',
      hideBelow: 'sm',
      header: t('audit.column.user'),
      render: row => (
        <div className="flex items-center gap-2">
          <span>{row.username ?? t('audit.summary.system')}</span>
          {row.role && (
            <Badge variant="outline" className="text-[10px]">
              {row.role}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'action',
      header: t('audit.column.action'),
      render: row => <ActionBadge action={row.action} />
    },
    {
      key: 'entityType',
      hideBelow: 'md',
      header: t('audit.column.record'),
      render: row => (
        <div className="flex items-center gap-1.5">
          <span>{row.entityType}</span>
          <span className="font-mono text-xs text-muted-foreground">#{row.entityId}</span>
        </div>
      )
    },
    {
      hideBelow: 'lg',
      header: t('audit.column.summary'),
      sortable: false,
      render: row => <span className="text-muted-foreground">{row.summary || '-'}</span>
    },
    {
      header: t('audit.column.changes'),
      sortable: false,
      className: 'w-20 text-right',
      render: row =>
        row.changes && row.changes.length > 0 ? (
          <Badge variant="secondary">{row.changes.length}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
    }
  ];

  return (
    <>
      <PageHeader
        title={t('audit.title')}
        description={t('audit.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('audit.searchPlaceholder')}
      />

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-5">
          <Field label={t('audit.filter.entityType')}>
            <NativeSelect value={entityType} onChange={event => setEntityType(event.target.value)}>
              <option value="">{t('audit.filter.allTypes')}</option>
              {options?.entityTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('audit.filter.action')}>
            <NativeSelect value={action} onChange={event => setAction(event.target.value)}>
              <option value="">{t('audit.filter.allActions')}</option>
              {options?.actions.map(value => (
                <option key={value} value={value}>
                  {actionLabel(t, value)}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('audit.filter.from')}>
            <Input
              type="date"
              value={fromDate}
              onChange={event => setFromDate(event.target.value)}
            />
          </Field>

          <Field label={t('audit.filter.to')}>
            <Input type="date" value={toDate} onChange={event => setToDate(event.target.value)} />
          </Field>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              disabled={!hasFilters}
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
              {t('audit.filter.clear')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {summary && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('audit.summary.total')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">
                {summary.total.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <BreakdownCard title={t('audit.summary.byAction')} rows={summary.byAction} translateAction />
          <BreakdownCard title={t('audit.summary.byUser')} rows={summary.byUser} />
          <BreakdownCard title={t('audit.summary.byEntity')} rows={summary.byEntity} />
        </div>
      )}

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        onRowClick={setSelected}
        emptyMessage={t('audit.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <AuditDetailDialog entry={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function BreakdownCard({
  title,
  rows,
  translateAction
}: {
  title: string;
  rows: { label: string; count: number }[];
  translateAction?: boolean;
}) {
  const { t } = useTranslation('erp');

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Four rows, not twenty: this is an orientation panel, not a report. */}
        {rows.slice(0, 4).map(row => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="truncate">
              {translateAction ? actionLabel(t, row.label) : row.label}
            </span>
            <span className="tabular-nums text-muted-foreground">{row.count}</span>
          </div>
        ))}
        {rows.length === 0 && <span className="text-sm text-muted-foreground">-</span>}
      </CardContent>
    </Card>
  );
}

/** The tint carries the weight of the action at a glance. */
function ActionBadge({ action }: { action: string }) {
  const { t } = useTranslation('erp');

  const variant =
    action === 'delete' || action === 'reject' || action === 'cancel'
      ? 'destructive'
      : action === 'create' || action === 'approve'
        ? 'success'
        : action === 'export'
          ? 'warning'
          : 'secondary';

  return <Badge variant={variant}>{actionLabel(t, action)}</Badge>;
}

/** The actions this catalogue has copy for. */
const KNOWN_ACTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'approve',
  'reject',
  'cancel',
  'export',
  'view'
] as const;

type KnownAction = (typeof KNOWN_ACTIONS)[number];

/**
 * Translates a known action, falling back to the raw slug.
 *
 * The filter list comes from whatever is actually in the table, which may
 * include an action written by a later version of the backend, so an
 * untranslated value has to render as itself rather than as a missing key.
 *
 * The membership check is what makes the narrowing below sound: only a slug
 * present in the literal tuple is passed to `t`.
 */
function actionLabel(t: TFunction<'erp'>, action: string): string {
  return KNOWN_ACTIONS.includes(action as KnownAction)
    ? t(`audit.action.${action as KnownAction}`)
    : action;
}

/** The panel a document screen embeds to show its own history. */
export function EntityHistoryPanel({
  entityType,
  entityId
}: {
  entityType: string;
  entityId: number | string;
}) {
  const { t } = useTranslation('erp');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-history', entityType, entityId],
    queryFn: () => auditService.getEntityHistory(entityType, entityId)
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4" />
          {t('audit.history.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">...</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('audit.history.empty')}</p>
        ) : (
          <ol className="space-y-3">
            {data.map(entry => (
              <li key={entry.id} className="flex gap-3 text-sm">
                <div className="w-36 shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(entry.createdAt)}
                </div>
                <div className="min-w-0 flex-1">
                  <p>{entry.summary || entry.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.username ?? t('audit.summary.system')}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
