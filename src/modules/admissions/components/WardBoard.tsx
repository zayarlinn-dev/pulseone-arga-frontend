import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { roomService } from '@/services';
import { cn } from '@/lib/utils';
import { BOARD_STATUSES, ROOM_STATUS_LOOK, compareFloors, compareRoomNames } from '../roomStatus';
import { FloorPlan } from './FloorPlan';
import { RoomDetailPanel } from './RoomDetailPanel';
import type { CheckIn, RoomBoardEntry, Room } from '@/types/models';

interface WardBoardProps {
  onAdmit: (room: Room) => void;
  onEdit: (admission: CheckIn) => void;
  onDischarge: (admission: CheckIn) => void;
}

/** The tab that drops the floor filter. Not a floor label, so it cannot collide. */
const ALL_FLOORS = '__all__';

/** Rooms with no floor recorded are their own group, keyed by the empty string. */
function floorKey(entry: RoomBoardEntry): string {
  return entry.floor?.trim() || '';
}

function bedTotals(entries: RoomBoardEntry[]) {
  let beds = 0;
  let taken = 0;
  let freeRooms = 0;

  for (const entry of entries) {
    const roomBeds = Math.max(entry.totalBeds, 1);
    beds += roomBeds;
    taken += Math.min(entry.occupants.length, roomBeds);
    if (entry.roomStatus === 'available' && entry.isActive !== false) freeRooms += 1;
  }

  return {
    rooms: entries.length,
    beds,
    taken,
    freeRooms,
    occupancy: beds > 0 ? Math.round((taken / beds) * 100) : 0
  };
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('text-lg font-semibold tabular-nums', tone)}>{value}</p>
    </div>
  );
}

/**
 * The ward at a glance: one floor at a time, every room on it drawn where it
 * stands, with the patient in it named on the tile.
 *
 * This is the admissions screen's home view rather than the table, because the
 * questions asked at the desk — is there a free bed, which one, who is in 204 —
 * are questions about the building. A table can answer them, but only after
 * being read; the plan answers them by being looked at.
 *
 * A floor at a time, because that is the unit staff work in: a nurse covering
 * the second floor should not have to scroll the fourth to reach it. The
 * headline figures follow the chosen floor for the same reason.
 *
 * Filtering is client-side. The whole board is one request of at most a few
 * hundred rooms, and paging a floor plan would hide exactly the free bed the
 * clerk is hunting for.
 */
