import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { permissionService, roleService, type RolePayload } from '@/services';
import { fieldRules } from '@/i18n/validation';
import type { TFunction } from 'i18next';
import type { Module, Role } from '@/types/models';

const buildSchema = (t: TFunction) => {
  const v = fieldRules(t);
  const name = t('common.label.name');

  return z.object({
    roleName: z.string().min(1, v.required(name)).max(50, v.max(name, 50)),
    description: z.string().max(65535).optional()
  });
};

type RoleFormValues = z.infer<ReturnType<typeof buildSchema>>;

interface RoleModalProps {
  open: boolean;
  role: Role | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: RolePayload) => Promise<void>;
}

/** The HTTP verb tells the reader at a glance what a privilege lets you do. */
const METHOD_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'destructive' | 'secondary'> =
  {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    PATCH: 'warning',
    DELETE: 'destructive'
  };

export function RoleModal({ open, role, submitting, onClose, onSubmit }: RoleModalProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildSchema(t), [t]);

  const { data: models = [], isLoading: loadingModules } = useQuery({
    queryKey: ['permission-modules'],
    enabled: open,
    staleTime: 5 * 60_000,
    queryFn: () => permissionService.listModules()
  });

  // The list endpoint does not preload grants, so the row handed in carries the
  // name only; the detail endpoint is what knows which modules are ticked.
  const { data: roleDetail, isLoading: loadingRole } = useQuery({
    queryKey: ['role', role?.id],
    enabled: open && !!role,
    queryFn: () => roleService.getById(role!.id)
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<RoleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { roleName: '', description: '' }
  });

  useEffect(() => {
    if (!open) return;

    reset({
      roleName: role?.roleName ?? '',
      description: role?.description ?? ''
    });
    setSelectedIds(new Set());
  }, [open, role, reset]);

  // Grants arrive a moment after the dialog opens; seed the ticks then.
  useEffect(() => {
    if (!open || !roleDetail) return;
    setSelectedIds(new Set((roleDetail.modules ?? []).map(module => module.id)));
  }, [open, roleDetail]);

  const totalModules = useMemo(
    () => models.reduce((count, model) => count + (model.modules?.length ?? 0), 0),
    [models]
  );

  const toggleModule = (moduleId: number) =>
    setSelectedIds(current => {
      const next = new Set(current);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });

  const toggleModel = (modules: Module[], checked: boolean) =>
    setSelectedIds(current => {
      const next = new Set(current);
      modules.forEach(module => (checked ? next.add(module.id) : next.delete(module.id)));
      return next;
    });

  const submit = handleSubmit(values =>
    onSubmit({
      roleName: values.roleName,
      description: values.description?.trim() || null,
      moduleIds: [...selectedIds]
    })
  );

  const loadingTree = loadingModules || (!!role && loadingRole);

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t(role ? 'roles.modal.editTitle' : 'roles.modal.newTitle')}</DialogTitle>
          <DialogDescription>{t('roles.modal.description')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label={t('common.label.name')} htmlFor="roleName" required error={errors.roleName?.message}>
            <Input id="roleName" {...register('roleName')} />
          </Field>

          <Field label={t('common.label.description')} htmlFor="roleDescription" error={errors.description?.message}>
            <Textarea id="roleDescription" rows={2} {...register('description')} />
          </Field>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t('roles.permissions.title')}</p>
              <p className="text-xs text-muted-foreground">
                {t('roles.permissions.selected', {
                  selected: selectedIds.size,
                  total: totalModules
                })}
              </p>
            </div>

            {loadingTree ? (
              <div className="flex h-32 items-center justify-center rounded-md border">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : models.length === 0 ? (
              <p className="rounded-md border px-3 py-6 text-center text-sm text-muted-foreground">
                {t('roles.permissions.noModules')}
              </p>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto rounded-md border p-3">
                {models.map(model => {
                  const modules = model.modules ?? [];
                  const selectedCount = modules.filter(module => selectedIds.has(module.id)).length;
                  const allSelected = modules.length > 0 && selectedCount === modules.length;

                  return (
                    <div key={model.id}>
                      <label className="flex cursor-pointer items-center gap-2 pb-1">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={allSelected}
                          ref={input => {
                            if (input) {
                              input.indeterminate = selectedCount > 0 && !allSelected;
                            }
                          }}
                          onChange={event => toggleModel(modules, event.target.checked)}
                        />
                        <span className="text-sm font-medium">{model.modelName}</span>
                        <span className="text-xs text-muted-foreground">
                          {selectedCount}/{modules.length}
                        </span>
                      </label>

                      <div className="grid gap-1 pl-6 sm:grid-cols-2">
                        {modules.map(module => (
                          <label
                            key={module.id}
                            className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-accent/50"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-primary"
                              checked={selectedIds.has(module.id)}
                              onChange={() => toggleModule(module.id)}
                            />
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {module.moduleName}
                            </span>
                            <Badge variant={METHOD_VARIANT[module.method] ?? 'secondary'}>
                              {module.method}
                            </Badge>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
            <Button type="submit" disabled={submitting || loadingTree}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(role ? 'common.action.saveChanges' : 'common.action.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
