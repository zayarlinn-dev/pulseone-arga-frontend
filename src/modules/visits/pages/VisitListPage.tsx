import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { visitService, type VisitCreatePayload } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { formatDateTime } from '@/lib/utils';
import type { Visit } from '@/types/models';
import { VisitModal } from '../components/VisitModal';

export default function VisitListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState('');
  const extraParams = useMemo(
    () => (activeFilter ? { isActive: activeFilter === 'true' } : {}),
    [activeFilter]
  );

  const list = useResourceList<Visit>('/visits', 'visits', 'createdAt', extraParams);
  const [modalOpen, setModalOpen] = useState(false);

  const mutations = useResourceMutations<Visit, VisitCreatePayload>(visitService, 'visits', t('visits.entity'), {
    onSuccess: () => {
      // Opening a visit repoints patient.visit_id, which the patient list shows.
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient-summary'] });
      setModalOpen(false);
    }
  });

  const columns: Column<Visit>[] = [
    { key: 'visitCode', header: t('visits.column.visitCode'), className: 'font-mono text-xs' },
    {
      header: t('visits.column.patient'),
      sortable: false,
      className: 'font-medium',
      render: row =>
        row.patient ? (
          <span className="flex flex-col">
            <span>{row.patient.patientName}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.patient.patientNo}
            </span>
          </span>
        ) : (
          '-'
        )
    },
    {
      hideBelow: 'md',
      header: t('visits.column.registration'),
      sortable: false,
      render: row =>
        row.patient ? t(`patients.category.${row.patient.registrationCategory}`) : '-'
    },
    {
      key: 'isActive',
      header: t('common.label.status'),
      render: row => (
        <Badge variant={row.isActive ? 'success' : 'secondary'}>
          {t(row.isActive ? 'visits.status.open' : 'visits.status.closed')}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      hideBelow: 'sm',
      header: t('visits.column.opened'),
      render: row => formatDateTime(row.createdAt)
    }
  ];

  return (
    <>
      <PageHeader
        title={t('visits.title')}
        description={t('visits.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('visits.searchPlaceholder')}
        actions={
          can('create-visit') && (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { item: t('visits.entity') })}
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NativeSelect
          value={activeFilter}
          onChange={event => setActiveFilter(event.target.value)}
          className="h-8 w-auto min-w-36 text-xs"
          aria-label={t('visits.filter.label')}
        >
          <option value="">{t('visits.filter.all')}</option>
          <option value="true">{t('visits.filter.openOnly')}</option>
          <option value="false">{t('visits.filter.closedOnly')}</option>
        </NativeSelect>
        {activeFilter && (
          <Button variant="ghost" size="sm" onClick={() => setActiveFilter('')}>
            {t('common.action.clear')}
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        emptyMessage={t('visits.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <VisitModal
        open={modalOpen}
        submitting={mutations.isCreating}
        onClose={() => setModalOpen(false)}
        onSubmit={payload => mutations.create(payload).then(() => undefined)}
      />
    </>
  );
}
