import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, List, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { useResourceList, useResourceMutations } from '@/hooks/api/useResource';
import { categoryService, entityService } from '@/services';
import { useAuthStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import type { Category, Entity } from '@/types/models';
import { CategoryModal, type CategoryFormValues } from '../components/CategoryModal';
import { EntityModal, type EntityPayload } from '../components/EntityModal';

/**
 * The lookup lists the rest of the app depends on.
 *
 * Lists and their options are one screen rather than two, because an option is
 * meaningless without its list — "Distributor" only means something under
 * "Vendor Type". Two separate pages would make the user hold the relationship
 * in their head and pick a parent from a dropdown every time.
 *
 * The names matter beyond this screen: several forms find their options by
 * looking a list up by name ("Vendor Type", "Admission Type", "Return Reason",
 * "GRN Category", "Service Category", "Service Center Type", "UOM", "Item
 * Category"), so renaming one can leave a form with nothing to offer.
 */
export default function LookupListPage() {
  const { t } = useTranslation();
  const can = useAuthStore(state => state.can);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const categories = useResourceList<Category>(
    '/administration/categories',
    'categories',
    'categoryName'
  );

  const extraParams = useMemo(
    () => (selectedId ? { categoryId: selectedId } : {}),
    [selectedId]
  );

  // Ascending: this list has to read in the same order as the dropdowns it
  // feeds, which the backend serves as `sort ASC`.
  const entities = useResourceList<Entity>('/entities', 'entities', 'sort', extraParams, 'asc');

  // Land on the first list so the right pane is never pointlessly empty.
  useEffect(() => {
    if (selectedId === null && categories.items.length > 0) {
      setSelectedId(categories.items[0].id);
    }
  }, [categories.items, selectedId]);

  const selected = categories.items.find(category => category.id === selectedId) ?? null;

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<Entity | null>(null);

  const categoryMutations = useResourceMutations(categoryService, 'categories', t('lookups.listEntity'), {
    onSuccess: () => {
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setDeletingCategory(null);
    }
  });

  const entityMutations = useResourceMutations(entityService, 'entities', t('lookups.optionEntity'), {
    onSuccess: () => {
      setEntityModalOpen(false);
      setEditingEntity(null);
      setDeletingEntity(null);
    }
  });

  const columns: Column<Entity>[] = [
    {
      key: 'entityName',
      header: t('lookups.column.option'),
      className: 'font-medium',
      render: row => (
        <span className="flex items-center gap-2">
          {row.entityName}
          {row.selected && <Badge variant="info">{t('lookups.defaultBadge')}</Badge>}
        </span>
      )
    },
    {
      key: 'sort',
      header: t('lookups.column.order'),
      className: 'w-20 tabular-nums',
      render: row => (row.sort != null ? String(row.sort) : '0')
    },
    {
      header: t('common.label.actions'),
      sortable: false,
      className: 'w-24 text-right',
      render: row => (
        <div className="flex justify-end gap-1">
          {can('update-entity') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setEditingEntity(row);
                setEntityModalOpen(true);
              }}
              aria-label={t('common.action.editItem', { item: row.entityName })}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('delete-entity') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => setDeletingEntity(row)}
              aria-label={t('common.action.deleteItem', { item: row.entityName })}
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
        title={t('lookups.title')}
        description={t('lookups.description')}
        actions={
          can('create-category') && (
            <Button
              onClick={() => {
                setEditingCategory(null);
                setCategoryModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('lookups.newList')}
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="border-b px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <List className="h-4 w-4" />
              {t('lookups.lists')}
            </p>
          </div>

          {categories.loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : categories.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t('lookups.noLists')}
            </p>
          ) : (
            <div>
              {categories.items.map(category => (
                <div
                  key={category.id}
                  className={cn(
                    'flex items-center gap-1 border-b px-2 py-1.5 last:border-b-0',
                    category.id === selectedId && 'bg-primary/10'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(category.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent"
                  >
                    <span className="truncate">{category.categoryName}</span>
                    <ChevronRight
                      className={cn(
                        'ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground',
                        category.id === selectedId && 'text-primary'
                      )}
                    />
                  </button>

                  {can('update-category') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryModalOpen(true);
                      }}
                      aria-label={t('lookups.renameAria', { name: category.categoryName })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {can('delete-category') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive"
                      onClick={() => setDeletingCategory(category)}
                      aria-label={t('common.action.deleteItem', { item: category.categoryName })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="min-w-0">
          {selected ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{selected.categoryName}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('lookups.optionCount', { count: entities.totalCount })}
                  </p>
                </div>
                {can('create-entity') && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingEntity(null);
                      setEntityModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {t('lookups.newOption')}
                  </Button>
                )}
              </div>

              <DataTable
                columns={columns}
                rows={entities.items}
                loading={entities.loading}
                rowKey={row => row.id}
                sortBy={entities.sortBy}
                sortOrder={entities.sortOrder}
                onSort={entities.onSort}
                emptyMessage={t('lookups.emptyOptions', { list: selected.categoryName })}
              />

              <Pagination
                currentPage={entities.currentPage}
                totalPages={entities.totalPages}
                pageSize={entities.pageSize}
                totalCount={entities.totalCount}
                onPageChange={entities.onPageChange}
                onPageSizeChange={entities.onPageSizeChange}
              />
            </>
          ) : (
            <Card className="p-10 text-center">
              <p className="text-sm text-muted-foreground">
                {t('lookups.choosePrompt')}
              </p>
            </Card>
          )}
        </div>
      </div>

      <CategoryModal
        open={categoryModalOpen}
        category={editingCategory}
        submitting={categoryMutations.isCreating || categoryMutations.isUpdating}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={async (values: CategoryFormValues) => {
          if (editingCategory) {
            await categoryMutations.update({ id: editingCategory.id, data: values });
          } else {
            await categoryMutations.create(values);
          }
        }}
      />

      <EntityModal
        open={entityModalOpen}
        entity={editingEntity}
        categoryId={selected?.id ?? null}
        categoryName={selected?.categoryName ?? ''}
        submitting={entityMutations.isCreating || entityMutations.isUpdating}
        onClose={() => {
          setEntityModalOpen(false);
          setEditingEntity(null);
        }}
        onSubmit={async (payload: EntityPayload) => {
          if (editingEntity) {
            await entityMutations.update({ id: editingEntity.id, data: payload });
          } else {
            await entityMutations.create(payload);
          }
        }}
      />

      <ConfirmDeleteModal
        open={!!deletingCategory}
        title={t('lookups.deleteListTitle')}
        description={
          deletingCategory
            ? t('lookups.deleteListBody', { name: deletingCategory.categoryName })
            : ''
        }
        deleting={categoryMutations.isDeleting}
        onCancel={() => setDeletingCategory(null)}
        onConfirm={async () => {
          if (!deletingCategory) return;
          await categoryMutations.remove(deletingCategory.id);
          if (deletingCategory.id === selectedId) setSelectedId(null);
        }}
      />

      <ConfirmDeleteModal
        open={!!deletingEntity}
        title={t('lookups.deleteOptionTitle')}
        description={
          deletingEntity ? t('lookups.deleteOptionBody', { name: deletingEntity.entityName }) : ''
        }
        deleting={entityMutations.isDeleting}
        onCancel={() => setDeletingEntity(null)}
        onConfirm={async () => {
          if (deletingEntity) await entityMutations.remove(deletingEntity.id);
        }}
      />
    </>
  );
}
