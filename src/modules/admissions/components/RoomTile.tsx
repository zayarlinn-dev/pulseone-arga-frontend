import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ROOM_STATUS_LOOK, stayInDays } from '../roomStatus';
import type { RoomBoardEntry } from '@/types/models';

interface RoomTileProps {
  entry: RoomBoardEntry;
  selected: boolean;
  onSelect: (entry: RoomBoardEntry) => void;
  /**
   * Which edge faces the corridor. The door is drawn there, so the two rows of
   * a floor read as rooms opening onto one passage rather than as a grid of
   * cards that happen to be stacked.
   */
  door: 'top' | 'bottom';
}

/**
 * One room, drawn as a room: four walls, a door onto the corridor, and a bed
 * for each bed it holds — filled in for the beds that are taken.
 *
 * The whole tile is the control. Nothing inside it is separately clickable,
 * both because a button cannot contain a button and because at a glance the
 * clerk is picking a room, not one of five actions on it; the actions live in
 * the panel that opens beside the plan.
 */
export function RoomTile({ entry, selected, onSelect, door }: RoomTileProps) {
  const { t } = useTranslation();

  const look = ROOM_STATUS_LOOK[entry.roomStatus] ?? ROOM_STATUS_LOOK.reserved;
  const StatusIcon = look.icon;
  const occupant = entry.occupants[0];
  const beds = Math.max(entry.totalBeds, 1);
  const takenBeds = Math.min(entry.occupants.length, beds);
  const outOfService = entry.isActive === false;

  // No aria-label: the tile's own text — room name, status or occupant, bed
  // count — is what a reader should hear, and a label would replace it with a
  // shorter summary of itself.
  const statusLabel = t(`rooms.roomStatus.${entry.roomStatus}`);

  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      aria-pressed={selected}
      className={cn(
        'group relative flex min-h-[7.25rem] w-full flex-col gap-2 rounded-lg border-2 p-2.5 text-left',
        'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
        look.tile,
        outOfService && 'border-dashed opacity-70',
        selected && 'ring-2 ring-ring ring-offset-2 ring-offset-card'
      )}
    >
      {/* The doorway: a gap punched through the wall on the corridor side. */}
      <span
        aria-hidden
        className={cn(
          'absolute left-5 h-[3px] w-9 rounded-full bg-card',
          door === 'bottom' ? '-bottom-[3px]' : '-top-[3px]'
        )}
      />

      <span className="flex items-start justify-between gap-1.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <StatusIcon className={cn('h-4 w-4 shrink-0', look.accent)} aria-hidden />
          <span className="truncate text-sm font-semibold leading-tight">{entry.roomName}</span>
        </span>
        <span className="shrink-0 rounded border bg-background/60 px-1 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {t(`rooms.type.${entry.roomType}`)}
        </span>
      </span>

      <span className="flex items-center gap-1" aria-hidden>
        {Array.from({ length: beds }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 w-5 rounded-full',
              index < takenBeds ? look.dot : 'bg-foreground/15'
            )}
          />
        ))}
        <span className="ml-1 text-[10px] tabular-nums text-muted-foreground">
          {takenBeds}/{beds}
        </span>
      </span>

      {occupant ? (
        <span className="mt-auto flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium">
            {occupant.patient?.patientName ?? occupant.admissionNo}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {t('admissions.dayCount', { count: stayInDays(occupant.checkInDate) })}
            {occupant.attendingDoctor ? ` · ${occupant.attendingDoctor.fullName}` : ''}
          </span>
        </span>
      ) : (
        <span className="mt-auto text-[11px] font-medium text-muted-foreground">
          {outOfService ? t('common.status.inactive') : statusLabel}
        </span>
      )}
    </button>
  );
}
