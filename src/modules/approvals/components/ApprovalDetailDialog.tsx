import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useQuery } from '@tanstack/react-query';
import { Check, CircleDot, MessageSquare, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { approvalService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ApprovalStep } from '@/types/erp';
import type { DecisionAction } from './ApprovalDecisionDialog';
import { StatusBadge, documentTypeLabel } from '../pages/ApprovalListPage';

interface ApprovalDetailDialogProps {
  requestId: number | null;
  onClose: () => void;
  onDecide: (id: number, requestNo: string, action: DecisionAction) => void;
}

/**
 * One request, opened out: what was asked for, where it is in the chain, and
 * everything anybody has said about it.
 *
 * The chain is drawn as a list with the current step marked rather than as a
 * progress bar, because what an approver needs to know is *who is next*, not
 * what fraction is done.
 */
export function ApprovalDetailDialog({ requestId, onClose, onDecide }: ApprovalDetailDialogProps) {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);

  const { data: request, isLoading } = useQuery({
    queryKey: ['approval', requestId],
    queryFn: () => approvalService.getById(requestId as number),
    enabled: requestId !== null
  });

  if (requestId === null) return null;

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        {isLoading || !request ? (
          <p className="py-8 text-center text-sm text-muted-foreground">...</p>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {t('approvals.detail.title', { no: request.requestNo })}
                <StatusBadge status={request.status} />
              </DialogTitle>
              <DialogDescription>
                {documentTypeLabel(t, request.documentType)}
                {request.documentNo ? ` · ${request.documentNo}` : ''}
                {Number(request.amount) > 0
                  ? ` · ${formatCurrency(Number(request.amount))}`
                  : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {request.reason && (
                <section>
                  <h3 className="mb-1 text-sm font-medium">{t('approvals.detail.reason')}</h3>
                  <p className="text-sm text-muted-foreground">{request.reason}</p>
                </section>
              )}

              {request.payload && Object.keys(request.payload).length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-medium">{t('approvals.detail.payload')}</h3>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                    {Object.entries(request.payload).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{humanise(key)}</dt>
                        <dd className="text-right font-medium">{renderValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              <section>
                <h3 className="mb-2 text-sm font-medium">{t('approvals.detail.chain')}</h3>
                <ol className="space-y-2">
                  {(request.workflow?.steps ?? []).map(step => (
                    <StepRow
                      key={step.id}
                      step={step}
                      isCurrent={
                        request.status === 'pending' && step.stepNo === request.currentStepNo
                      }
                      isDone={step.stepNo < request.currentStepNo || request.status === 'approved'}
                    />
                  ))}
                </ol>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-medium">{t('approvals.detail.history')}</h3>
                <ol className="space-y-2">
                  {(request.actions ?? []).map(action => (
                    <li key={action.id} className="flex gap-3 text-sm">
                      <ActionIcon action={action.action} />
                      <div className="min-w-0 flex-1">
                        <p>
                          <span className="font-medium">
                            {action.username ?? t('audit.summary.system')}
                          </span>{' '}
                          <span className="text-muted-foreground">
                            {actionVerb(t, action.action)}
                          </span>
                        </p>
                        {action.remarks && (
                          <p className="text-muted-foreground">{action.remarks}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateTime(action.actedAt)}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            {request.status === 'pending' && (
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => onDecide(request.id, request.requestNo, 'comment')}
                >
                  <MessageSquare className="h-4 w-4" />
                  {t('approvals.action.comment')}
                </Button>
                {can('act-approval') && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => onDecide(request.id, request.requestNo, 'reject')}
                    >
                      <X className="h-4 w-4" />
                      {t('approvals.action.reject')}
                    </Button>
                    <Button onClick={() => onDecide(request.id, request.requestNo, 'approve')}>
                      <Check className="h-4 w-4" />
                      {t('approvals.action.approve')}
                    </Button>
                  </>
                )}
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StepRow({
  step,
  isCurrent,
  isDone
}: {
  step: ApprovalStep;
  isCurrent: boolean;
  isDone: boolean;
}) {
  const { t } = useTranslation('erp');

  const approver = step.approverUser
    ? t('approvals.detail.byUser', { name: step.approverUser.username })
    : step.role
      ? t('approvals.detail.byRole', { role: step.role.roleName })
      : '-';

  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-md border px-3 py-2 text-sm',
        isCurrent && 'border-primary bg-primary/5'
      )}
    >
      <Badge variant={isDone ? 'success' : isCurrent ? 'default' : 'secondary'}>
        {step.stepNo}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{step.stepName}</p>
        <p className="text-xs text-muted-foreground">{approver}</p>
      </div>
      {isCurrent && <CircleDot className="h-4 w-4 shrink-0 text-primary" />}
      {isDone && !isCurrent && <Check className="h-4 w-4 shrink-0 text-success" />}
    </li>
  );
}

function ActionIcon({ action }: { action: string }) {
  const className = 'mt-0.5 h-4 w-4 shrink-0';

  switch (action) {
    case 'approve':
      return <Check className={cn(className, 'text-success')} />;
    case 'reject':
    case 'cancel':
      return <X className={cn(className, 'text-destructive')} />;
    default:
      return <MessageSquare className={cn(className, 'text-muted-foreground')} />;
  }
}

function actionVerb(t: TFunction<'erp'>, action: string): string {
  switch (action) {
    case 'approve':
      return t('approvals.action.approved');
    case 'reject':
      return t('approvals.action.rejected');
    case 'cancel':
      return t('approvals.action.cancelled');
    case 'comment':
      return t('approvals.action.commented');
    default:
      return t('approvals.action.submitted');
  }
}

function humanise(key: string): string {
  const spaced = key.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** The payload's shape belongs to whichever module raised the request. */
function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
