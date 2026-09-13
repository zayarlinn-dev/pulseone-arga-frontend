import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckboxField } from '@/components/ui/checkbox-field';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useDropdown } from '@/hooks/api/useDropdown';
import { approvalService } from '@/services/erpService';
import type { ApprovalWorkflow, WorkflowPayload, WorkflowStepPayload } from '@/types/erp';
import { documentTypeLabel } from '../pages/ApprovalListPage';

interface WorkflowModalProps {
  open: boolean;
  workflow: ApprovalWorkflow | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: WorkflowPayload) => Promise<void>;
}

/** A blank step, added when the editor opens on a new workflow. */
function emptyStep(stepNo: number): WorkflowStepPayload {
  return { stepNo, stepName: '', roleId: null, approverUserId: null, allowRequester: false };
}

/**
 * The workflow editor.
 *
 * Steps are edited as an ordered list and saved as a whole, matching what the
 * backend does with them: a chain is an ordered unit, and patching one rung
 * while another still refers to the old shape is how a request ends up waiting
 * on a step that no longer exists.
 */
export function WorkflowModal({
  open,
  workflow,
  submitting,
  onClose,
  onSubmit
}: WorkflowModalProps) {
  const { t } = useTranslation('erp');

  const [form, setForm] = useState<WorkflowPayload>(() => blankForm());
  const [error, setError] = useState('');

  const { data: documentTypes } = useQuery({
    queryKey: ['approval-document-types'],
    queryFn: () => approvalService.getDocumentTypes(),
    staleTime: 60 * 60 * 1000
  });
  const { data: roles } = useDropdown('/dropdown/roles');
  // Only loaded while the editor is open: the account list is behind the user
  // privilege, and requesting it from a closed dialog would 403 for anyone who
  // can configure workflows without being able to administer accounts.
  const { data: users } = useDropdown('/dropdown/users', {}, open);

  useEffect(() => {
    if (!open) return;

    setError('');
    setForm(
      workflow
        ? {
            workflowCode: workflow.workflowCode,
            workflowName: workflow.workflowName,
            documentType: workflow.documentType,
            description: workflow.description ?? '',
            minAmount: workflow.minAmount ?? '0',
            isActive: workflow.isActive ?? true,
            steps: (workflow.steps ?? []).map(step => ({
              stepNo: step.stepNo,
              stepName: step.stepName,
              roleId: step.roleId ?? null,
              approverUserId: step.approverUserId ?? null,
              allowRequester: step.allowRequester ?? false
            }))
          }
        : blankForm()
    );
  }, [open, workflow]);

  const setStep = (index: number, patch: Partial<WorkflowStepPayload>) => {
    setForm(current => ({
      ...current,
      steps: current.steps.map((step, i) => (i === index ? { ...step, ...patch } : step))
    }));
  };

  const addStep = () => {
    setForm(current => ({
      ...current,
      steps: [...current.steps, emptyStep(current.steps.length + 1)]
    }));
  };

  const removeStep = (index: number) => {
    setForm(current => ({
      ...current,
      // Renumbered on removal so the chain stays 1..n — the backend refuses a
      // duplicate step number, and a gap would be confusing to read.
      steps: current.steps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, stepNo: i + 1 }))
    }));
  };

  const handleSubmit = async () => {
    if (form.steps.length === 0) {
      setError(t('approvals.workflow.form.needsStep'));
      return;
    }
    if (form.steps.some(step => !step.roleId && !step.approverUserId)) {
      setError(t('approvals.workflow.form.needsApprover'));
      return;
    }

    await onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {workflow
              ? t('common.action.editItem', {
                  ns: 'translation',
                  item: t('approvals.workflow.entity')
                })
              : t('common.action.newItem', {
                  ns: 'translation',
                  item: t('approvals.workflow.entity')
                })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t('approvals.workflow.form.code')} required>
              <Input
                value={form.workflowCode}
                maxLength={30}
                onChange={event => setForm({ ...form, workflowCode: event.target.value })}
              />
            </Field>

            <Field label={t('approvals.workflow.form.name')} required>
              <Input
                value={form.workflowName}
                maxLength={80}
                onChange={event => setForm({ ...form, workflowName: event.target.value })}
              />
            </Field>

            <Field label={t('approvals.workflow.form.documentType')} required>
              <NativeSelect
                value={form.documentType}
                onChange={event => setForm({ ...form, documentType: event.target.value })}
              >
                <option value="">-</option>
                {documentTypes?.map(value => (
                  <option key={value} value={value}>
                    {documentTypeLabel(t, value)}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              label={t('approvals.workflow.form.minAmount')}
              hint={t('approvals.workflow.form.minAmountHelp')}
            >
              <MoneyInput
                value={form.minAmount}
                onChange={event => setForm({ ...form, minAmount: event.target.value })}
              />
            </Field>
          </div>

          <Field label={t('approvals.workflow.form.description')}>
            <Textarea
              rows={2}
              value={form.description ?? ''}
              onChange={event => setForm({ ...form, description: event.target.value })}
            />
          </Field>

          <CheckboxField
            label={t('approvals.workflow.form.active')}
            checked={form.isActive ?? true}
            onChange={event => setForm({ ...form, isActive: event.target.checked })}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">{t('approvals.workflow.form.steps')}</h3>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-4 w-4" />
                {t('approvals.workflow.form.addStep')}
              </Button>
            </div>

            <div className="space-y-3">
              {form.steps.map((step, index) => (
                <div key={index} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{step.stepNo}</span>
                    <Input
                      className="h-8 flex-1"
                      placeholder={t('approvals.workflow.form.stepName')}
                      value={step.stepName}
                      maxLength={60}
                      onChange={event => setStep(index, { stepName: event.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeStep(index)}
                      aria-label={t('common.action.delete', { ns: 'translation' })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label={t('approvals.workflow.form.role')}>
                      <NativeSelect
                        value={step.roleId ? String(step.roleId) : ''}
                        onChange={event =>
                          setStep(index, {
                            roleId: event.target.value ? Number(event.target.value) : null,
                            // A step names a role or a person, never both — two
                            // answers to "who signs this" is one too many.
                            approverUserId: event.target.value ? null : step.approverUserId
                          })
                        }
                      >
                        <option value="">-</option>
                        {roles?.map(role => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>

                    <Field label={t('approvals.workflow.form.user')}>
                      <NativeSelect
                        value={step.approverUserId ? String(step.approverUserId) : ''}
                        onChange={event =>
                          setStep(index, {
                            approverUserId: event.target.value
                              ? Number(event.target.value)
                              : null,
                            roleId: event.target.value ? null : step.roleId
                          })
                        }
                      >
                        <option value="">-</option>
                        {users?.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>

                  <CheckboxField
                    className="mt-2"
                    label={t('approvals.workflow.form.allowRequester')}
                    description={t('approvals.workflow.form.allowRequesterHelp')}
                    checked={step.allowRequester}
                    onChange={event => setStep(index, { allowRequester: event.target.checked })}
                  />
                </div>
              ))}
            </div>

            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t('common.action.cancel', { ns: 'translation' })}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {t('common.action.save', { ns: 'translation' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function blankForm(): WorkflowPayload {
  return {
    workflowCode: '',
    workflowName: '',
    documentType: '',
    description: '',
    minAmount: '0',
    isActive: true,
    steps: [emptyStep(1)]
  };
}
