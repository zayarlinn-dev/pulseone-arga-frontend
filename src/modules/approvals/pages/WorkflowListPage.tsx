import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { approvalWorkflowService } from '@/services/erpService';
import { useAuthStore } from '@/stores/userStore';
import { formatCurrency } from '@/lib/utils';
import type { ApprovalWorkflow } from '@/types/erp';
import { documentTypeLabel } from './ApprovalListPage';
import { WorkflowModal } from '../components/WorkflowModal';

export default function WorkflowListPage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);

  const list = useResourceList<ApprovalWorkflow>(
    '/approval-workflows',
    'approval-workflows',
    'workflowName',
    {},
    'asc'
  );

  const [editing, setEditing] = useState<ApprovalWorkflow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<ApprovalWorkflow | null>(null);

  const mutations = useResourceMutations(
    approvalWorkflowService,
    'approval-workflows',
    t('approvals.workflow.entity'),
    {
      onSuccess: () => {
        setModalOpen(false);
        setEditing(null);
        setDeleting(null);
      }
    }
  );

  const columns: Column<ApprovalWorkflow>[] = [
    { key: 'workflowCode', hideBelow: 'md', header: t('approvals.workflow.column.code'), className: 'font-mono text-xs' },
    { key: 'workflowName', header: t('approvals.workflow.column.name'), className: 'font-medium' },
    {
      key: 'documentType',
      header: t('approvals.workflow.column.documentType'),
      render: row => documentTypeLabel(t, row.documentType)
    },
    {
      key: 'minAmount',
      hideBelow: 'lg',
      header: t('approvals.workflow.column.minAmount'),
      className: 'text-right tabular-nums',
      render: row => (Number(row.minAmount) > 0 ? formatCurrency(Number(row.minAmount)) : '-')
    },
    {
      hideBelow: 'md',
      header: t('approvals.workflow.column.steps'),
      sortable: false,
      render: row => (
        <div className="flex flex-wrap gap-1">
          {(row.steps ?? []).map(step => (
            <Badge key={step.id} variant="secondary" className="text-[10px]">
              {step.stepNo}. {step.stepName}
            </Badge>
          ))}
        </div>
      )
    },
    {
      key: 'isActive',
      hideBelow: 'sm',
      header: t('approvals.workflow.column.active'),
      render: row => (
        <Badge variant={row.isActive ? 'success' : 'secondary'}>
          {row.isActive
            ? t('common.label.yes', { ns: 'translation' })
            : t('common.label.no', { ns: 'translation' })}
        </Badge>
      )
    },
    {
      header: t('common.label.actions', { ns: 'translation' }),
      sortable: false,
      className: 'w-24 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {can('update-approval-workflow') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={t('common.action.editItem', { ns: 'translation', item: row.workflowName })}
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-approval-workflow') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              aria-label={t('common.action.deleteItem', {
                ns: 'translation',
                item: row.workflowName
              })}
              onClick={() => setDeleting(row)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title={t('approvals.workflow.title')}
        description={t('approvals.workflow.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('approvals.workflow.searchPlaceholder')}
        actions={
          can('create-approval-workflow') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', {
                ns: 'translation',
                item: t('approvals.workflow.entity')
              })}
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        emptyMessage={t('approvals.workflow.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <WorkflowModal
        open={modalOpen}
        workflow={editing}
        submitting={mutations.isCreating || mutations.isUpdating}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={async values => {
          if (editing) {
            await mutations.update({ id: editing.id, data: values });
          } else {
            await mutations.create(values);
          }
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(deleting)}
        title={t('approvals.workflow.deleteTitle')}
        description={
          deleting ? t('approvals.workflow.deleteBody', { name: deleting.workflowName }) : ''
        }
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}
