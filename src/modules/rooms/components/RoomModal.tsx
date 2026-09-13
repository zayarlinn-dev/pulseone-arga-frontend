import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { CheckboxField } from '@/components/ui/checkbox-field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { fieldRules } from '@/i18n/validation';
import type { TFunction } from 'i18next';
import type { Room } from '@/types/models';

export const ROOM_TYPES = [
  'general',
  'private',
  'semi-private',
  'deluxe',
  'icu',
  'isolation'
] as const;

export const ROOM_STATUSES = [
  'available',
  'occupied',
  'cleaning',
  'maintenance',
  'reserved'
] as const;

const buildSchema = (t: TFunction) => {
  const v = fieldRules(t);
  const code = t('common.label.code');
  const name = t('common.label.name');
  const floor = t('rooms.form.floor');

  return z.object({
    roomCode: z.string().min(1, v.required(code)).max(20, v.max(code, 20)),
    roomName: z.string().min(1, v.required(name)).max(50, v.max(name, 50)),
    roomType: z.enum(ROOM_TYPES),
    roomStatus: z.enum(ROOM_STATUSES),
    totalBeds: z
      .string()
      .min(1, t('rooms.validation.bedsRequired'))
      .regex(/^\d+$/, t('rooms.validation.bedsWhole'))
      .refine(value => Number(value) >= 1, t('rooms.validation.bedsMin')),
    floor: z.string().max(20, v.max(floor, 20)).optional(),
    description: z.string().max(65535).optional(),
    isActive: z.boolean()
  });
};

type RoomFormValues = z.infer<ReturnType<typeof buildSchema>>;

export interface RoomPayload {
  roomCode: string;
  roomName: string;
  roomType: (typeof ROOM_TYPES)[number];
  roomStatus: (typeof ROOM_STATUSES)[number];
  totalBeds: number;
  floor: string | null;
  description: string | null;
  isActive: boolean;
}

interface RoomModalProps {
  open: boolean;
  room: Room | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: RoomPayload) => Promise<void>;
}

export function RoomModal({ open, room, submitting, onClose, onSubmit }: RoomModalProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<RoomFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      roomCode: '',
      roomName: '',
      roomType: 'general',
      roomStatus: 'available',
      totalBeds: '1',
      floor: '',
      description: '',
      isActive: true
    }
  });

  useEffect(() => {
    if (!open) return;

    reset({
      roomCode: room?.roomCode ?? '',
      roomName: room?.roomName ?? '',
      roomType: room?.roomType ?? 'general',
      roomStatus: room?.roomStatus ?? 'available',
      totalBeds: room ? String(room.totalBeds) : '1',
      floor: room?.floor ?? '',
      description: room?.description ?? '',
      isActive: room?.isActive ?? true
    });
  }, [open, room, reset]);

  const submit = handleSubmit(values =>
    onSubmit({
      roomCode: values.roomCode,
      roomName: values.roomName,
      roomType: values.roomType,
      roomStatus: values.roomStatus,
      totalBeds: Number(values.totalBeds),
      floor: values.floor?.trim() || null,
      description: values.description?.trim() || null,
      isActive: values.isActive
    })
  );

  // An occupied room is occupied because someone is in it; the status belongs
  // to the admission flow, not to whoever is editing the room record.
  const statusLocked = room?.roomStatus === 'occupied';

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(room ? 'rooms.modal.editTitle' : 'rooms.modal.newTitle')}</DialogTitle>
          <DialogDescription>
            {t(room ? 'rooms.modal.editDescription' : 'rooms.modal.newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('common.label.code')}
              htmlFor="roomCode"
              required
              error={errors.roomCode?.message}
            >
              <Input id="roomCode" {...register('roomCode')} />
            </Field>

            <Field
              label={t('common.label.name')}
              htmlFor="roomName"
              required
              error={errors.roomName?.message}
            >
              <Input id="roomName" {...register('roomName')} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('common.label.type')}
              htmlFor="roomType"
              required
              error={errors.roomType?.message}
            >
              <NativeSelect id="roomType" {...register('roomType')}>
                {ROOM_TYPES.map(type => (
                  <option key={type} value={type}>
                    {t(`rooms.type.${type}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              label={t('common.label.status')}
              htmlFor="roomStatus"
              required
              error={errors.roomStatus?.message}
              hint={statusLocked ? t('rooms.form.statusLocked') : undefined}
            >
              <NativeSelect id="roomStatus" disabled={statusLocked} {...register('roomStatus')}>
                {ROOM_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {t(`rooms.roomStatus.${status}`)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('rooms.form.totalBeds')}
              htmlFor="totalBeds"
              required
              error={errors.totalBeds?.message}
            >
              <Input id="totalBeds" inputMode="numeric" {...register('totalBeds')} />
            </Field>

            <Field label={t('rooms.form.floor')} htmlFor="floor" error={errors.floor?.message}>
              <Input id="floor" {...register('floor')} />
            </Field>
          </div>

          <Field
            label={t('common.label.description')}
            htmlFor="roomDescription"
            error={errors.description?.message}
          >
            <Textarea id="roomDescription" {...register('description')} />
          </Field>

          <CheckboxField
            id="roomIsActive"
            label={t('common.status.active')}
            description={t('rooms.form.activeHint')}
            {...register('isActive')}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(room ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
