import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceMutations } from '@/hooks/api/useResource';
import { checkInService, type CheckOutPayload } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import type { CheckIn, Room } from '@/types/models';
import { AdmissionModal } from '../components/AdmissionModal';
import { AdmissionTable } from '../components/AdmissionTable';
import { DischargeModal } from '../components/DischargeModal';
import { WardBoard } from '../components/WardBoard';

type View = 'board' | 'list';

export default function AdmissionListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const queryClient = useQueryClient();

  const [view, setView] = useState<View>('board');
  const [editing, setEditing] = useState<CheckIn | null>(null);
  /** Set when the admission was started from a room on the plan. */
  const [presetRoom, setPresetRoom] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [discharging, setDischarging] = useState<CheckIn | null>(null);

  /**
   * Both writes move a room between states and change the patient's admission
   * history, so the board, the room lists and the history panel are refreshed
   * with them.
   */
  const invalidateAfterAdmissionChange = () => {
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
    queryClient.invalidateQueries({ queryKey: ['rooms-available'] });
    queryClient.invalidateQueries({ queryKey: ['rooms-board'] });
    queryClient.invalidateQueries({ queryKey: ['patient-summary'] });
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setPresetRoom(null);
  };

  const mutations = useResourceMutations(checkInService, 'admissions', t('admissions.entity'), {
    onSuccess: () => {
      invalidateAfterAdmissionChange();
      closeModal();
    }
  });

  const { mutateAsync: discharge, isPending: isDischarging } = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CheckOutPayload }) =>
      checkInService.checkOut(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      invalidateAfterAdmissionChange();
      toast.success(t('admissions.toast.discharged'));
      setDischarging(null);
    },
    onError: (error: Error) =>
      toast.error(error.message || t('admissions.toast.dischargeFailed'))
  });

  const openAdmission = (room: Room | null) => {
    setEditing(null);
    setPresetRoom(room);
    setModalOpen(true);
  };

  const openEdit = (admission: CheckIn) => {
    setPresetRoom(null);
    setEditing(admission);
    setModalOpen(true);
  };

  const views: { value: View; label: string; icon: typeof LayoutGrid }[] = [
    { value: 'board', label: t('rooms.title'), icon: LayoutGrid },
    { value: 'list', label: t('admissions.title'), icon: List }
  ];

  return (
    <>
      <PageHeader
        title={t('admissions.title')}
        description={t(view === 'board' ? 'admissions.description' : 'admissions.description')}
        actions={
          <>
            <div
              className="flex rounded-md border p-0.5"
              role="group"
              aria-label={t('common.action.view')}
            >
              {views.map(option => {
                const Icon = option.icon;
                const active = view === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setView(option.value)}
                    aria-pressed={active}
                    className={cn(
                      'flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors',
                      active
                        ? 'bg-secondary font-medium text-secondary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {option.label}
                  </button>
                );
              })}
            </div>

            {can('create-check-in') && (
              <Button onClick={() => openAdmission(null)}>
                <Plus className="h-4 w-4" />
                {t('admissions.admitPatient')}
              </Button>
            )}
          </>
        }
      />

      {view === 'board' ? (
        <WardBoard
          onAdmit={openAdmission}
          onEdit={openEdit}
          onDischarge={admission => setDischarging(admission)}
        />
      ) : (
        <AdmissionTable onEdit={openEdit} onDischarge={admission => setDischarging(admission)} />
      )}

      <AdmissionModal
        open={modalOpen}
        admission={editing}
        presetRoom={presetRoom}
        submitting={mutations.isCreating || mutations.isUpdating}
        onClose={closeModal}
        onSubmit={async payload => {
          if (editing) {
            await mutations.update({ id: editing.id, data: payload });
          } else {
            await mutations.create(payload);
          }
        }}
      />

      <DischargeModal
        admission={discharging}
        submitting={isDischarging}
        onCancel={() => setDischarging(null)}
        onConfirm={async payload => {
          if (discharging) await discharge({ id: discharging.id, payload });
        }}
      />
    </>
  );
}
