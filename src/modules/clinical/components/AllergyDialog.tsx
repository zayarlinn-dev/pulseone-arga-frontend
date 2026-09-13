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
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useDropdown } from '@/hooks/api/useDropdown';
import { allergyService } from '@/services/erpService';
import type { Allergy, AllergySeverity, AllergyType } from '@/types/erp';

const TYPES: AllergyType[] = ['drug', 'food', 'environment', 'other'];
const SEVERITIES: AllergySeverity[] = ['mild', 'moderate', 'severe'];

interface AllergyDialogProps {
  open: boolean;
  patientId: number;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * Recording an allergy.
 *
 * Linking it to a catalogue medicine where one exists is what lets the
 * dispensing check be exact rather than a substring match on a name, so the
 * item picker is offered first for a drug allergy.
 */
export function AllergyDialog({ open, patientId, onClose, onSaved }: AllergyDialogProps) {
  const { t } = useTranslation('erp');

  const [allergen, setAllergen] = useState('');
  const [allergyType, setAllergyType] = useState<AllergyType>('drug');
  const [itemId, setItemId] = useState('');
  const [reaction, setReaction] = useState('');
  const [severity, setSeverity] = useState<AllergySeverity>('moderate');
  const [notedOn, setNotedOn] = useState('');
  const [remarks, setRemarks] = useState('');

  const { data: items } = useDropdown('/dropdown/items', {}, open && allergyType === 'drug');

  useEffect(() => {
    if (!open) return;
    setAllergen('');
    setAllergyType('drug');
    setItemId('');
    setReaction('');
    setSeverity('moderate');
    setNotedOn('');
    setRemarks('');
  }, [open]);

  const save = useMutation({
    mutationFn: () =>
      allergyService.create({
        patientId,
        allergen,
        allergyType,
        itemId: itemId ? Number(itemId) : null,
        reaction: reaction || null,
        severity,
        status: 'active',
        notedOn: notedOn || null,
        remarks: remarks || null
      } as Partial<Allergy>),
    onSuccess: () => {
      toast.success(t('common.toast.created', { ns: 'translation', item: t('chart.allergies.title') }));
      onSaved();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('chart.allergies.add')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label={t('chart.allergies.type')} required>
            <NativeSelect
              value={allergyType}
              onChange={event => {
                setAllergyType(event.target.value as AllergyType);
                // The catalogue link only means anything for a drug; carrying
                // it over to a food allergy would point the dispensing warning
                // at the wrong thing.
                setItemId('');
              }}
            >
              {TYPES.map(value => (
                <option key={value} value={value}>
                  {t(`chart.allergies.type_.${value}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>

          {allergyType === 'drug' && (
            <Field label={t('encounters.prescriptions.title')}>
              <NativeSelect
                value={itemId}
                onChange={event => {
                  setItemId(event.target.value);
                  const picked = items?.find(item => String(item.id) === event.target.value);
                  if (picked && !allergen) setAllergen(picked.name);
                }}
              >
                <option value="">-</option>
                {items?.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          )}

          <Field label={t('chart.allergies.allergen')} required>
            <Input
              value={allergen}
              maxLength={100}
              onChange={event => setAllergen(event.target.value)}
            />
          </Field>

          <Field label={t('chart.allergies.reaction')}>
            <Input
              value={reaction}
              maxLength={255}
              onChange={event => setReaction(event.target.value)}
            />
          </Field>

          <Field label={t('chart.allergies.severity')} required>
            <NativeSelect
              value={severity}
              onChange={event => setSeverity(event.target.value as AllergySeverity)}
            >
              {SEVERITIES.map(value => (
                <option key={value} value={value}>
                  {t(`chart.allergies.severity_.${value}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('chart.allergies.notedOn')}>
            <Input type="date" value={notedOn} onChange={event => setNotedOn(event.target.value)} />
          </Field>

          <Field label={t('chart.allergies.remarks')}>
            <Textarea rows={2} value={remarks} onChange={event => setRemarks(event.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button onClick={() => save.mutate()} disabled={!allergen.trim() || save.isPending}>
            {t('common.action.save', { ns: 'translation' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
