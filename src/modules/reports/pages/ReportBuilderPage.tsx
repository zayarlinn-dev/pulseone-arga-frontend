import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, Download, Play, Plus, Save, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { reportDefinitionService, reportService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import type {
  AggregateFunction,
  ExportFormat,
  ReportAggregate,
  ReportFilter,
  ReportOperator,
  ReportRequest,
  ReportResult,
  ReportSource
} from '@/types/erp';

const OPERATORS: ReportOperator[] = [
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'in',
  'isNull',
  'notNull'
];

const AGGREGATES: AggregateFunction[] = ['sum', 'avg', 'min', 'max', 'count'];

/** Operators that take no value, so the value box is hidden for them. */
const VALUELESS: ReportOperator[] = ['isNull', 'notNull'];

/**
 * The report builder.
 *
 * Everything offered here is what the server said this caller may read: the
 * source list is already filtered by privilege, and the columns, filters and
 * groupings come from the source's own declaration. Nothing free-typed reaches
 * the query — which is what makes running user-described SQL safe at all.
 */
export default function ReportBuilderPage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);
  const [searchParams] = useSearchParams();

  const [dataSource, setDataSource] = useState(searchParams.get('source') ?? '');
  const [columns, setColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [aggregates, setAggregates] = useState<ReportAggregate[]>([]);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [result, setResult] = useState<ReportResult | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  const { data: sources } = useQuery({
    queryKey: ['report-sources'],
    queryFn: () => reportService.getSources(),
    staleTime: 10 * 60 * 1000
  });

  const source: ReportSource | undefined = useMemo(
    () => sources?.find(entry => entry.key === dataSource),
    [sources, dataSource]
  );

  const request: ReportRequest = {
    dataSource,
    columns,
    filters,
    groupBy,
    aggregates,
    sortBy: sortBy || undefined,
    sortOrder,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined
  };

  const run = useMutation({
    mutationFn: () => reportService.run(request),
    onSuccess: setResult,
    onError: (error: Error) => toast.error(error.message)
  });

  const exportReport = useMutation({
    mutationFn: (format: ExportFormat) =>
      reportService.export(request, format, source?.label ?? 'report'),
    onSuccess: () => toast.success(t('reports.export.done')),
    onError: (error: Error) => toast.error(error.message || t('reports.export.failed'))
  });

  const resetForSource = (key: string) => {
    setDataSource(key);
    // Every selection below names a column of the old source, so none of them
    // survives the change — keeping them would produce a request the server
    // rejects field by field.
    setColumns([]);
    setFilters([]);
    setGroupBy([]);
    setAggregates([]);
    setSortBy('');
    setResult(null);
  };

  const isGrouped = groupBy.length > 0;
  const canRun = Boolean(dataSource && (columns.length > 0 || isGrouped));

  return (
    <>
      <PageHeader
        title={t('reports.builder.title')}
        description={t('reports.builder.description')}
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => run.mutate()} disabled={!canRun || run.isPending}>
              <Play className="h-4 w-4" />
              {run.isPending ? t('reports.builder.running') : t('reports.builder.run')}
            </Button>
            {can('create-report') && (
              <Button variant="outline" onClick={() => setSaveOpen(true)} disabled={!canRun}>
                <Save className="h-4 w-4" />
                {t('reports.action.save')}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('reports.builder.source')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {sources && sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('reports.builder.noSources')}</p>
              ) : (
                <NativeSelect
                  value={dataSource}
                  onChange={event => resetForSource(event.target.value)}
                >
                  <option value="">{t('reports.builder.chooseSource')}</option>
                  {sources?.map(entry => (
                    <option key={entry.key} value={entry.key}>
                      {entry.category} · {entry.label}
                    </option>
                  ))}
                </NativeSelect>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <Field label={t('reports.builder.from')}>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={event => setFromDate(event.target.value)}
                  />
                </Field>
                <Field label={t('reports.builder.to')}>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={event => setToDate(event.target.value)}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {source && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('reports.builder.columns')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {source.columns.map(column => {
                      const picked = columns.includes(column.key);
                      return (
                        <button
                          key={column.key}
                          type="button"
                          onClick={() =>
                            setColumns(
                              picked
                                ? columns.filter(key => key !== column.key)
                                : [...columns, column.key]
                            )
                          }
                          className={cn(
                            'rounded-full border px-2.5 py-1 text-xs transition-colors',
                            picked
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'hover:bg-accent'
                          )}
                        >
                          {column.label}
                        </button>
                      );
                    })}
                  </div>
                  {columns.length === 0 && !isGrouped && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t('reports.builder.chooseColumns')}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-base">{t('reports.builder.filters')}</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setFilters([
                        ...filters,
                        {
                          field: source.columns.find(column => column.filterable)?.key ?? '',
                          operator: 'eq',
                          value: ''
                        }
                      ])
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {filters.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {t('reports.builder.addFilter')}
                    </p>
                  )}
                  {filters.map((filter, index) => (
                    <div key={index} className="space-y-2 rounded-md border p-2">
                      <div className="flex gap-2">
                        <NativeSelect
                          className="flex-1"
                          value={filter.field}
                          onChange={event =>
                            setFilters(
                              filters.map((entry, i) =>
                                i === index ? { ...entry, field: event.target.value } : entry
                              )
                            )
                          }
                        >
                          {source.columns
                            .filter(column => column.filterable)
                            .map(column => (
                              <option key={column.key} value={column.key}>
                                {column.label}
                              </option>
                            ))}
                        </NativeSelect>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-destructive"
                          aria-label={t('common.action.delete', { ns: 'translation' })}
                          onClick={() => setFilters(filters.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <NativeSelect
                          className="w-32"
                          value={filter.operator}
                          onChange={event =>
                            setFilters(
                              filters.map((entry, i) =>
                                i === index
                                  ? { ...entry, operator: event.target.value as ReportOperator }
                                  : entry
                              )
                            )
                          }
                        >
                          {OPERATORS.map(operator => (
                            <option key={operator} value={operator}>
                              {t(`reports.operator.${operator}`)}
                            </option>
                          ))}
                        </NativeSelect>

                        {!VALUELESS.includes(filter.operator) && (
                          <Input
                            className="flex-1"
                            value={String(filter.value ?? '')}
                            placeholder={t('reports.builder.value')}
                            onChange={event =>
                              setFilters(
                                filters.map((entry, i) =>
                                  i === index
                                    ? {
                                        ...entry,
                                        // "is one of" takes a list; splitting on
                                        // commas is what the box is for.
                                        value:
                                          entry.operator === 'in'
                                            ? event.target.value
                                                .split(',')
                                                .map(part => part.trim())
                                                .filter(Boolean)
                                            : event.target.value
                                      }
                                    : entry
                                )
                              )
                            }
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('reports.builder.grouping')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {source.columns
                      .filter(column => column.groupable)
                      .map(column => {
                        const picked = groupBy.includes(column.key);
                        return (
                          <button
                            key={column.key}
                            type="button"
                            onClick={() =>
                              setGroupBy(
                                picked
                                  ? groupBy.filter(key => key !== column.key)
                                  : [...groupBy, column.key]
                              )
                            }
                            className={cn(
                              'rounded-full border px-2.5 py-1 text-xs transition-colors',
                              picked
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'hover:bg-accent'
                            )}
                          >
                            {column.label}
                          </button>
                        );
                      })}
                  </div>

                  {isGrouped && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {t('reports.builder.aggregates')}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setAggregates([
                              ...aggregates,
                              {
                                field:
                                  source.columns.find(column => column.aggregatable)?.key ?? '',
                                function: 'sum'
                              }
                            ])
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {aggregates.map((aggregate, index) => (
                        <div key={index} className="flex gap-2">
                          <NativeSelect
                            className="w-28"
                            value={aggregate.function}
                            onChange={event =>
                              setAggregates(
                                aggregates.map((entry, i) =>
                                  i === index
                                    ? {
                                        ...entry,
                                        function: event.target.value as AggregateFunction
                                      }
                                    : entry
                                )
                              )
                            }
                          >
                            {AGGREGATES.map(fn => (
                              <option key={fn} value={fn}>
                                {t(`reports.aggregate.${fn}`)}
                              </option>
                            ))}
                          </NativeSelect>

                          <NativeSelect
                            className="flex-1"
                            value={aggregate.field}
                            onChange={event =>
                              setAggregates(
                                aggregates.map((entry, i) =>
                                  i === index ? { ...entry, field: event.target.value } : entry
                                )
                              )
                            }
                          >
                            {source.columns
                              .filter(column => column.aggregatable)
                              .map(column => (
                                <option key={column.key} value={column.key}>
                                  {column.label}
                                </option>
                              ))}
                          </NativeSelect>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-destructive"
                            aria-label={t('common.action.delete', { ns: 'translation' })}
                            onClick={() =>
                              setAggregates(aggregates.filter((_, i) => i !== index))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Field label={t('reports.builder.sortBy')}>
                      <NativeSelect
                        value={sortBy}
                        onChange={event => setSortBy(event.target.value)}
                      >
                        <option value="">-</option>
                        {source.columns.map(column => (
                          <option key={column.key} value={column.key}>
                            {column.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                    <Field label={t('reports.builder.sortOrder')}>
                      <NativeSelect
                        value={sortOrder}
                        onChange={event => setSortOrder(event.target.value as 'asc' | 'desc')}
                      >
                        <option value="asc">{t('reports.sortOrder.asc')}</option>
                        <option value="desc">{t('reports.sortOrder.desc')}</option>
                      </NativeSelect>
                    </Field>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {t('reports.builder.results')}
              {result && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {t('reports.builder.rowCount', { count: result.rowCount })} ·{' '}
                  {t('reports.builder.duration', { ms: result.durationMs })}
                </span>
              )}
            </CardTitle>

            {result && can('export-report') && (
              <div className="flex gap-1">
                {(['xlsx', 'csv', 'pdf'] as ExportFormat[]).map(format => (
                  <Button
                    key={format}
                    size="sm"
                    variant="outline"
                    disabled={exportReport.isPending}
                    onClick={() => exportReport.mutate(format)}
                  >
                    <Download className="h-4 w-4" />
                    {t(`reports.export.${format === 'xlsx' ? 'excel' : format}`)}
                  </Button>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent>
            {!result ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t('reports.builder.runFirst')}
              </p>
            ) : (
              <ResultTable result={result} />
            )}
          </CardContent>
        </Card>
      </div>

      <SaveReportDialog
        open={saveOpen}
        request={request}
        sourceLabel={source?.label ?? ''}
        sourceCategory={source?.category ?? ''}
        onClose={() => setSaveOpen(false)}
        onSaved={() => setSaveOpen(false)}
      />
    </>
  );
}

export function ResultTable({ result }: { result: ReportResult }) {
  const { t } = useTranslation('erp');

  if (result.rows.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {t('reports.builder.noResults')}
      </p>
    );
  }

  return (
    <>
      {result.truncated && (
        <div className="mb-3 flex gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>{t('reports.builder.truncated', { count: result.rowCount })}</span>
        </div>
      )}

      <div className="max-h-[60vh] overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/95">
            <tr>
              {result.columns.map(column => (
                <th
                  key={column.key}
                  className={cn(
                    'whitespace-nowrap px-3 py-2 font-medium',
                    isNumeric(column.type) ? 'text-right' : 'text-left'
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, index) => (
              <tr key={index} className="border-t">
                {result.columns.map(column => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-3 py-1.5',
                      isNumeric(column.type) && 'text-right tabular-nums'
                    )}
                  >
                    {formatCell(row[column.key], column.type)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function isNumeric(type: string): boolean {
  return type === 'number' || type === 'money';
}

/** Mirrors the server's own formatting so the screen and the export agree. */
function formatCell(value: unknown, type: string): string {
  if (value === null || value === undefined) return '';

  switch (type) {
    case 'money': {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? String(value) : parsed.toFixed(2);
    }
    case 'date':
      return String(value).slice(0, 10);
    case 'datetime':
      return String(value).slice(0, 16).replace('T', ' ');
    case 'bool':
      return value ? 'Yes' : 'No';
    default:
      return String(value);
  }
}

function SaveReportDialog({
  open,
  request,
  sourceLabel,
  sourceCategory,
  onClose,
  onSaved
}: {
  open: boolean;
  request: ReportRequest;
  sourceLabel: string;
  sourceCategory: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('erp');

  const [reportCode, setReportCode] = useState('');
  const [reportName, setReportName] = useState('');
  const [description, setDescription] = useState('');

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setReportCode('');
      setReportName(sourceLabel);
      setDescription('');
    }
  }

  const save = useMutation({
    mutationFn: () =>
      reportDefinitionService.create({
        reportCode,
        reportName,
        description: description || null,
        category: sourceCategory,
        dataSource: request.dataSource,
        columns: request.columns ?? [],
        filters: request.filters ?? [],
        groupBy: request.groupBy ?? [],
        aggregates: request.aggregates ?? [],
        sortBy: request.sortBy ?? null,
        sortOrder: request.sortOrder ?? null
      }),
    onSuccess: () => {
      toast.success(t('reports.save.saved'));
      onSaved();
    },
    onError: (error: Error) => toast.error(error.message || t('reports.save.failed'))
  });

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('reports.save.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label={t('reports.save.code')} required>
            <Input
              value={reportCode}
              maxLength={40}
              onChange={event => setReportCode(event.target.value)}
            />
          </Field>
          <Field label={t('reports.save.name')} required>
            <Input
              value={reportName}
              maxLength={80}
              onChange={event => setReportName(event.target.value)}
            />
          </Field>
          <Field label={t('reports.save.description')}>
            <Textarea
              rows={2}
              value={description}
              onChange={event => setDescription(event.target.value)}
            />
          </Field>
          <Badge variant="secondary">{sourceCategory}</Badge>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={!reportCode.trim() || !reportName.trim() || save.isPending}
          >
            {t('reports.save.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
