import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CalendarClock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { PatientSearchSelect } from '@/components/shared/PatientSearchSelect';
import { useDropdown } from '@/hooks/api/useDropdown';
import { appointmentService } from '@/services/erpService';
import { cn, formatClockTime } from '@/lib/utils';
import type { Patient } from '@/types/models';
import type { Slot } from '@/types/erp';

/**
 * Booking a slot.
 *
 * The slot grid is the screen. Availability is computed by the server from the
 * doctor's schedule less what is already taken, so what is drawn here is always
 * current — and the booking is still re-checked under a lock on submit, because
 * between drawing and clicking another desk may have taken the last place.
 */
export default function AppointmentBookPage() {
  const { t } = useTranslation('erp');
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');

  const { data: doctors } = useDropdown('/dropdown/employees', { employmentCategory: 'doctor' });
  const { data: services } = useDropdown('/dropdown/services');

  const {
    data: availability,
    isFetching: loadingSlots,
    isError: slotsFailed
  } = useQuery({
    queryKey: ['availability', doctorId, date],
    queryFn: () => appointmentService.getAvailability(Number(doctorId), date),
    enabled: Boolean(doctorId && date)
  });

  const book = useMutation({
    mutationFn: () =>
      appointmentService.create({
        patientId: (patient as Patient).id,
        doctorId: Number(doctorId),
        appointmentDate: date,
        startTime: (selectedSlot as Slot).startTime,
        serviceCenterId: selectedSlot?.serviceCenterId ?? null,
        serviceId: serviceId ? Number(serviceId) : null,
        roomId: selectedSlot?.roomId ?? null,
        reason: reason || null,
        remarks: remarks || null
      }),
    onSuccess: () => {
      toast.success(t('appointments.book.booked'));
      navigate('/appointments');
    },
    onError: (error: Error) => toast.error(error.message || t('appointments.book.bookFailed'))
  });

  const canSubmit = Boolean(patient && doctorId && date && selectedSlot);

  return (
    <>
      <PageHeader title={t('appointments.book.title')} description={t('appointments.book.description')} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">{t('appointments.book.patient')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <PatientSearchSelect value={patient} onChange={setPatient} />

            <Field label={t('appointments.book.doctor')} required>
              <NativeSelect
                value={doctorId}
                onChange={event => {
                  setDoctorId(event.target.value);
                  // The old choice belongs to the old doctor's list; keeping it
                  // would let a slot be submitted that this doctor never offered.
                  setSelectedSlot(null);
                }}
              >
                <option value="">-</option>
                {doctors?.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label={t('appointments.book.date')} required>
              <Input
                type="date"
                value={date}
                onChange={event => {
                  setDate(event.target.value);
                  setSelectedSlot(null);
                }}
              />
            </Field>

            <Field label={t('appointments.book.service')}>
              <NativeSelect value={serviceId} onChange={event => setServiceId(event.target.value)}>
                <option value="">-</option>
                {services?.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field label={t('appointments.book.reason')}>
              <Input
                value={reason}
                maxLength={255}
                onChange={event => setReason(event.target.value)}
              />
            </Field>

            <Field label={t('appointments.book.remarks')}>
              <Textarea rows={2} value={remarks} onChange={event => setRemarks(event.target.value)} />
            </Field>

            <Button
              className="w-full"
              disabled={!canSubmit || book.isPending}
              onClick={() => book.mutate()}
            >
              <CalendarClock className="h-4 w-4" />
              {t('appointments.book.submit')}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('appointments.book.slots')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!doctorId ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t('appointments.book.chooseDoctor')}
              </p>
            ) : loadingSlots ? (
              <p className="py-10 text-center text-sm text-muted-foreground">...</p>
            ) : slotsFailed ? (
              <p className="py-10 text-center text-sm text-destructive">
                {t('appointments.loadFailed')}
              </p>
            ) : !availability?.isAvailable ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {/* The server explains an empty list — no clinic that weekday,
                    a closed day — because a blank grid is not something a
                    receptionist can act on. */}
                {availability?.reason || t('appointments.book.noSlots')}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {availability.slots.map(slot => {
                  const isFull = slot.available <= 0;
                  const isSelected = selectedSlot?.startTime === slot.startTime;

                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={isFull}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        'rounded-md border px-3 py-2 text-left text-sm transition-colors',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'hover:border-ring hover:bg-accent'
                      )}
                    >
                      <div className="font-medium tabular-nums">{formatClockTime(slot.startTime)}</div>
                      <div className="mt-0.5">
                        {isFull ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {t('appointments.book.slotFull')}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t('appointments.book.slotsLeft', { count: slot.available })}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
