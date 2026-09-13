import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BedDouble, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { PatientSearchSelect } from '@/components/shared/PatientSearchSelect';
import { PatientSummaryCard } from '@/components/shared/PatientSummaryCard';
import { useDropdown } from '@/hooks/api/useDropdown';
import { useEntityOptions } from '@/hooks/api/useEntityOptions';
import { roomService } from '@/services';
import type { CheckIn, Patient, Room } from '@/types/models';

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time, not an ISO string. */
function toLocalInputValue(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export interface AdmissionPayload {
  patientId: number;
  roomId: number;
  admissionTypeId: number;
  attendingDoctorId: number | null;
  checkInDate: string;
  admissionReason: string | null;
  remarks: string | null;
}

interface AdmissionModalProps {
  open: boolean;
  /** Null admits a new patient; a record edits that admission's details. */
  admission: CheckIn | null;
  /**
   * The room clicked on the ward plan. It preselects the room rather than
   * locking it: the clerk who picked the wrong door should be able to say so
   * here instead of closing the form and starting again.
   */
  presetRoom?: Room | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: AdmissionPayload) => Promise<void>;
}

/**
 * Admits a patient or corrects an existing admission.
 *
 * Patient and room are fixed once admitted: moving a patient between rooms has
 * to free one room and claim the other, which is a transfer the backend owns —
 * editing the foreign key here would leave both rooms in the wrong state.
 */
