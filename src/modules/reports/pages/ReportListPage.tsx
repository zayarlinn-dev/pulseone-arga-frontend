import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Download, Play, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { reportDefinitionService, reportService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { formatDateTime } from '@/lib/utils';
import type { ExportFormat, ReportDefinition } from '@/types/erp';
import { ResultTable } from './ReportBuilderPage';

export default function ReportListPage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);

  const list = useResourceList<ReportDefinition>(
    '/reports/definitions',
    'report-definitions',
    'reportName',
    {},
    'asc'
  );

  const [running, setRunning] = useState<ReportDefinition | null>(null);
  const [deleting, setDeleting] = useState<ReportDefinition | null>(null);

  const mutations = useResourceMutations(
    reportDefinitionService,
    'report-definitions',
    t('reports.entity'),
    { onSuccess: () => setDeleting(null) }
  );

  const columns: Column<ReportDefinition>[] = [
    { key: 'reportCode', hideBelow: 'md', header: t('reports.column.code'), className: 'font-mono text-xs' },
    {
      key: 'reportName',
      header: t('reports.column.name'),
      className: 'font-medium',
      render: row => (
        <div className="flex items-center gap-2">
          {row.reportName}
          {row.isSystem && (
            <Badge variant="secondary" className="text-[10px]">
              {t('reports.systemBadge')}
            </Badge>
          )}
        </div>
      )
    },
    { key: 'category', header: t('reports.column.category') },
    { key: 'dataSource', hideBelow: 'lg', header: t('reports.column.source'), className: 'font-mono text-xs' },
    {
      header: t('common.label.actions', { ns: 'translation' }),
      sortable: false,
      className: 'w-32 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {can('run-report') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={t('reports.action.run')}
              onClick={() => setRunning(row)}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {/* Built-in reports are runnable and copyable but never editable, so
              an upgrade can rely on them still being what it shipped. */}
          {can('delete-report') && !row.isSystem && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              aria-label={t('common.action.delete', { ns: 'translation' })}
              onClick={() => setDeleting(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title={t('reports.title')}
        description={t('reports.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('reports.searchPlaceholder')}
        actions={
          can('run-report') && (
            <Button asChild>
              <Link to="/reports/builder">
                <Plus className="h-4 w-4" />
                {t('reports.action.build')}
              </Link>
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        emptyMessage={t('reports.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <RunSavedDialog definition={running} onClose={() => setRunning(null)} />

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title={t('reports.deleteTitle')}
        description={deleting ? t('reports.deleteBody', { name: deleting.reportName }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />

      <ExportHistory />
    </>
  );
}

/**
 * Running a saved report.
 *
 * The period is the only thing the reader supplies — everything else was
 * decided when the report was saved, which is the point of saving one.
 */
function RunSavedDialog({
  definition,
  onClose
}: {
  definition: ReportDefinition | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const seed = definition?.id ?? 0;
  const [seededFor, setSeededFor] = useState(seed);
  if (definition && seededFor !== seed) {
    setSeededFor(seed);
    setFromDate('');
    setToDate('');
  }

  const { data: result, isFetching } = useQuery({
    queryKey: ['report-run', definition?.id, fromDate, toDate],
    queryFn: () =>
      reportService.runSaved(definition?.id as number, {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined
      }),
    enabled: definition !== null
  });

  const exportSaved = useMutation({
    mutationFn: (format: ExportFormat) =>
      reportService.exportSaved(
        definition?.id as number,
        format,
        { fromDate: fromDate || undefined, toDate: toDate || undefined },
        definition?.reportName ?? 'report'
      ),
    onSuccess: () => toast.success(t('reports.export.done')),
    onError: (error: Error) => toast.error(error.message || t('reports.export.failed'))
  });

  if (!definition) return null;

  return (
    <Dialog open onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{definition.reportName}</DialogTitle>
          {definition.description && (
            <DialogDescription>{definition.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3">
          <Field label={t('reports.builder.from')} className="w-40">
            <Input
              type="date"
              value={fromDate}
              onChange={event => setFromDate(event.target.value)}
            />
          </Field>
          <Field label={t('reports.builder.to')} className="w-40">
            <Input type="date" value={toDate} onChange={event => setToDate(event.target.value)} />
          </Field>

          {can('export-report') && (
            <div className="ml-auto flex gap-1">
              {(['xlsx', 'csv', 'pdf'] as ExportFormat[]).map(format => (
                <Button
                  key={format}
                  size="sm"
                  variant="outline"
                  disabled={exportSaved.isPending}
                  onClick={() => exportSaved.mutate(format)}
                >
                  <Download className="h-4 w-4" />
                  {t(`reports.export.${format === 'xlsx' ? 'excel' : format}`)}
                </Button>
              ))}
            </div>
          )}
        </div>

        {isFetching ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t('reports.builder.running')}
          </p>
        ) : result ? (
          <ResultTable result={result} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/**
 * What has left the building.
 *
 * A spreadsheet of every patient's contact details walking out is an event
 * worth being able to ask about afterwards, so every export is logged and the
 * log is visible here rather than only in the database.
 */
function ExportHistory() {
  const { t } = useTranslation('erp');

  const { data } = useQuery({
    queryKey: ['report-runs'],
    queryFn: () => reportService.getRuns({ limit: 10 })
  });

  if (!data || data.data.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">{t('reports.runs.title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('reports.runs.description')}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th className="pb-2 pr-4 font-medium">{t('reports.runs.column.when')}</th>
                <th className="pb-2 pr-4 font-medium">{t('reports.runs.column.report')}</th>
                <th className="pb-2 pr-4 font-medium">{t('reports.runs.column.source')}</th>
                <th className="pb-2 pr-4 font-medium">{t('reports.runs.column.format')}</th>
                <th className="pb-2 pr-4 text-right font-medium">
                  {t('reports.runs.column.rows')}
                </th>
                <th className="pb-2 font-medium">{t('reports.runs.column.user')}</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map(run => (
                <tr key={run.id} className="border-t">
                  <td className="whitespace-nowrap py-2 pr-4">{formatDateTime(run.createdAt)}</td>
                  <td className="py-2 pr-4">{run.definition?.reportName ?? '-'}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{run.dataSource}</td>
                  <td className="py-2 pr-4">
                    <Badge variant={run.format === 'json' ? 'secondary' : 'warning'}>
                      {run.format.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{run.rowCount}</td>
                  <td className="py-2">{run.username ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
