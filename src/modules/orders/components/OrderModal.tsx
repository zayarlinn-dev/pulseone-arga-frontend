import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
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
import { useDropdown } from '@/hooks/api/useDropdown';
import { serviceCatalogService, type OrderCreatePayload } from '@/services';
import { formatCurrency } from '@/lib/utils';
import type { Patient, Service } from '@/types/models';

interface DraftLine {
  /** Local row id; the line has no server identity until the order is saved. */
  key: number;
  serviceId: string;
  qty: string;
  employeeId: string;
  percentageDiscount: string;
  orderRemarks: string;
}

const newLine = (key: number): DraftLine => ({
  key,
  serviceId: '',
  qty: '1',
  employeeId: '',
  percentageDiscount: '',
  orderRemarks: ''
});

interface OrderModalProps {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: OrderCreatePayload) => Promise<void>;
}

/**
 * Records the services a patient is receiving during a visit.
 *
 * Prices are shown from the catalogue but never sent — the backend re-reads
 * them, so what is displayed here is a quote, not the authority.
 */
export function OrderModal({ open, submitting, onClose, onSubmit }: OrderModalProps) {
  const { t } = useTranslation();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([newLine(0)]);
  const [error, setError] = useState<string | null>(null);

  const { data: doctors = [] } = useDropdown(
    '/dropdown/employees',
    { employmentCategory: 'doctor' },
    open
  );

  // The full catalogue rather than the dropdown, because the running total
  // needs each service's price.
  const { data: catalogue, isLoading: loadingServices } = useQuery({
    queryKey: ['service-catalogue'],
    enabled: open,
    staleTime: 5 * 60_000,
    queryFn: () => serviceCatalogService.getList({ limit: 500, isActive: true })
  });

  const services = useMemo(() => catalogue?.data ?? [], [catalogue]);
  const priced = useMemo(() => {
    const map = new Map<string, Service>();
    services.forEach(service => map.set(String(service.id), service));
    return map;
  }, [services]);

  useEffect(() => {
    if (!open) return;
    setPatient(null);
    setLines([newLine(0)]);
    setError(null);
  }, [open]);

  const updateLine = (key: number, patch: Partial<DraftLine>) =>
    setLines(current => current.map(line => (line.key === key ? { ...line, ...patch } : line)));

  const lineTotal = (line: DraftLine): number => {
    const service = priced.get(line.serviceId);
    if (!service) return 0;
    const gross = Number(service.servicePrice) * (Number(line.qty) || 0);
    const discount = (gross * (Number(line.percentageDiscount) || 0)) / 100;
    return Math.max(gross - discount, 0);
  };

  const total = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const filledLines = lines.filter(line => line.serviceId);

  const handleSubmit = async () => {
    if (!patient) {
      setError(t('orders.modal.selectPatient'));
      return;
    }
    if (filledLines.length === 0) {
      setError(t('orders.modal.addService'));
      return;
    }
    if (filledLines.some(line => !/^\d+$/.test(line.qty) || Number(line.qty) < 1)) {
      setError('Every quantity must be a whole number of 1 or more');
      return;
    }

    await onSubmit({
      patientId: patient.id,
      lines: filledLines.map(line => ({
        serviceId: Number(line.serviceId),
        qty: Number(line.qty),
        employeeId: line.employeeId ? Number(line.employeeId) : null,
        percentageDiscount: line.percentageDiscount ? Number(line.percentageDiscount) : null,
        orderRemarks: line.orderRemarks.trim() || null
      }))
    });
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('orders.modal.title')}</DialogTitle>
          <DialogDescription>{t('orders.modal.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field
            label={t('orders.modal.patient')}
            required
            error={error && !patient ? error : undefined}
          >
            <PatientSearchSelect
              value={patient}
              onChange={selected => {
                setPatient(selected);
                setError(null);
              }}
            />
          </Field>

          {patient && (
            <p className="text-xs text-muted-foreground">
              {t('orders.modal.billedAgainst', {
                visit: patient.visit?.visitCode ?? t('orders.modal.openVisit')
              })}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t('orders.modal.services')}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLines(current => [...current, newLine(Date.now())])}
              >
                <Plus className="h-4 w-4" />
                {t('orders.modal.addLine')}
              </Button>
            </div>

            <div className="space-y-2">
              {lines.map(line => (
                <div key={line.key} className="rounded-lg border p-3">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_70px_80px_auto]">
                    <NativeSelect
                      value={line.serviceId}
                      disabled={loadingServices}
                      onChange={event => updateLine(line.key, { serviceId: event.target.value })}
                      aria-label={t('orders.modal.service')}
                    >
                      <option value="">
                        {loadingServices
                          ? t('orders.modal.loadingServices')
                          : t('orders.modal.selectService')}
                      </option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.serviceName} — {formatCurrency(service.servicePrice)}
                        </option>
                      ))}
                    </NativeSelect>

                    <Input
                      value={line.qty}
                      inputMode="numeric"
                      onChange={event => updateLine(line.key, { qty: event.target.value })}
                      aria-label={t('orders.modal.quantity')}
                      placeholder={t('orders.modal.qty')}
                    />

                    <Input
                      value={line.percentageDiscount}
                      inputMode="numeric"
                      onChange={event =>
                        updateLine(line.key, { percentageDiscount: event.target.value })
                      }
                      aria-label={t('orders.modal.discountAria')}
                      placeholder={t('orders.modal.discountPercent')}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      disabled={lines.length === 1}
                      onClick={() =>
                        setLines(current => current.filter(entry => entry.key !== line.key))
                      }
                      aria-label={t('orders.modal.removeLine')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <NativeSelect
                      value={line.employeeId}
                      onChange={event => updateLine(line.key, { employeeId: event.target.value })}
                      aria-label={t('orders.modal.consultant')}
                    >
                      <option value="">{t('orders.modal.noConsultant')}</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </option>
                      ))}
                    </NativeSelect>

                    <Input
                      value={line.orderRemarks}
                      onChange={event => updateLine(line.key, { orderRemarks: event.target.value })}
                      placeholder={t('orders.modal.remarks')}
                      aria-label={t('orders.modal.remarks')}
                    />
                  </div>

                  {line.serviceId && (
                    <p className="mt-2 text-right text-xs text-muted-foreground">
                      {t('orders.modal.lineTotal')}{' '}
                      <span className="font-medium tabular-nums text-foreground">
                        {formatCurrency(lineTotal(line))}
                      </span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
            <span className="text-sm font-medium">
              {t('orders.modal.orderTotal')}
              <Badge variant="secondary" className="ml-2">
                {t('orders.modal.lineCount', { count: filledLines.length })}
              </Badge>
            </span>
            <span className="text-lg font-semibold tabular-nums">{formatCurrency(total)}</span>
          </div>

          {error && patient && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.action.cancel')}
            </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('orders.modal.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
