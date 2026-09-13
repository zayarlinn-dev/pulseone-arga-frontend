import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Field } from '@/components/ui/field';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { useDropdown } from '@/hooks/api/useDropdown';
import { useResourceList } from '@/hooks/api/useResource';
import { useAuthStore } from '@/stores/userStore';
import { formatDateTime } from '@/lib/utils';
import type { ClinicalEncounter, EncounterStatus, EncounterType } from '@/types/erp';

export default function EncounterListPage() {
  const { t } = useTranslation('erp');
  const can = useAuthStore(state => state.can);
  const navigate = useNavigate();

  const [status, setStatus] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [encounterType, setEncounterType] = useState('');

  const { data: doctors } = useDropdown('/dropdown/employees', { employmentCategory: 'doctor' });

  const list = useResourceList<ClinicalEncounter>(
    '/clinical/encounters',
    'encounters',
    'encounterDate',
    {
      ...(status ? { status } : {}),
      ...(doctorId ? { doctorId } : {}),
      ...(encounterType ? { encounterType } : {})
    }
  );

  const columns: Column<ClinicalEncounter>[] = [
    { key: 'encounterNo', hideBelow: 'md', header: t('encounters.column.encounterNo'), className: 'font-mono text-xs' },
    {
      key: 'encounterDate',
      header: t('encounters.column.date'),
      className: 'whitespace-nowrap',
      render: row => formatDateTime(row.encounterDate)
    },
    {
      header: t('encounters.column.patient'),
      sortable: false,
      render: row => (
        <div>
          <div className="font-medium">{row.patient?.patientName ?? '-'}</div>
          <div className="font-mono text-xs text-muted-foreground">{row.patient?.patientNo}</div>
        </div>
      )
    },
    {
      hideBelow: 'md',
      header: t('encounters.column.doctor'),
      sortable: false,
      render: row => row.doctor?.fullName ?? '-'
    },
    {
      key: 'encounterType',
      hideBelow: 'lg',
      header: t('encounters.column.type'),
      render: row => <Badge variant="outline">{t(`encounters.type.${row.encounterType}`)}</Badge>
    },
    {
      hideBelow: 'lg',
      header: t('encounters.column.complaint'),
      sortable: false,
      render: row => (
        <span className="line-clamp-1 text-muted-foreground">{row.chiefComplaint || '-'}</span>
      )
    },
    {
      hideBelow: 'xl',
      header: t('encounters.column.diagnoses'),
      sortable: false,
      render: row =>
        row.diagnoses && row.diagnoses.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.diagnoses.slice(0, 2).map(diagnosis => (
              <Badge key={diagnosis.id} variant="secondary" className="text-[10px]">
                {diagnosis.code ?? diagnosis.description}
              </Badge>
            ))}
            {row.diagnoses.length > 2 && (
              <Badge variant="outline" className="text-[10px]">
                +{row.diagnoses.length - 2}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
    },
    {
      key: 'status',
      header: t('encounters.column.status'),
      render: row => <EncounterStatusBadge status={row.status} />
    }
  ];

  return (
    <>
      <PageHeader
        title={t('encounters.title')}
        description={t('encounters.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('encounters.searchPlaceholder')}
        actions={
          can('create-encounter') && (
            <Button asChild>
              <Link to="/clinical/encounters/new">
                <Plus className="h-4 w-4" />
                {t('common.action.newItem', { ns: 'translation', item: t('encounters.entity') })}
              </Link>
            </Button>
          )
        }
      />

      <Card className="mb-4">
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-3">
          <Field label={t('encounters.column.doctor')}>
            <NativeSelect value={doctorId} onChange={event => setDoctorId(event.target.value)}>
              <option value="">{t('audit.filter.allTypes')}</option>
              {doctors?.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('encounters.column.type')}>
            <NativeSelect
              value={encounterType}
              onChange={event => setEncounterType(event.target.value)}
            >
              <option value="">{t('audit.filter.allTypes')}</option>
              {(['opd', 'ipd', 'emergency', 'follow-up'] as EncounterType[]).map(value => (
                <option key={value} value={value}>
                  {t(`encounters.type.${value}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <Field label={t('encounters.column.status')}>
            <NativeSelect value={status} onChange={event => setStatus(event.target.value)}>
              <option value="">{t('audit.filter.allActions')}</option>
              {(['draft', 'finalised', 'amended'] as EncounterStatus[]).map(value => (
                <option key={value} value={value}>
                  {t(`encounters.status.${value}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={list.items}
        loading={list.loading}
        rowKey={row => row.id}
        sortBy={list.sortBy}
        sortOrder={list.sortOrder}
        onSort={list.onSort}
        onRowClick={row => navigate(`/clinical/encounters/${row.id}`)}
        emptyMessage={t('encounters.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />
    </>
  );
}

export function EncounterStatusBadge({ status }: { status: EncounterStatus }) {
  const { t } = useTranslation('erp');

  const variant =
    status === 'finalised' ? 'success' : status === 'amended' ? 'warning' : 'secondary';

  return <Badge variant={variant}>{t(`encounters.status.${status}`)}</Badge>;
}
