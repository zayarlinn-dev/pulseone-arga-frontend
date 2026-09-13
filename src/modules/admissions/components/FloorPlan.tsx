import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoomTile } from './RoomTile';
import type { RoomBoardEntry } from '@/types/models';

interface FloorPlanProps {
  /** The floor label as recorded on the room; empty for rooms with no floor. */
  floor: string;
  rooms: RoomBoardEntry[];
  selectedRoomId: number | null;
  onSelect: (entry: RoomBoardEntry) => void;
}

/**
 * One floor of the ward, laid out the way it is walked: rooms down both sides
 * of a corridor, each with its door onto it.
 *
 * A floor of one or two rooms is drawn as a plain row — a corridor with nothing
 * on the far side of it is decoration, and decoration that lies about the
 * building is worse than none.
 */
export function FloorPlan({ floor, rooms, selectedRoomId, onSelect }: FloorPlanProps) {
  const { t } = useTranslation();

  const beds = rooms.reduce((total, room) => total + Math.max(room.totalBeds, 1), 0);
  const taken = rooms.reduce(
    (total, room) => total + Math.min(room.occupants.length, Math.max(room.totalBeds, 1)),
    0
  );
  const occupancy = beds > 0 ? Math.round((taken / beds) * 100) : 0;

  const hasCorridor = rooms.length >= 3;
  const split = hasCorridor ? Math.ceil(rooms.length / 2) : rooms.length;
  const nearSide = rooms.slice(0, split);
  const farSide = rooms.slice(split);

  const gridClass = 'grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5';

  return (
    <section className="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
          {floor ? t('admissions.floorName', { floor }) : t('admissions.noFloor')}
        </h3>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t('admissions.bedsOccupied', { taken, beds })}
          </span>
          {/* The bar restates the count beside it, so it is decoration to a
              screen reader rather than a second, vaguer reading of the same
              figure. */}
          <span
            aria-hidden
            className="h-1.5 w-20 overflow-hidden rounded-full bg-foreground/10"
          >
            <span
              className={cn(
                'block h-full rounded-full transition-[width] duration-300',
                occupancy >= 90 ? 'bg-destructive' : occupancy >= 70 ? 'bg-warning' : 'bg-success'
              )}
              style={{ width: `${occupancy}%` }}
            />
          </span>
        </div>
      </header>

      <div className={gridClass}>
        {nearSide.map(entry => (
          <RoomTile
            key={entry.id}
            entry={entry}
            selected={entry.id === selectedRoomId}
            onSelect={onSelect}
            door={hasCorridor ? 'bottom' : 'top'}
          />
        ))}
      </div>

      {hasCorridor && (
        <>
          <div
            aria-hidden
            className="my-3 rounded-full border border-dashed bg-muted/40 py-1 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
          >
            {t('admissions.corridor')}
          </div>

          <div className={gridClass}>
            {farSide.map(entry => (
              <RoomTile
                key={entry.id}
                entry={entry}
                selected={entry.id === selectedRoomId}
                onSelect={onSelect}
                door="top"
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
