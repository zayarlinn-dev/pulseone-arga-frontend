import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Info, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { RadioCard } from '@/components/ui/radio-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuthStore } from '@/stores/userStore';
import { settingsService } from '@/services';
import type { InventorySettings, IssuePolicy, StorePolicy } from '@/types/models';

/**
 * Where FEFO, FIFO and LIFO apply.
 *
 * Two levels, and the screen shows both at once because the question is always
 * comparative: a system default, and a per-store override for the stores that
 * work differently. A pharmacy and a stationery cupboard are both "stores" and
 * have no business running the same rule.
 *
 * The expiry guard is stated on the page rather than buried in a tooltip. It is
 * the reason it is safe to offer LIFO at all, and someone setting a medical
 * store to LIFO needs to know why nothing appears to change.
 */
export default function InventorySettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const canEdit = useAuthStore(state => state.can('update-setting'));

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory-settings'],
    queryFn: settingsService.getInventory
  });

  // Everything that changes a policy also changes what the batch panels and the
  // expiry report show, so they are all dropped together rather than left to go
  // stale until the next navigation.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-settings'] });
    queryClient.invalidateQueries({ queryKey: ['stock-batches'] });
    queryClient.invalidateQueries({ queryKey: ['expiry-alerts'] });
  };

  const saveDefaults = useMutation({
    mutationFn: settingsService.updateInventory,
    onSuccess: () => {
      toast.success(t('inventory.settings.saved'));
      invalidate();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message)
  });

  const saveStore = useMutation({
    mutationFn: ({ storeId, policy }: { storeId: number; policy: IssuePolicy | null }) =>
      settingsService.updateStorePolicy(storeId, policy),
    onSuccess: () => {
      toast.success(t('inventory.settings.storeSaved'));
      invalidate();
    },
    onError: (mutationError: Error) => toast.error(mutationError.message)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        {t('common.label.loading')}
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="py-16 text-center text-sm text-destructive">
        {(error as Error)?.message ?? t('inventory.settings.failed')}
      </p>
    );
  }

  return (
    <>
      <PageHeader
        title={t('inventory.settings.title')}
        description={t('inventory.settings.description')}
      />

      <div className="space-y-6">
        <ExpiryGuardNotice />

        <DefaultPolicyCard
          settings={data}
          canEdit={canEdit}
          saving={saveDefaults.isPending}
          onSave={policy => saveDefaults.mutate({ issuePolicy: policy })}
        />

        <ExpiryWindowCard
          settings={data}
          canEdit={canEdit}
          saving={saveDefaults.isPending}
          onSave={(alertDays, criticalDays) =>
            saveDefaults.mutate({ expiryAlertDays: alertDays, expiryCriticalDays: criticalDays })
          }
        />

        <StorePolicyCard
          stores={data.stores}
          systemDefault={data.issuePolicy}
          policies={data.policies}
          canEdit={canEdit}
          savingStoreId={saveStore.isPending ? saveStore.variables?.storeId : undefined}
          onSave={(storeId, policy) => saveStore.mutate({ storeId, policy })}
        />
      </div>
    </>
  );
}

/**
 * The rule that makes the rest of this page safe.
 *
 * Without it, the honest description of LIFO in a pharmacy is "dispense the
 * newest packet and let the oldest expire", and no amount of small print makes
 * that an acceptable thing to put behind a dropdown.
 */
function ExpiryGuardNotice() {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3 rounded-lg border border-info/30 bg-info/5 p-4 text-sm">
      <Info className="mt-0.5 size-4 shrink-0 text-info" />
      <div className="space-y-1">
        <p className="font-medium">{t('inventory.settings.guard.title')}</p>
        <p className="text-muted-foreground">{t('inventory.settings.guard.body')}</p>
      </div>
    </div>
  );
}

