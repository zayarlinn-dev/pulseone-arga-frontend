import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { userService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { formatDate } from '@/lib/utils';
import type { User } from '@/types/models';
import { UserModal } from '../components/UserModal';

export default function UserListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);
  const currentUserId = useAuthStore(state => state.user?.userId);
  const isSuperUser = useAuthStore(state => state.user?.isSuperUser ?? false);
  const queryClient = useQueryClient();
  const list = useResourceList<User>('/administration/users', 'users', 'username');

  const [pendingId, setPendingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<User | null>(null);

  const mutations = useResourceMutations(userService, 'users', t('users.entity'), {
    onSuccess: () => {
      setModalOpen(false);
      setEditing(null);
      setDeleting(null);
    }
  });

  const { mutateAsync: setActive } = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      userService.setActive(id, isActive),
    onMutate: ({ id }) => setPendingId(id),
    onSettled: () => setPendingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.statusUpdated'));
    },
    onError: (error: Error) => toast.error(error.message || t('users.statusFailed'))
  });

  const columns: Column<User>[] = [
    { key: 'username', header: t('users.column.username'), className: 'font-medium' },
    {
      key: 'role',
      header: t('users.column.role'),
      render: row => (
        <span className="flex items-center gap-2">
          <Badge variant="secondary">{t(`users.role.${row.role}`)}</Badge>
          {row.isSuperUser && <Badge variant="warning">{t('users.superUserBadge')}</Badge>}
        </span>
      )
    },
    {
      key: 'isActive',
      header: t('common.label.status'),
      render: row => (
        <Badge variant={row.isActive ? 'success' : 'destructive'}>
          {t(row.isActive ? 'common.status.active' : 'common.status.disabled')}
        </Badge>
      )
    },
    { key: 'remarks', hideBelow: 'lg', header: t('common.label.remarks'), sortable: false, render: row => row.remarks || '-' },
    { key: 'createdAt', hideBelow: 'md', header: t('common.label.createdAt'), render: row => formatDate(row.createdAt) },
    {
      header: t('common.label.actions'),
      sortable: false,
      className: 'w-56 text-right',
      render: row => {
        // Disabling or deleting your own account would end your session
        // mid-click, and the backend refuses the delete outright.
        const isSelf = row.id === currentUserId;

        return (
          <div className="flex items-center justify-end gap-1">
            {can('update-user') && !isSelf && (
              <Button
                variant="outline"
                size="sm"
                disabled={pendingId === row.id}
                onClick={() => setActive({ id: row.id, isActive: !row.isActive })}
              >
                {t(row.isActive ? 'common.action.disable' : 'common.action.enable')}
              </Button>
            )}
            {can('update-user') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setEditing(row);
                  setModalOpen(true);
                }}
                aria-label={t('common.action.editItem', { item: row.username })}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {can('delete-user') && !isSelf && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => setDeleting(row)}
                aria-label={t('common.action.deleteItem', { item: row.username })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {isSelf && <span className="text-xs text-muted-foreground">{t('users.self')}</span>}
          </div>
        );
      }
    }
  ];

  return (
    <>
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        searchValue={list.searchQuery}
        onSearchChange={list.setSearchQuery}
        searchPlaceholder={t('users.searchPlaceholder')}
        actions={
          can('create-user') && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('common.action.newItem', { item: t('users.entity') })}
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
        emptyMessage={t('users.empty')}
      />

      <Pagination
        currentPage={list.currentPage}
        totalPages={list.totalPages}
        pageSize={list.pageSize}
        totalCount={list.totalCount}
        onPageChange={list.onPageChange}
        onPageSizeChange={list.onPageSizeChange}
      />

      <UserModal
        open={modalOpen}
        user={editing}
        submitting={mutations.isCreating || mutations.isUpdating}
        canGrantSuperUser={isSuperUser}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={async payload => {
          if (editing) {
            // A blank password field arrives as no password at all, which the
            // API reads as "leave the current one alone".
            await mutations.update({ id: editing.id, data: payload });
            return;
          }

          const { password, ...rest } = payload;
          // The form makes the password required when creating, so this only
          // guards the type.
          if (!password) return;
          await mutations.create({ ...rest, password });
        }}
      />

      <ConfirmDeleteModal
        open={!!deleting}
        title={t('users.deleteTitle')}
        description={deleting ? t('users.deleteBody', { name: deleting.username }) : ''}
        deleting={mutations.isDeleting}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (deleting) await mutations.remove(deleting.id);
        }}
      />
    </>
  );
}
