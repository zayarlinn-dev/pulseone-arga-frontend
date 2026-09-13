import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { vitalSignService } from '@/services/erpService';

interface VitalsDialogProps {
  open: boolean;
  patientId: number;
  encounterId?: number;
  onClose: () => void;
  onSaved: () => void;
}

/** The measurements, all optional and all numeric. */
const READINGS = [
  { key: 'temperatureC', labelKey: 'temperature', unitKey: 'temperature', step: '0.1' },
  { key: 'pulseBpm', labelKey: 'pulse', unitKey: 'pulse', step: '1' },
  { key: 'respiratoryRate', labelKey: 'respiratoryRate', unitKey: 'respiratoryRate', step: '1' },
  { key: 'systolicMmHg', labelKey: 'bloodPressure', unitKey: 'bloodPressure', step: '1' },
  { key: 'diastolicMmHg', labelKey: 'bloodPressure', unitKey: 'bloodPressure', step: '1' },
  { key: 'spO2Percent', labelKey: 'spo2', unitKey: 'spo2', step: '1' },
  { key: 'weightKg', labelKey: 'weight', unitKey: 'weight', step: '0.1' },
  { key: 'heightCm', labelKey: 'height', unitKey: 'height', step: '0.1' },
  { key: 'bloodGlucoseMgDl', labelKey: 'bloodGlucose', unitKey: 'bloodGlucose', step: '0.1' },
  { key: 'painScore', labelKey: 'painScore', unitKey: null, step: '1' }
] as const;

type ReadingKey = (typeof READINGS)[number]['key'];

/**
 * Recording a set of observations.
 *
 * Every field is optional, because a triage nurse takes what the patient needs
 * rather than the whole panel — and an empty box is submitted as nothing at
 * all, never as a zero. A fabricated 0 in a clinical record is worse than a
 * blank, because it reads as a measurement somebody took.
 */
export function VitalsDialog({
  open,
  patientId,
  encounterId,
  onClose,
  onSaved
}: VitalsDialogProps) {
  const { t } = useTranslation('erp');

  const [values, setValues] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setValues({});
    setRemarks('');
    setError('');
  }, [open]);

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        patientId,
        encounterId: encounterId ?? null,
        recordedAt: new Date().toISOString(),
        remarks: remarks || null
      };

      for (const reading of READINGS) {
        const raw = values[reading.key];
        // Only fields the nurse actually filled in are sent, so an untouched
        // box stays null rather than becoming a reading of zero.
        if (raw !== undefined && raw !== '') payload[reading.key] = Number(raw);
      }

      return vitalSignService.create(payload);
    },
    onSuccess: () => {
      toast.success(t('chart.vitals.saved'));
      onSaved();
    },
    onError: (error: Error) => toast.error(error.message || t('chart.vitals.saveFailed'))
  });

  const hasAnyReading = READINGS.some(reading => {
    const raw = values[reading.key];
    return raw !== undefined && raw !== '';
  });

  const label = (reading: (typeof READINGS)[number]) => {
    const base = t(`chart.vitals.${reading.labelKey}`);
    if (reading.key === 'systolicMmHg') return `${base} (sys)`;
    if (reading.key === 'diastolicMmHg') return `${base} (dia)`;
    return base;
  };

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('chart.vitals.record')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {READINGS.map(reading => (
            <Field
              key={reading.key}
              label={label(reading)}
              hint={reading.unitKey ? t(`chart.vitals.unit.${reading.unitKey}`) : undefined}
            >
              <Input
                type="number"
                step={reading.step}
                value={values[reading.key] ?? ''}
                onChange={event => {
                  setValues({ ...values, [reading.key satisfies ReadingKey]: event.target.value });
                  if (error) setError('');
                }}
              />
            </Field>
          ))}
        </div>

        <Field label={t('chart.vitals.remarks')} error={error || undefined}>
          <Textarea rows={2} value={remarks} onChange={event => setRemarks(event.target.value)} />
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button
            disabled={save.isPending}
            onClick={() => {
              if (!hasAnyReading) {
                setError(t('chart.vitals.nothingEntered'));
                return;
              }
              save.mutate();
            }}
          >
            {t('common.action.save', { ns: 'translation' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
