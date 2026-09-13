import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BellRing, Check, Play, RefreshCw, SkipForward, UserPlus, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { useDropdown } from '@/hooks/api/useDropdown';
import { queueService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import type { QueueToken } from '@/types/erp';
import { WalkInDialog } from '../components/WalkInDialog';

/**
 * The waiting room.
 *
 * The board polls rather than pushing, because the alternative is a socket per
 * clinic display and the state it shows changes every few minutes at most. Ten
 * seconds is fast enough that the person calling names is never working from a
 * stale list, and slow enough to be free.
 */
const POLL_INTERVAL_MS = 10_000;

export default function QueueBoardPage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);
  const queryClient = useQueryClient();

  const [serviceCenterId, setServiceCenterId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [doctorId, setDoctorId] = useState('');
  const [walkInOpen, setWalkInOpen] = useState(false);

  const { data: serviceCenters } = useDropdown('/dropdown/service-centers');
  const { data: doctors } = useDropdown('/dropdown/employees', { employmentCategory: 'doctor' });

  const isToday = date === new Date().toISOString().slice(0, 10);

  const {
    data: board,
    isLoading,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['queue-board', serviceCenterId, date],
    queryFn: () => queueService.getBoard(Number(serviceCenterId), date),
    enabled: Boolean(serviceCenterId),
    // Only today's board moves. Polling a past day would re-fetch a fixed
    // answer every ten seconds for as long as the tab is open.
    refetchInterval: isToday ? POLL_INTERVAL_MS : false
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['queue-board'] });

  const callNext = useMutation({
    mutationFn: () =>
      queueService.callNext({
        serviceCenterId: Number(serviceCenterId),
        doctorId: doctorId ? Number(doctorId) : null
      }),
    onSuccess: token => {
      invalidate();
      toast.success(t('queue.toast.called', { token: token.tokenLabel }));
    },
    onError: (error: Error) => {
      // "Nobody is waiting" is the ordinary end of a clinic, not a failure, so
      // it is said plainly rather than dressed as an error.
      const message = error.message.toLowerCase();
      if (message.includes('nobody')) {
        toast.info(t('queue.toast.nobodyWaiting'));
        return;
      }
      toast.error(error.message || t('queue.toast.failed'));
    }
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      queueService.updateStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast.success(t('queue.toast.updated'));
    },
    onError: (error: Error) => toast.error(error.message || t('queue.toast.failed'))
  });

  return (
    <>
      <PageHeader
        title={t('queue.title')}
        description={t('queue.description')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={!serviceCenterId}>
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              {t('queue.refresh')}
            </Button>
            {can('manage-queue') && (
              <Button onClick={() => setWalkInOpen(true)} disabled={!serviceCenterId}>
                <UserPlus className="h-4 w-4" />
                {t('queue.action.walkIn')}
              </Button>
            )}
          </div>
        }
      />

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-3">
          <Field label={t('queue.clinic')} required>
            <NativeSelect
              value={serviceCenterId}
              onChange={event => setServiceCenterId(event.target.value)}
            >
              <option value="">-</option>
              {serviceCenters?.map(centre => (
                <option key={centre.id} value={centre.id}>
                  {centre.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('queue.date')}>
            <Input type="date" value={date} onChange={event => setDate(event.target.value)} />
          </Field>

          <Field label={t('appointments.column.doctor')}>
            <NativeSelect value={doctorId} onChange={event => setDoctorId(event.target.value)}>
              <option value="">{t('audit.filter.allTypes')}</option>
              {doctors?.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>

      {!serviceCenterId ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t('queue.chooseClinic')}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">...</CardContent>
        </Card>
      ) : board ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label={t('queue.stat.waiting')} value={board.waiting.length} />
            <StatCard label={t('queue.stat.serving')} value={board.nowServing.length} />
            <StatCard label={t('queue.stat.completed')} value={board.completed} />
            <StatCard label={t('queue.stat.issued')} value={board.totalIssued} />
            <StatCard
              label={t('queue.stat.averageWait')}
              value={t('queue.minutes', { count: board.averageWaitMinutes })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{t('queue.nowServing')}</CardTitle>
                {can('manage-queue') && (
                  <Button size="sm" onClick={() => callNext.mutate()} disabled={callNext.isPending}>
                    <BellRing className="h-4 w-4" />
                    {t('queue.action.callNext')}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {board.nowServing.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {t('queue.nobodyServing')}
                  </p>
                ) : (
                  board.nowServing.map(token => (
                    <TokenRow
                      key={token.id}
                      token={token}
                      highlighted
                      canManage={can('manage-queue')}
                      onUpdate={status => updateStatus.mutate({ id: token.id, status })}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('queue.waiting')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {board.waiting.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {t('queue.nobodyWaiting')}
                  </p>
                ) : (
                  board.waiting.map(token => (
                    <TokenRow
                      key={token.id}
                      token={token}
                      canManage={can('manage-queue')}
                      onUpdate={status => updateStatus.mutate({ id: token.id, status })}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      <WalkInDialog
        open={walkInOpen}
        serviceCenterId={serviceCenterId ? Number(serviceCenterId) : null}
        onClose={() => setWalkInOpen(false)}
        onIssued={() => {
          invalidate();
          setWalkInOpen(false);
        }}
      />
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function TokenRow({
  token,
  highlighted,
  canManage,
  onUpdate
}: {
  token: QueueToken;
  highlighted?: boolean;
  canManage: boolean;
  onUpdate: (status: string) => void;
}) {
  const { t } = useTranslation('erp');

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border px-3 py-2',
        highlighted && 'border-primary bg-primary/5'
      )}
    >
      <div className="w-20 shrink-0">
        <div className="font-mono text-lg font-semibold tabular-nums">{token.tokenLabel}</div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{token.patient?.patientName ?? '-'}</p>
        <p className="truncate text-xs text-muted-foreground">
          {token.patient?.patientNo}
          {token.doctor ? ` · ${token.doctor.fullName}` : ''}
        </p>
      </div>

      {token.priority > 0 && (
        <Badge variant="warning" className="shrink-0">
          !
        </Badge>
      )}
      <Badge variant="secondary" className="shrink-0">
        {t(`queue.status.${token.status}`)}
      </Badge>

      {canManage && (
        <div className="flex shrink-0 gap-1">
          {token.status === 'called' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={t('queue.action.start')}
              onClick={() => onUpdate('serving')}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          {(token.status === 'called' || token.status === 'serving') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-success"
              aria-label={t('queue.action.complete')}
              onClick={() => onUpdate('completed')}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          {token.status === 'called' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={t('queue.action.skip')}
              onClick={() => onUpdate('skipped')}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            aria-label={t('queue.action.cancel')}
            onClick={() => onUpdate('cancelled')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