function DefaultPolicyCard({
  settings,
  canEdit,
  saving,
  onSave
}: {
  settings: InventorySettings;
  canEdit: boolean;
  saving: boolean;
  onSave: (policy: IssuePolicy) => void;
}) {
  const { t } = useTranslation();
  const [policy, setPolicy] = useState<IssuePolicy>(settings.issuePolicy);

  // A save returns the stored settings, and another administrator may have
  // saved in between, so the field follows the server rather than keeping
  // whatever was typed.
  useEffect(() => setPolicy(settings.issuePolicy), [settings.issuePolicy]);

  const dirty = policy !== settings.issuePolicy;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('inventory.settings.default.title')}</CardTitle>
        <CardDescription>{t('inventory.settings.default.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {settings.policies.map(option => (
            <RadioCard
              key={option}
              name="issuePolicy"
              value={option}
              checked={policy === option}
              disabled={!canEdit}
              onChange={() => setPolicy(option)}
              label={t(`inventory.policy.${option}.label`)}
              description={t(`inventory.policy.${option}.description`)}
            />
          ))}
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={!dirty || saving} onClick={() => onSave(policy)}>
              {saving && <Loader2 className="mr-2 size-3.5 animate-spin" />}
              {t('common.action.save')}
            </Button>
            {dirty && (
              <Button variant="ghost" size="sm" onClick={() => setPolicy(settings.issuePolicy)}>
                {t('common.action.cancel')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExpiryWindowCard({
  settings,
  canEdit,
  saving,
  onSave
}: {
  settings: InventorySettings;
  canEdit: boolean;
  saving: boolean;
  onSave: (alertDays: number, criticalDays: number) => void;
}) {
  const { t } = useTranslation();
  const [alertDays, setAlertDays] = useState(String(settings.expiryAlertDays));
  const [criticalDays, setCriticalDays] = useState(String(settings.expiryCriticalDays));

  useEffect(() => {
    setAlertDays(String(settings.expiryAlertDays));
    setCriticalDays(String(settings.expiryCriticalDays));
  }, [settings.expiryAlertDays, settings.expiryCriticalDays]);

  const alert = Number(alertDays);
  const critical = Number(criticalDays);

  // The same rule the server enforces, checked here so the reason is visible
  // beside the field instead of arriving as a toast after a round trip.
  const invalid =
    !Number.isInteger(alert) ||
    !Number.isInteger(critical) ||
    alert < 1 ||
    critical < 1 ||
    critical > alert;

  const dirty =
    alert !== settings.expiryAlertDays || critical !== settings.expiryCriticalDays;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('inventory.settings.expiry.title')}</CardTitle>
        <CardDescription>{t('inventory.settings.expiry.description')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t('inventory.settings.expiry.alertDays')}
            htmlFor="expiryAlertDays"
            hint={t('inventory.settings.expiry.alertHint')}
          >
            <Input
              id="expiryAlertDays"
              type="number"
              min={1}
              value={alertDays}
              disabled={!canEdit}
              onChange={event => setAlertDays(event.target.value)}
            />
          </Field>

          <Field
            label={t('inventory.settings.expiry.criticalDays')}
            htmlFor="expiryCriticalDays"
            hint={t('inventory.settings.expiry.criticalHint')}
            error={
              critical > alert && Number.isInteger(critical) && Number.isInteger(alert)
                ? t('inventory.settings.expiry.criticalTooWide')
                : undefined
            }
          >
            <Input
              id="expiryCriticalDays"
              type="number"
              min={1}
              value={criticalDays}
              disabled={!canEdit}
              onChange={event => setCriticalDays(event.target.value)}
            />
          </Field>
        </div>

        {canEdit && (
          <Button
            size="sm"
            disabled={!dirty || invalid || saving}
            onClick={() => onSave(alert, critical)}
          >
            {saving && <Loader2 className="mr-2 size-3.5 animate-spin" />}
            {t('common.action.save')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * The per-store overrides — the table that answers "where is LIFO in use?".
 *
 * Every store is listed, not just the overridden ones, because the answer has
 * to include the stores running the default: a list of exceptions cannot be
 * read as a complete picture, and this is the only complete picture there is.
 */
function StorePolicyCard({
  stores,
  systemDefault,
  policies,
  canEdit,
  savingStoreId,
  onSave
}: {
  stores: StorePolicy[];
  systemDefault: IssuePolicy;
  policies: IssuePolicy[];
  canEdit: boolean;
  savingStoreId?: number;
  onSave: (storeId: number, policy: IssuePolicy | null) => void;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('inventory.settings.stores.title')}</CardTitle>
        <CardDescription>{t('inventory.settings.stores.description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-3 text-left font-medium">
                  {t('inventory.settings.stores.column.store')}
                </th>
                <th className="py-2 pr-3 text-left font-medium">
                  {t('inventory.settings.stores.column.type')}
                </th>
                <th className="py-2 pr-3 text-left font-medium">
                  {t('inventory.settings.stores.column.policy')}
                </th>
                <th className="py-2 text-left font-medium">
                  {t('inventory.settings.stores.column.effective')}
                </th>
              </tr>
            </thead>

            <tbody>
              {stores.map(store => (
                <tr key={store.storeId} className="border-b last:border-0">
                  <td className="py-2 pr-3">
                    <span className="font-medium">{store.storeName}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {store.storeCode}
                    </span>
                  </td>

                  <td className="py-2 pr-3">
                    <Badge variant={store.storeType === 'medical' ? 'info' : 'secondary'}>
                      {t(`inventory.settings.stores.type.${store.storeType}`)}
                    </Badge>
                  </td>

                  <td className="py-2 pr-3">
                    <NativeSelect
                      value={store.issuePolicy ?? ''}
                      disabled={!canEdit || savingStoreId === store.storeId}
                      className="h-8 w-auto min-w-40 text-xs"
                      aria-label={t('inventory.settings.stores.column.policy')}
                      onChange={event =>
                        onSave(
                          store.storeId,
                          event.target.value === '' ? null : (event.target.value as IssuePolicy)
                        )
                      }
                    >
                      <option value="">
                        {t('inventory.settings.stores.inherit', {
                          policy: t(`inventory.policy.${systemDefault}.short`)
                        })}
                      </option>
                      {policies.map(policy => (
                        <option key={policy} value={policy}>
                          {t(`inventory.policy.${policy}.label`)}
                        </option>
                      ))}
                    </NativeSelect>
                  </td>

                  <td className="py-2">
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {t(`inventory.policy.${store.effectivePolicy}.short`)}
                      </Badge>
                      {/*
                        A medical store is where dated stock lives, so the
                        expiry guard makes anything but FEFO largely inert
                        there. Saying so on the row it applies to is what stops
                        someone setting LIFO and reporting it as broken.
                      */}
                      {store.storeType === 'medical' && store.effectivePolicy !== 'fefo' && (
                        <span className="text-xs text-muted-foreground">
                          {t('inventory.settings.stores.expiryStillWins')}
                        </span>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
