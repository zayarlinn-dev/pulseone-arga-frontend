import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { NativeSelect } from '@/components/ui/native-select';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { roomService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import type { Room } from '@/types/models';
import { RoomModal, ROOM_STATUSES } from '../components/RoomModal';

const STATUS_VARIANT: Record<Room['roomStatus'], BadgeProps['variant']> = {
  available: 'success',
  occupied: 'info',
  cleaning: 'warning',
  maintenance: 'destructive',
  reserved: 'secondary'
};

export default function RoomListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);

  const [statusFilter, setStatusFilter] = useState('');
  const extraParams = useMemo(
    () => (statusFilter ? { roomStatus: statusFilter } : {}),
    [statusFilter]
  );

  const list = useResourceList<Room>(
    '/administration/rooms',
    'rooms',
    'roomName',
    extraParams
  );

  const [editing, setEditing] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Room | null>(null);

  const mutations = useResourceMutations(roomService, 'rooms', t('rooms.entity'), {
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setDeleting(null);
    }
  });

  const columns: Column<Room>[] = [
    { key: 'roomCode', hideBelow: 'md', header: t('rooms.column.code'), className: 'font-mono text-xs' },
    { key: 'roomName', header: t('rooms.column.name'), className: 'font-medium' },
    {
      key: 'roomType',
      header: t('rooms.column.type'),
      render: row => <Badge variant="outline">{t(`rooms.type.${row.roomType}`)}</Badge>
    },
    { key: 'floor', hideBelow: 'lg', header: t('rooms.column.floor'), render: row => row.floor || '-' },
    {
      key: 'totalBeds',
      hideBelow: 'md',
      header: t('rooms.column.beds'),
      className: 'tabular-nums',
      render: row => String(row.totalBeds)
    },
    {
      key: 'roomStatus',
      header: t('rooms.column.roomStatus'),
      render: row => (
        <Badge variant={STATUS_VARIANT[row.roomStatus] ?? 'secondary'}>
          {t(`rooms.roomStatus.${row.roomStatus}`)}
        </Badge>
      )
    },
    {
      key: 'isActive',
      hideBelow: 'lg',
      header: t('rooms.column.status'),
      render: row => (
        <Badge variant={row.isActive ? 'success' : 'secondary'}>
          {t(row.isActive ? 'common.status.active' : 'common.status.inactive')}
        </Badge>
      )
    },
    {
      header: t('common.label.actions'),
      sortable: false,
      className: 'w-24 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {can('update-room') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditing(row);
                setModalOpen(true);
              }}
              aria-label={t('common.action.editItem', { item: row.roomName })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-room') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeleting(row)}
              aria-label={t('common.action.deleteItem', { item: row.roomName })}
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
        title={t('rooms.title')}
        description={t('rooms.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('rooms.searchPlaceholder')}
        actions={
          can('create-room') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { item: t('rooms.entity') })}
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <NativeSelect
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className="h-8 w-auto min-w-40 text-xs"
          aria-label={t('rooms.filterStatus')}
        >
          <option value="">{t('rooms.allStatuses')}</option>
          {ROOM_STATUSES.map(status => (
            <option key={status} value={status}>
              {t(`rooms.roomStatus.${status}`)}
            </option>
          ))}
        </NativeSelect>
        {statusFilter && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('')}>
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
        emptyMessage={t('rooms.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <RoomModal
        open={modalOpen}
        room={editing}
        submitting={mutations.isCreating || mutations.isUpdating}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={async payload => {
          if (editing) {
            await mutations.update({ id: editing.id, data: payload });
          } else {
            await mutations.create(payload);
          }
        }}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        title={t('rooms.deleteTitle')}
        description={deleting ? t('rooms.deleteBody', { name: deleting.roomName }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}
