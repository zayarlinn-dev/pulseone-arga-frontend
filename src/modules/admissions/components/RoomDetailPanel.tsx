import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DoorOpen, LogOut, Pencil, Plus, Stethoscope, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/userStore';
import { calculateAge, cn, formatDateTime } from '@/lib/utils';
import { ROOM_STATUS_LOOK, stayInDays } from '../roomStatus';
import type { CheckIn, Room, RoomBoardEntry } from '@/types/models';

interface RoomDetailPanelProps {
  entry: RoomBoardEntry | null;
  onAdmit: (entry: RoomBoardEntry) => void;
  onEdit: (admission: CheckIn) => void;
  onDischarge: (admission: CheckIn) => void;
  className?: string;
}

/**
 * Why an empty room cannot simply be filled. Reserved and "occupied with
 * nobody in it" share a line: both mean the room is held somewhere other than
 * the admission record, and both are released the same way.
 */
function emptyRoomMessage(status: Room['roomStatus']) {
  switch (status) {
    case 'available':
      return 'admissions.roomFree' as const;
    case 'cleaning':
      return 'admissions.roomCleaning' as const;
    case 'maintenance':
      return 'admissions.roomHeld' as const;
    default:
      return 'admissions.roomHeld' as const;
  }
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm">{children}</dd>
    </div>
  );
}

/**
 * What is known about the room the clerk just clicked, and the two or three
 * things they can do about it.
 *
 * It is one component used in two places — docked beside the plan on a desk
 * screen, inside a dialog on anything narrower — because the answer to "who is
 * in room 204" should not differ by the width of the screen asking.
 */
export function RoomDetailPanel({
  entry,
  onAdmit,
  onEdit,
  onDischarge,
  className
}: RoomDetailPanelProps) {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);

  if (!entry) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center',
          className
        )}
      >
        <DoorOpen className="h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">{t('admissions.pickRoomHint')}</p>
      </div>
    );
  }

  const look = ROOM_STATUS_LOOK[entry.roomStatus] ?? ROOM_STATUS_LOOK.reserved;
  const beds = Math.max(entry.totalBeds, 1);
  const outOfService = entry.isActive === false;
  const admittable = entry.roomStatus === 'available' && !outOfService;

  return (
    <div className={cn('rounded-xl border bg-card shadow-sm', className)}>
      <div className="space-y-3 border-b p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{entry.roomName}</h3>
            <p className="font-mono text-xs text-muted-foreground">{entry.roomCode}</p>
          </div>
          <Badge variant={look.badge}>{t(`rooms.roomStatus.${entry.roomStatus}`)}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <Detail label={t('common.label.type')}>{t(`rooms.type.${entry.roomType}`)}</Detail>
          <Detail label={t('rooms.column.floor')}>
            {entry.floor || t('common.label.notSet')}
          </Detail>
          <Detail label={t('rooms.column.beds')}>
            {t('admissions.bedsOccupied', {
              taken: Math.min(entry.occupants.length, beds),
              beds
            })}
          </Detail>
          <Detail label={t('common.label.status')}>
            {t(outOfService ? 'common.status.inactive' : 'common.status.active')}
          </Detail>
        </dl>

        {entry.description && (
          <p className="text-xs text-muted-foreground">{entry.description}</p>
        )}
      </div>

      {entry.occupants.length > 0 ? (
        <div className="divide-y">
          {entry.occupants.map(admission => {
            const patient = admission.patient;
            const age = patient?.age ?? calculateAge(patient?.dob);

            return (
              <div key={admission.id} className="space-y-3 p-4">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info/12 text-info">
                    <UserRound className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {patient?.patientName ?? admission.admissionNo}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{patient?.patientNo}</span>
                      {patient?.gender && ` · ${t(`person.gender.${patient.gender}`)}`}
                      {age != null && ` · ${t('patients.summary.years', { count: age })}`}
                    </p>
                  </div>
                  <Badge variant="info" className="shrink-0">
                    {t('admissions.dayCount', { count: stayInDays(admission.checkInDate) })}
                  </Badge>
                </div>

                <dl className="grid grid-cols-2 gap-3">
                  <Detail label={t('admissions.column.admissionNo')}>
                    <span className="font-mono text-xs">{admission.admissionNo}</span>
                  </Detail>
                  <Detail label={t('admissions.modal.admissionType')}>
                    {admission.admissionType?.entityName ?? '-'}
                  </Detail>
                  <Detail label={t('admissions.column.admitted')}>
                    {formatDateTime(admission.checkInDate)}
                  </Detail>
                  <Detail label={t('admissions.column.doctor')}>
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate">
                        {admission.attendingDoctor?.fullName ?? t('admissions.modal.notAssigned')}
                      </span>
                    </span>
                  </Detail>
                </dl>

                {admission.admissionReason && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {t('admissions.modal.admissionReason')}
                    </p>
                    <p className="text-sm">{admission.admissionReason}</p>
                  </div>
                )}

                {can('update-check-in') && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(admission)}
                      aria-label={t('admissions.editAria', { number: admission.admissionNo })}
                    >
                      <Pencil className="h-4 w-4" />
                      {t('common.action.edit')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onDischarge(admission)}
                      aria-label={t('admissions.dischargeAria', {
                        name: patient?.patientName ?? admission.admissionNo
                      })}
                    >
                      <LogOut className="h-4 w-4" />
                      {t('admissions.discharge')}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            {outOfService ? t('admissions.roomHeld') : t(emptyRoomMessage(entry.roomStatus))}
          </p>

          {can('create-check-in') && (
            <Button className="w-full" disabled={!admittable} onClick={() => onAdmit(entry)}>
              <Plus className="h-4 w-4" />
              {t('admissions.admitPatient')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
