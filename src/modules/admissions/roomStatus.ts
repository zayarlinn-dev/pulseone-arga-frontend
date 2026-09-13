import { Bed, CircleCheck, Sparkles, Hourglass, Wrench, type LucideIcon } from 'lucide-react';
import type { BadgeProps } from '@/components/ui/badge';
import type { Room } from '@/types/models';

export type RoomStatus = Room['roomStatus'];

/**
 * Board order, not alphabetical: the two statuses a ward clerk acts on —
 * a bed that is free and a bed that is about to be — come first.
 */
export const BOARD_STATUSES: RoomStatus[] = [
  'available',
  'occupied',
  'cleaning',
  'reserved',
  'maintenance'
];

interface RoomStatusLook {
  /** Walls and fill of the room on the plan. */
  tile: string;
  /** Solid swatch used by the legend and the status dot. */
  dot: string;
  /** Accent applied to the room's icon and its bed pips. */
  accent: string;
  badge: BadgeProps['variant'];
  icon: LucideIcon;
}

/**
 * Every status is carried by three things at once — colour, icon and the word
 * itself — so the board still reads for someone who cannot separate the teal
 * from the green, and in the grey of a printed handover sheet.
 */
export const ROOM_STATUS_LOOK: Record<RoomStatus, RoomStatusLook> = {
  available: {
    tile: 'border-success/45 bg-success/8 hover:border-success/70 hover:bg-success/12',
    dot: 'bg-success',
    accent: 'text-success',
    badge: 'success',
    icon: CircleCheck
  },
  occupied: {
    tile: 'border-info/45 bg-info/8 hover:border-info/70 hover:bg-info/12',
    dot: 'bg-info',
    accent: 'text-info',
    badge: 'info',
    icon: Bed
  },
  cleaning: {
    tile: 'border-warning/45 bg-warning/10 hover:border-warning/70 hover:bg-warning/15',
    dot: 'bg-warning',
    accent: 'text-warning',
    badge: 'warning',
    icon: Sparkles
  },
  reserved: {
    tile: 'border-border bg-muted/50 hover:border-foreground/25 hover:bg-muted',
    dot: 'bg-muted-foreground',
    accent: 'text-muted-foreground',
    badge: 'secondary',
    icon: Hourglass
  },
  maintenance: {
    tile: 'border-destructive/45 bg-destructive/8 hover:border-destructive/70 hover:bg-destructive/12',
    dot: 'bg-destructive',
    accent: 'text-destructive',
    badge: 'destructive',
    icon: Wrench
  }
};

/**
 * Nights the patient has been in. Day 1 is the day they arrived — the ward
 * counts the stay the way the patient does, not in elapsed 24-hour blocks.
 */
export function stayInDays(checkInDate: string): number {
  const start = new Date(checkInDate);
  if (Number.isNaN(start.getTime())) return 0;

  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.floor((startOfDay(new Date()) - startOfDay(start)) / 86_400_000);

  return Math.max(0, days) + 1;
}

/**
 * Sorts "Room 2" before "Room 10" — a plan listing rooms 1, 10, 11, 2 is a
 * plan nobody can find a room on.
 */
export function compareRoomNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/** Floors sort numerically where they are numbers, and unlabelled rooms sink. */
export function compareFloors(a: string, b: string): number {
  if (a === b) return 0;
  if (a === '') return 1;
  if (b === '') return -1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