export function AdmissionModal({
  open,
  admission,
  presetRoom = null,
  submitting,
  onClose,
  onSubmit
}: AdmissionModalProps) {
  const isEdit = !!admission;

  const { data: rooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms-available'],
    enabled: open && !isEdit,
    queryFn: () => roomService.getAvailable()
  });
  const { data: doctors = [], isLoading: loadingDoctors } = useDropdown(
    '/dropdown/employees',
    { employmentCategory: 'doctor' },
    open
  );
  const { t } = useTranslation();
  const admissionTypes = useEntityOptions('Admission Type');

  const [patient, setPatient] = useState<Patient | null>(null);
  const [roomId, setRoomId] = useState('');
  const [admissionTypeId, setAdmissionTypeId] = useState('');
  const [attendingDoctorId, setAttendingDoctorId] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [admissionReason, setAdmissionReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;

    setPatient(admission?.patient ?? null);
    setRoomId(
      admission?.roomId
        ? String(admission.roomId)
        : presetRoom
          ? String(presetRoom.id)
          : ''
    );
    setAdmissionTypeId(admission?.admissionTypeId ? String(admission.admissionTypeId) : '');
    setAttendingDoctorId(admission?.attendingDoctorId ? String(admission.attendingDoctorId) : '');
    setCheckInDate(toLocalInputValue(admission?.checkInDate ?? new Date()));
    setAdmissionReason(admission?.admissionReason ?? '');
    setRemarks(admission?.remarks ?? '');
    setErrors({});
  }, [open, admission, presetRoom]);

  /**
   * The preset room is prepended when the available-rooms query has not
   * answered yet, so the room the clerk clicked is on screen from the first
   * frame rather than appearing a moment later.
   */
  const roomOptions = useMemo(() => {
    if (presetRoom && !rooms.some(room => room.id === presetRoom.id)) {
      return [presetRoom, ...rooms];
    }
    return rooms;
  }, [rooms, presetRoom]);

  const selectedRoom = roomOptions.find(room => String(room.id) === roomId) ?? null;

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!patient) nextErrors.patient = t('admissions.validation.patient');
    if (!roomId) nextErrors.roomId = t('admissions.validation.room');
    if (!admissionTypeId) nextErrors.admissionTypeId = t('admissions.validation.type');
    if (!checkInDate) nextErrors.checkInDate = t('admissions.validation.date');

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      patientId: patient!.id,
      roomId: Number(roomId),
      admissionTypeId: Number(admissionTypeId),
      attendingDoctorId: attendingDoctorId ? Number(attendingDoctorId) : null,
      checkInDate: new Date(checkInDate).toISOString(),
      admissionReason: admissionReason.trim() || null,
      remarks: remarks.trim() || null
    });
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t(isEdit ? 'admissions.modal.editTitle' : 'admissions.modal.newTitle')}
          </DialogTitle>
          <DialogDescription>
            {t(isEdit ? 'admissions.modal.editDescription' : 'admissions.modal.newDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label={t('admissions.column.patient')} required error={errors.patient}>
            <PatientSearchSelect
              value={patient}
              disabled={isEdit}
              onChange={selected => {
                setPatient(selected);
                setErrors(current => ({ ...current, patient: '' }));
              }}
            />
          </Field>

          {/* Whether this patient has been here before, and what is still owed
              on the last visit — the two things the desk asks before keeping
              someone in overnight. */}
          {patient && <PatientSummaryCard patientId={patient.id} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('admissions.modal.room')}
              htmlFor="roomId"
              required
              error={errors.roomId}
              hint={isEdit ? t('admissions.modal.roomLocked') : undefined}
            >
              {isEdit ? (
                <Input
                  id="roomId"
                  readOnly
                  value={
                    admission?.room?.roomName ??
                    t('admissions.modal.roomFallback', { id: admission?.roomId ?? '' })
                  }
                />
              ) : (
                <NativeSelect
                  id="roomId"
                  value={roomId}
                  disabled={loadingRooms}
                  onChange={event => setRoomId(event.target.value)}
                >
                  <option value="">
                    {loadingRooms
                      ? t('common.label.loading')
                      : roomOptions.length === 0
                        ? t('admissions.modal.noRooms')
                        : t('admissions.modal.selectRoom')}
                  </option>
                  {roomOptions.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.roomName} · {t(`rooms.type.${room.roomType}`)}
                      {room.floor
                        ? ` · ${t('admissions.modal.roomFloor', { floor: room.floor })}`
                        : ''}
                    </option>
                  ))}
                </NativeSelect>
              )}
            </Field>

            <Field
              label={t('admissions.modal.admissionType')}
              htmlFor="admissionTypeId"
              required
              error={errors.admissionTypeId}
              hint={
                admissionTypes.categoryMissing
                  ? t('admissions.modal.noTypeCategory')
                  : undefined
              }
            >
              <NativeSelect
                id="admissionTypeId"
                value={admissionTypeId}
                disabled={admissionTypes.isLoading || admissionTypes.categoryMissing}
                onChange={event => setAdmissionTypeId(event.target.value)}
              >
                <option value="">
                  {admissionTypes.isLoading
                    ? t('common.label.loading')
                    : t('admissions.modal.selectType')}
                </option>
                {admissionTypes.options.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          {/* Confirms the bed being claimed in words, so a mis-click on the
              plan is caught here rather than at the bedside. */}
          {!isEdit && selectedRoom && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <BedDouble className="h-4 w-4 shrink-0 text-success" aria-hidden />
              <span className="font-medium text-foreground">{selectedRoom.roomName}</span>
              <span className="font-mono">{selectedRoom.roomCode}</span>
              <span>· {t(`rooms.type.${selectedRoom.roomType}`)}</span>
              {selectedRoom.floor && (
                <span>· {t('admissions.modal.roomFloor', { floor: selectedRoom.floor })}</span>
              )}
              <span>
                · {Math.max(selectedRoom.totalBeds, 1)} {t('rooms.column.beds')}
              </span>
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('admissions.modal.doctor')} htmlFor="attendingDoctorId">
              <NativeSelect
                id="attendingDoctorId"
                value={attendingDoctorId}
                disabled={loadingDoctors}
                onChange={event => setAttendingDoctorId(event.target.value)}
              >
                <option value="">
                  {loadingDoctors ? t('common.label.loading') : t('admissions.modal.notAssigned')}
                </option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              label={t('admissions.modal.admissionDate')}
              htmlFor="checkInDate"
              required
              error={errors.checkInDate}
            >
              <DateField
                id="checkInDate"
                withTime
                value={checkInDate}
                onChange={event => setCheckInDate(event.target.value)}
              />
            </Field>
          </div>

          <Field label={t('admissions.modal.admissionReason')} htmlFor="admissionReason">
            <Input
              id="admissionReason"
              maxLength={255}
              value={admissionReason}
              onChange={event => setAdmissionReason(event.target.value)}
            />
          </Field>

          <Field label={t('common.label.remarks')} htmlFor="admissionRemarks">
            <Textarea
              id="admissionRemarks"
              rows={2}
              value={remarks}
              onChange={event => setRemarks(event.target.value)}
            />
          </Field>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t(isEdit ? 'common.action.saveChanges' : 'admissions.modal.submitNew')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
