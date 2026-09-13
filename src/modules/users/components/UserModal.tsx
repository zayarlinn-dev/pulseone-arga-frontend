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
import type { User, UserRole } from '@/types/models';

/**
 * The roles the `user.role` enum accepts. This is the login's coarse role, not
 * the permission role in Roles & Permissions — the backend rejects anything
 * outside this list.
 */
export const USER_ROLES: UserRole[] = ['admin', 'billing', 'store', 'nurse'];

// Field lengths mirror the database columns and the backend's binding rules, so
// the form rejects what the API would reject anyway — without a round trip.
const buildSchema = (t: TFunction) => {
  const v = fieldRules(t);
  const username = t('users.form.username');
  const password = t('users.form.password');

  return z.object({
    username: z.string().min(1, v.required(username)).max(20, v.max(username, 20)),
    password: z.string().max(72, v.max(password, 72)).optional().or(z.literal('')),
    role: z.enum(['admin', 'billing', 'store', 'nurse']),
    isActive: z.boolean(),
    isSuperUser: z.boolean(),
    remarks: z.string().max(65535).optional()
  });
};

export type UserFormValues = z.infer<ReturnType<typeof buildSchema>>;

export interface UserPayload {
  username: string;
  /** Omitted on an edit that left the password field blank. */
  password?: string;
  role: UserRole;
  isActive: boolean;
  isSuperUser: boolean;
  remarks: string | null;
}

interface UserModalProps {
  open: boolean;
  user: User | null;
  submitting: boolean;
  /** Only a super user may hand out the super-user flag. */
  canGrantSuperUser: boolean;
  onClose: () => void;
  onSubmit: (payload: UserPayload) => Promise<void>;
}

export function UserModal({
  open,
  user,
  submitting,
  canGrantSuperUser,
  onClose,
  onSubmit
}: UserModalProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<UserFormValues>({
    // A new account must be given a password; an existing one keeps the
    // password it has unless the field is filled in, so the rule depends on
    // which of the two the dialog is open on.
    resolver: zodResolver(
      schema.superRefine((values, ctx) => {
        if (!isEdit && !values.password) {
          ctx.addIssue({
            code: 'custom',
            path: ['password'],
            message: t('users.validation.passwordRequired')
          });
          return;
        }
        if (values.password && values.password.length < 8) {
          ctx.addIssue({
            code: 'custom',
            path: ['password'],
            message: t('users.validation.passwordMin')
          });
        }
      })
    ),
    defaultValues: {
      username: '',
      password: '',
      role: 'billing',
      isActive: true,
      isSuperUser: false,
      remarks: ''
    }
  });

  // Re-seed whenever the dialog opens, so switching from "edit A" to "new"
  // does not leave A's values behind — and no typed password survives either.
  useEffect(() => {
    if (!open) return;

    reset({
      username: user?.username ?? '',
      password: '',
      role: user?.role ?? 'billing',
      isActive: user?.isActive ?? true,
      isSuperUser: user?.isSuperUser ?? false,
      remarks: user?.remarks ?? ''
    });
  }, [open, user, reset]);

  const submit = handleSubmit(values =>
    onSubmit({
      username: values.username.trim(),
      // An empty field on an edit means "leave the password alone", so the key
      // is left out rather than sent blank.
      ...(values.password ? { password: values.password } : {}),
      role: values.role,
      isActive: values.isActive,
      isSuperUser: values.isSuperUser,
      remarks: values.remarks?.trim() || null
    })
  );

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(user ? 'users.modal.editTitle' : 'users.modal.newTitle')}</DialogTitle>
          <DialogDescription>
            {t(user ? 'users.modal.editDescription' : 'users.modal.newDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field
            label={t('users.form.username')}
            htmlFor="username"
            required
            error={errors.username?.message}
          >
            <Input id="username" autoComplete="off" {...register('username')} />
          </Field>

          <Field
            label={t('users.form.password')}
            htmlFor="password"
            required={!isEdit}
            error={errors.password?.message}
            hint={
              isEdit
                ? t('users.form.passwordKeepHint')
                : t('users.form.passwordNewHint')
            }
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
          </Field>

          <Field
            label={t('users.form.role')}
            htmlFor="role"
            required
            error={errors.role?.message}
          >
            <NativeSelect id="role" {...register('role')}>
              {USER_ROLES.map(role => (
                <option key={role} value={role}>
                  {t(`users.role.${role}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('common.label.remarks')} htmlFor="remarks" error={errors.remarks?.message}>
            <Textarea id="remarks" rows={2} {...register('remarks')} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <CheckboxField
              id="userIsActive"
              label={t('common.status.active')}
              description={t('users.form.activeHint')}
              {...register('isActive')}
            />

            <CheckboxField
              id="userIsSuperUser"
              label={t('users.form.superUser')}
              description={
                canGrantSuperUser
                  ? t('users.form.superUserHint')
                  : t('users.form.superUserLocked')
              }
              disabled={!canGrantSuperUser}
              {...register('isSuperUser')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(user ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
