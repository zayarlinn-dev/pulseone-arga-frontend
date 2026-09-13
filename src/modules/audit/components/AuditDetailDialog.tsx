import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog, FieldChange } from '@/types/erp';

interface AuditDetailDialogProps {
  entry: AuditLog | null;
  onClose: () => void;
}

/**
 * One audit entry, opened out.
 *
 * The diff is the point of the screen, so it comes first and the request
 * context sits under it. A `null` is rendered as the words "not set" rather
 * than as a blank cell, because a blank cell and an empty string look the same
 * and telling those apart is the reason the trail exists.
 */
export function AuditDetailDialog({ entry, onClose }: AuditDetailDialogProps) {
  const { t } = useTranslation('erp');

  if (!entry) return null;

  return (
    <Dialog open={Boolean(entry)} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('audit.detail.title')}</DialogTitle>
          <DialogDescription>
            {entry.summary || `${entry.action} ${entry.entityType} #${entry.entityId}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">{entry.entityType}</Badge>
            <span className="font-mono text-xs text-muted-foreground">#{entry.entityId}</span>
            <span className="text-muted-foreground">·</span>
            <span>{entry.username ?? t('audit.summary.system')}</span>
            {entry.role && <Badge variant="outline">{entry.role}</Badge>}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
          </div>

          <ChangeTable changes={entry.changes} />

          <div>
            <h3 className="mb-2 text-sm font-medium">{t('audit.detail.context')}</h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <ContextRow label={t('audit.detail.method')} value={entry.method} />
              <ContextRow label={t('audit.detail.path')} value={entry.path} mono />
              <ContextRow label={t('audit.detail.ipAddress')} value={entry.ipAddress} mono />
              <ContextRow label={t('audit.detail.requestId')} value={entry.requestId} mono />
              <ContextRow
                label={t('audit.detail.userAgent')}
                value={entry.userAgent}
                className="sm:col-span-2"
              />
            </dl>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChangeTable({ changes }: { changes?: FieldChange[] | null }) {
  const { t } = useTranslation('erp');

  if (!changes || changes.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('audit.detail.noChanges')}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">{t('audit.detail.field')}</th>
            <th className="px-3 py-2 text-left font-medium">{t('audit.detail.before')}</th>
            <th className="w-8" />
            <th className="px-3 py-2 text-left font-medium">{t('audit.detail.after')}</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((change, index) => (
            <tr key={`${change.field}-${index}`} className="border-t">
              <td className="px-3 py-2 font-medium">{humanise(change.field)}</td>
              <td className="px-3 py-2">
                <Value value={change.from} />
              </td>
              <td className="px-1 py-2 text-muted-foreground">
                <ArrowRight className="h-3.5 w-3.5" />
              </td>
              <td className="px-3 py-2">
                <Value value={change.to} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renders one side of a diff.
 *
 * `null` and `""` are drawn differently on purpose — the first as the words
 * "not set" in muted type, the second as visible empty quotes — because the
 * whole value of a change trail is being able to tell them apart.
 */
function Value({ value }: { value: unknown }) {
  const { t } = useTranslation('erp');

  if (value === null || value === undefined) {
    return <span className="text-xs italic text-muted-foreground">{t('audit.detail.notSet')}</span>;
  }
  if (value === '') {
    return <span className="text-xs italic text-muted-foreground">&quot;&quot;</span>;
  }
  if (typeof value === 'boolean') {
    return <Badge variant={value ? 'default' : 'secondary'}>{String(value)}</Badge>;
  }
  if (typeof value === 'object') {
    return <code className="text-xs">{JSON.stringify(value)}</code>;
  }

  return <span className="break-all">{String(value)}</span>;
}

function ContextRow({
  label,
  value,
  mono,
  className
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
  className?: string;
}) {
  if (!value) return null;

  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? 'break-all font-mono text-xs' : 'break-all'}>{value}</dd>
    </div>
  );
}

/** "chiefComplaint" reads better as "Chief complaint" above a diff. */
function humanise(field: string): string {
  const spaced = field.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