export function WardBoard({ onAdmit, onEdit, onDischarge }: WardBoardProps) {
  const { t } = useTranslation();
  const isWide = useMediaQuery('(min-width: 1280px)');

  const {
    data: entries = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['rooms-board'],
    queryFn: () => roomService.getBoard()
  });

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  /** Null until the clerk picks a floor; the board opens on the lowest one. */
  const [floor, setFloor] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const floors = useMemo(
    () => Array.from(new Set(entries.map(floorKey))).sort(compareFloors),
    [entries]
  );

  // A remembered floor that no longer exists (renamed, or the board reloaded
  // with a different set) falls back rather than showing an empty plan.
  const activeFloor =
    floor !== null && (floor === ALL_FLOORS || floors.includes(floor))
      ? floor
      : (floors[0] ?? ALL_FLOORS);

  const onFloor = useMemo(
    () =>
      activeFloor === ALL_FLOORS ? entries : entries.filter(entry => floorKey(entry) === activeFloor),
    [entries, activeFloor]
  );

  const totals = useMemo(() => bedTotals(onFloor), [onFloor]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of onFloor) {
      counts[entry.roomStatus] = (counts[entry.roomStatus] ?? 0) + 1;
    }
    return counts;
  }, [onFloor]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return onFloor.filter(entry => {
      if (status && entry.roomStatus !== status) return false;
      if (!term) return true;

      const haystack = [
        entry.roomName,
        entry.roomCode,
        ...entry.occupants.flatMap(occupant => [
          occupant.admissionNo,
          occupant.patient?.patientName,
          occupant.patient?.patientNo,
          occupant.attendingDoctor?.fullName
        ])
      ];

      return haystack.some(value => value?.toLowerCase().includes(term));
    });
  }, [onFloor, search, status]);

  const byFloor = useMemo(() => {
    const groups = new Map<string, RoomBoardEntry[]>();

    for (const entry of filtered) {
      const key = floorKey(entry);
      const group = groups.get(key);
      if (group) group.push(entry);
      else groups.set(key, [entry]);
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => compareFloors(a, b))
      .map(([key, rooms]) => ({
        floor: key,
        rooms: [...rooms].sort((a, b) => compareRoomNames(a.roomName, b.roomName))
      }));
  }, [filtered]);

  // Read back from the query data rather than holding the room itself, so the
  // panel follows an admission or a discharge without being told about it.
  const selected = entries.find(entry => entry.id === selectedRoomId) ?? null;
  const filtersApplied = !!(search || status);

  const floorLabel = (value: string) =>
    value ? t('admissions.floorName', { floor: value }) : t('admissions.noFloor');

  const floorTabs = [
    ...floors.map(value => ({ value, label: floorLabel(value) })),
    ...(floors.length > 1 ? [{ value: ALL_FLOORS, label: t('common.label.all') }] : [])
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : t('common.toast.error')}
        </p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          {t('common.action.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {floorTabs.length > 1 && (
        <div
          className="flex items-end gap-1 overflow-x-auto border-b"
          role="group"
          aria-label={t('rooms.column.floor')}
        >
          {floorTabs.map(tab => {
            const active = activeFloor === tab.value;
            const scope =
              tab.value === ALL_FLOORS
                ? entries
                : entries.filter(entry => floorKey(entry) === tab.value);
            const counts = bedTotals(scope);

            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setFloor(tab.value);
                  setSelectedRoomId(null);
                }}
                aria-pressed={active}
                className={cn(
                  'flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors',
                  active
                    ? 'border-primary font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-px text-[11px] tabular-nums',
                    active ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {counts.taken}/{counts.beds}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t('rooms.title')} value={String(totals.rooms)} />
        <Stat
          label={t('rooms.roomStatus.available')}
          value={String(totals.freeRooms)}
          tone="text-success"
        />
        {/* Rooms actually holding a patient — not "everything that is not
            free", which would fold in the ones being cleaned or repaired. */}
        <Stat
          label={t('rooms.roomStatus.occupied')}
          value={String(statusCounts.occupied ?? 0)}
          tone="text-info"
        />
        {/* Beds, not rooms: a six-bed ward with one patient in it is one room
            gone but five beds still to fill, and only the bed figure says so. */}
        <div className="rounded-lg border bg-card px-3 py-2 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {t('rooms.column.beds')}
          </p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold tabular-nums">
              {totals.taken}/{totals.beds}
            </p>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
              <span
                className={cn(
                  'block h-full rounded-full transition-[width] duration-300',
                  totals.occupancy >= 90
                    ? 'bg-destructive'
                    : totals.occupancy >= 70
                      ? 'bg-warning'
                      : 'bg-success'
                )}
                style={{ width: `${totals.occupancy}%` }}
              />
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={t('common.action.searchPlaceholder')}
            aria-label={t('common.action.searchPlaceholder')}
            className="h-8 pl-8 text-xs"
          />
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label={t('rooms.filterStatus')}
        >
          <button
            type="button"
            onClick={() => setStatus('')}
            aria-pressed={status === ''}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs transition-colors',
              status === '' ? 'border-foreground/30 bg-secondary font-medium' : 'hover:bg-muted'
            )}
          >
            {t('rooms.allStatuses')}
          </button>
          {BOARD_STATUSES.map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(current => (current === value ? '' : value))}
              aria-pressed={status === value}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
                status === value ? 'border-foreground/30 bg-secondary font-medium' : 'hover:bg-muted'
              )}
            >
              <span
                className={cn('h-2 w-2 rounded-full', ROOM_STATUS_LOOK[value].dot)}
                aria-hidden
              />
              {t(`rooms.roomStatus.${value}`)}
              <span className="tabular-nums text-muted-foreground">
                {statusCounts[value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => void refetch()}
          aria-label={t('common.action.refresh')}
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          {t('common.action.refresh')}
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[7.25rem] animate-pulse rounded-lg border bg-muted/50"
                />
              ))}
            </div>
          ) : byFloor.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
              <p className="text-sm font-medium">
                {t(entries.length === 0 ? 'rooms.empty' : 'common.table.noResults')}
              </p>
              {filtersApplied && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStatus('');
                  }}
                >
                  {t('common.action.clearFilters')}
                </Button>
              )}
            </div>
          ) : (
            byFloor.map(group => (
              <FloorPlan
                key={group.floor || 'none'}
                floor={group.floor}
                rooms={group.rooms}
                selectedRoomId={selectedRoomId}
                onSelect={entry => setSelectedRoomId(entry.id)}
              />
            ))
          )}
        </div>

        {isWide && (
          <aside className="sticky top-4 self-start">
            <RoomDetailPanel
              entry={selected}
              onAdmit={onAdmit}
              onEdit={onEdit}
              onDischarge={onDischarge}
            />
          </aside>
        )}
      </div>

      {!isWide && (
        <Dialog open={!!selected} onOpenChange={isOpen => !isOpen && setSelectedRoomId(null)}>
          {/* `sm:p-4` too: the dialog's own padding is `p-4 sm:p-6`, so
              overriding only the unprefixed half would leave the wider gutter
              in place on a tablet. */}
          <DialogContent className="max-w-md p-4 sm:p-4">
            <DialogHeader className="sr-only">
              <DialogTitle>{selected?.roomName ?? ''}</DialogTitle>
            </DialogHeader>
            <RoomDetailPanel
              entry={selected}
              onAdmit={room => {
                setSelectedRoomId(null);
                onAdmit(room);
              }}
              onEdit={admission => {
                setSelectedRoomId(null);
                onEdit(admission);
              }}
              onDischarge={admission => {
                setSelectedRoomId(null);
                onDischarge(admission);
              }}
              className="border-0 shadow-none"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
