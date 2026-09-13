import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useDropdown } from '@/hooks/api/useDropdown';
import { diagnosisService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import type { Diagnosis, DiagnosisType } from '@/types/erp';

const DIAGNOSIS_TYPES: DiagnosisType[] = [
  'primary',
  'secondary',
  'provisional',
  'final',
  'differential'
];

interface DiagnosisPanelProps {
  encounterId: number;
  patientId: number;
  readOnly?: boolean;
}

/**
 * The coded conclusions on one consultation.
 *
 * The code is optional and the description is not: a doctor writes the finding
 * first and coding attaches the code afterwards, and a form that refuses the
 * note until it has a code is one that gets the code guessed.
 */
export function DiagnosisPanel({ encounterId, patientId, readOnly }: DiagnosisPanelProps) {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['diagnoses', encounterId],
    queryFn: () => diagnosisService.getList({ encounterId, limit: 100 })
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['diagnoses', encounterId] });
    queryClient.invalidateQueries({ queryKey: ['encounter'] });
  };

  const remove = useMutation({
    mutationFn: (id: number) => diagnosisService.remove(id),
    onSuccess: () => {
      invalidate();
      toast.success(t('common.toast.deleted', { ns: 'translation', item: t('encounters.diagnoses.description') }));
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const rows = data?.data ?? [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t('encounters.diagnoses.title')}</CardTitle>
        {!readOnly && can('create-diagnosis') && (
          <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('encounters.diagnoses.add')}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('encounters.diagnoses.empty')}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map(diagnosis => (
              <li
                key={diagnosis.id}
                className="flex items-start gap-3 rounded-md border px-3 py-2 text-sm"
              >
                {diagnosis.code && (
                  <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                    {diagnosis.code}
                  </Badge>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{diagnosis.description}</p>
                  {diagnosis.notes && (
                    <p className="text-xs text-muted-foreground">{diagnosis.notes}</p>
                  )}
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {t(`encounters.diagnoses.type_.${diagnosis.diagnosisType}`)}
                </Badge>
                {!readOnly && can('delete-diagnosis') && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-destructive"
                    aria-label={t('common.action.delete', { ns: 'translation' })}
                    onClick={() => remove.mutate(diagnosis.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <DiagnosisModal
        open={modalOpen}
        encounterId={encounterId}
        patientId={patientId}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          invalidate();
          setModalOpen(false);
        }}
      />
    </Card>
  );
}

function DiagnosisModal({
  open,
  encounterId,
  patientId,
  onClose,
  onSaved
}: {
  open: boolean;
  encounterId: number;
  patientId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation('erp');

  const [icdCodeId, setIcdCodeId] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [diagnosisType, setDiagnosisType] = useState<DiagnosisType>('provisional');
  const [notes, setNotes] = useState('');

  const { data: icdCodes } = useDropdown('/dropdown/icd-codes', {}, open);

  const create = useMutation({
    mutationFn: () =>
      diagnosisService.create({
        encounterId,
        patientId,
        icdCodeId: icdCodeId ? Number(icdCodeId) : null,
        code: code || null,
        description,
        diagnosisType,
        notes: notes || null
      } as Partial<Diagnosis>),
    onSuccess: () => {
      setIcdCodeId('');
      setCode('');
      setDescription('');
      setNotes('');
      onSaved();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('encounters.diagnoses.add')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Field label={t('encounters.diagnoses.code')}>
            <NativeSelect
              value={icdCodeId}
              onChange={event => {
                setIcdCodeId(event.target.value);
                // The catalogue label is "CODE - description", so picking one
                // fills both fields and the coder does not retype either.
                const picked = icdCodes?.find(item => String(item.id) === event.target.value);
                if (picked) {
                  const [pickedCode, ...rest] = picked.name.split(' - ');
                  setCode(pickedCode);
                  if (!description) setDescription(rest.join(' - '));
                }
              }}
            >
              <option value="">{t('encounters.diagnoses.searchCode')}</option>
              {icdCodes?.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('encounters.diagnoses.description')} required>
            <Input
              value={description}
              maxLength={255}
              onChange={event => setDescription(event.target.value)}
            />
          </Field>

          <Field label={t('encounters.diagnoses.type')} required>
            <NativeSelect
              value={diagnosisType}
              onChange={event => setDiagnosisType(event.target.value as DiagnosisType)}
            >
              {DIAGNOSIS_TYPES.map(value => (
                <option key={value} value={value}>
                  {t(`encounters.diagnoses.type_.${value}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('encounters.diagnoses.notes')}>
            <Textarea rows={2} value={notes} onChange={event => setNotes(event.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!description.trim() || create.isPending}
          >
            {t('common.action.save', { ns: 'translation' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
