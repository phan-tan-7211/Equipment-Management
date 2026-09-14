import { useI18n } from '@/i18n';
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react';
import { useInventoryPartsManagerAccess } from '@/features/inventory/hooks/useInventoryPartsManagerAccess';
import {
  useAlternateGroups,
  useDeleteAlternateGroup,
} from '@/features/inventory/hooks/useAlternateGroups';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import Page from '@/components/layout/Page';
import PageHeader from '@/components/layout/PageHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { AlternateGroupForm } from '@/features/inventory/components/AlternateGroupForm';
import { AlternateGroupCreateWizard } from '@/features/inventory/components/AlternateGroupCreateWizard';
import { AlternateGroupListCardContent } from '@/features/inventory/components/AlternateGroupListCardContent';
import { AlternateGroupStatusDot } from '@/features/inventory/components/AlternateGroupStatusDot';
import { AlternateGroupsDesktopTable } from '@/features/inventory/components/AlternateGroupsDesktopTable';
import AlternateGroupsPaginationFooter from '@/features/inventory/components/AlternateGroupsPaginationFooter';
import AlternateGroupsToolbar, {
  type AlternateGroupsViewMode,
} from '@/features/inventory/components/AlternateGroupsToolbar';
import type { AlternateGroupTableSortField } from '@/features/inventory/components/alternateGroupTableColumns';
import type { PartAlternateGroup } from '@/features/inventory/types/inventory';
import {
  filterAlternateGroupTableRows,
  flattenAlternateGroupsToTableRows,
  groupMatchesSearch,
  sortAlternateGroupTableRows,
} from '@/features/inventory/utils/alternateGroupTableRows';
import {
  ALTERNATE_GROUP_CARD_PAGE_SIZE_OPTIONS,
  ALTERNATE_GROUP_TABLE_PAGE_SIZE_OPTIONS,
  clampAlternateGroupPage,
  DEFAULT_ALTERNATE_GROUP_CARD_PAGE_SIZE,
  DEFAULT_ALTERNATE_GROUP_TABLE_PAGE_SIZE,
  paginateAlternateGroupItems,
} from '@/features/inventory/utils/alternateGroupPagination';

type GroupStatusFilter = 'all' | 'verified' | 'unverified' | 'deprecated';
type GroupSortOption = 'name-asc' | 'name-desc' | 'updated-desc' | 'updated-asc';

const AlternateGroupsPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentOrganization, canEdit } = useInventoryPartsManagerAccess();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GroupStatusFilter>('all');
  const [sortBy, setSortBy] = useState<GroupSortOption>('name-asc');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PartAlternateGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<PartAlternateGroup | null>(null);
  const [actionMenuGroup, setActionMenuGroup] = useState<PartAlternateGroup | null>(null);
  const [viewMode, setViewMode] = useState<AlternateGroupsViewMode>('cards');
  const [tableSortBy, setTableSortBy] = useState<AlternateGroupTableSortField>('group_name');
  const [tableSortOrder, setTableSortOrder] = useState<'asc' | 'desc'>('asc');
  const [cardPage, setCardPage] = useState(1);
  const [tablePage, setTablePage] = useState(1);
  const [cardPageSize, setCardPageSize] = useState(DEFAULT_ALTERNATE_GROUP_CARD_PAGE_SIZE);
  const [tablePageSize, setTablePageSize] = useState(DEFAULT_ALTERNATE_GROUP_TABLE_PAGE_SIZE);

  const { data: groups = [], isLoading } = useAlternateGroups(currentOrganization?.id);
  const deleteMutation = useDeleteAlternateGroup();

  const effectiveViewMode: AlternateGroupsViewMode =
    isMobile ? 'cards' : viewMode;

  useEffect(() => {
    if (isMobile && viewMode === 'table') {
      setViewMode('cards');
    }
  }, [isMobile, viewMode]);

  useEffect(() => {
    setCardPage(1);
    setTablePage(1);
  }, [search, statusFilter, sortBy, tableSortBy, tableSortOrder]);

  // Filter and sort groups
  const filteredGroups = useMemo(() => {
    const needle = search.trim().toLowerCase();

    const filtered = groups.filter((group) => {
      const matchesSearch = !needle || groupMatchesSearch(group, needle);
      const matchesStatus = statusFilter === 'all' || group.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'updated-desc':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'updated-asc':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [groups, search, statusFilter, sortBy]);

  const filteredTableRows = useMemo(() => {
    const rows = flattenAlternateGroupsToTableRows(filteredGroups);
    const filtered = filterAlternateGroupTableRows(rows, search);
    return sortAlternateGroupTableRows(filtered, tableSortBy, tableSortOrder);
  }, [filteredGroups, search, tableSortBy, tableSortOrder]);

  const safeCardPage = clampAlternateGroupPage(cardPage, filteredGroups.length, cardPageSize);
  const safeTablePage = clampAlternateGroupPage(
    tablePage,
    filteredTableRows.length,
    tablePageSize,
  );

  const paginatedGroups = useMemo(
    () => paginateAlternateGroupItems(filteredGroups, safeCardPage, cardPageSize),
    [filteredGroups, safeCardPage, cardPageSize],
  );

  const paginatedTableRows = useMemo(
    () => paginateAlternateGroupItems(filteredTableRows, safeTablePage, tablePageSize),
    [filteredTableRows, safeTablePage, tablePageSize],
  );

  const handleTableSortChange = (nextSortBy: AlternateGroupTableSortField) => {
    if (nextSortBy === tableSortBy) {
      setTableSortOrder((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setTableSortBy(nextSortBy);
    setTableSortOrder('asc');
  };

  const handleViewGroup = (groupId: string) => {
    navigate(`/dashboard/alternate-groups/${groupId}`);
  };

  const handleDeleteGroup = async () => {
    if (!currentOrganization || !deletingGroup) return;
    try {
      await deleteMutation.mutateAsync({
        organizationId: currentOrganization.id,
        groupId: deletingGroup.id,
      });
      setDeletingGroup(null);
    } catch {
      // Error handled by mutation
    }
  };

  if (!currentOrganization) {
    return (
      <Page maxWidth="7xl" padding="responsive">
        <PageHeader
          title={t('alternateGroups.title')}
          description={t('alternateGroups.selectOrganization')}
        />
      </Page>
    );
  }

  return (
    <Page maxWidth="7xl" padding="responsive">
      <div className="space-y-6">
        <PageHeader
          title={t('alternateGroups.title')}
          description={t('alternateGroups.description')}
          hideDescriptionOnMobile
          actions={
            canEdit && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('alternateGroups.newGroup')}
              </Button>
            )
          }
        />

        {/* Toolbar */}
        <AlternateGroupsToolbar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          filteredGroups={filteredGroups}
          canEdit={canEdit}
          viewMode={effectiveViewMode}
          onViewModeChange={isMobile ? undefined : setViewMode}
        />

        {/* Groups List */}
        {isLoading ? (
          effectiveViewMode === 'table' ? (
            <Card>
              <CardContent className="p-0">
                <div className="space-y-2 p-4">
                  {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          )
        ) : filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              {groups.length === 0 ? (
                <>
                  <h3 className="text-lg font-semibold mb-2">{t('alternateGroups.noGroupsYet')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('alternateGroups.emptyDescription')}
                  </p>
                  {canEdit && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('alternateGroups.newGroup')}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2">{t('alternateGroups.noGroupsFound')}</h3>
                  <p className="text-muted-foreground">
                    {t('alternateGroups.noGroupsSearch', { search })}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : effectiveViewMode === 'table' ? (
          <div className="space-y-4">
            <AlternateGroupsDesktopTable
              rows={paginatedTableRows}
              sortBy={tableSortBy}
              sortOrder={tableSortOrder}
              onSortChange={handleTableSortChange}
            />
            <AlternateGroupsPaginationFooter
              totalItems={filteredTableRows.length}
              page={safeTablePage}
              pageSize={tablePageSize}
              pageSizeOptions={ALTERNATE_GROUP_TABLE_PAGE_SIZE_OPTIONS}
              itemLabel={t('alternateGroups.part')}
              onPageChange={setTablePage}
              onPageSizeChange={setTablePageSize}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedGroups.map((group) => (
                <Card
                  key={group.id}
                  data-testid={`alternate-group-card-${group.id}`}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleViewGroup(group.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-start gap-2 pr-1">
                        <AlternateGroupStatusDot status={group.status} />
                        <CardTitle className="min-w-0 flex-1 text-lg leading-snug wrap-break-word">
                          {group.name}
                        </CardTitle>
                      </div>
                      {canEdit && (
                        <>
                          {isMobile ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuGroup(group);
                              }}
                              aria-label={t('alternateGroups.moreOptions', { name: group.name })}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="shrink-0" aria-label={t('alternateGroups.moreOptions', { name: group.name })}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewGroup(group.id);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t('alternateGroups.viewDetails')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingGroup(group);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  {t('alternateGroups.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingGroup(group);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  {t('alternateGroups.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AlternateGroupListCardContent
                      description={group.description}
                      notes={group.notes}
                      memberSummaries={group.member_summaries}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
            <AlternateGroupsPaginationFooter
              totalItems={filteredGroups.length}
              page={safeCardPage}
              pageSize={cardPageSize}
              pageSizeOptions={ALTERNATE_GROUP_CARD_PAGE_SIZE_OPTIONS}
              itemLabel={t('alternateGroups.group')}
              onPageChange={setCardPage}
              onPageSizeChange={setCardPageSize}
            />
          </div>
        )}
      </div>

      <Drawer open={!!actionMenuGroup} onOpenChange={(open) => !open && setActionMenuGroup(null)}>
        <DrawerContent className="max-h-[50dvh]">
          <DrawerHeader>
            <DrawerTitle>{t('alternateGroups.groupActions')}</DrawerTitle>
            <DrawerDescription>{actionMenuGroup?.name}</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start min-h-11"
              onClick={() => {
                if (!actionMenuGroup) return;
                handleViewGroup(actionMenuGroup.id);
                setActionMenuGroup(null);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t('alternateGroups.viewDetails')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start min-h-11"
              onClick={() => {
                if (!actionMenuGroup) return;
                setEditingGroup(actionMenuGroup);
                setActionMenuGroup(null);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t('alternateGroups.edit')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start min-h-11 text-destructive"
              onClick={() => {
                if (!actionMenuGroup) return;
                setDeletingGroup(actionMenuGroup);
                setActionMenuGroup(null);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('alternateGroups.delete')}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Create Dialog / Drawer — uses multi-step wizard */}
      {isMobile ? (
        <Drawer open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DrawerContent className="max-h-[92dvh]">
            <DrawerHeader>
              <DrawerTitle>{t('alternateGroups.newGroup')}</DrawerTitle>
              <DrawerDescription>
                {t('alternateGroups.createDescription')}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto">
              <AlternateGroupCreateWizard
                onSuccess={(groupId) => {
                  setShowCreateDialog(false);
                  navigate(`/dashboard/alternate-groups/${groupId}`);
                }}
                onCancel={() => setShowCreateDialog(false)}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('alternateGroups.newGroup')}</DialogTitle>
              <DialogDescription>
                {t('alternateGroups.createDescription')}
              </DialogDescription>
            </DialogHeader>
            <AlternateGroupCreateWizard
              onSuccess={(groupId) => {
                setShowCreateDialog(false);
                navigate(`/dashboard/alternate-groups/${groupId}`);
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog / Drawer */}
      {isMobile ? (
        <Drawer open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
          <DrawerContent className="max-h-[85dvh]">
            <DrawerHeader>
              <DrawerTitle>{t('alternateGroups.editTitle')}</DrawerTitle>
              <DrawerDescription>
                {t('alternateGroups.editDescription')}
              </DrawerDescription>
            </DrawerHeader>
            {editingGroup && (
              <div className="px-4 pb-4 overflow-y-auto">
                <AlternateGroupForm
                  group={editingGroup}
                  onSuccess={() => setEditingGroup(null)}
                  onCancel={() => setEditingGroup(null)}
                />
              </div>
            )}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('alternateGroups.editTitle')}</DialogTitle>
              <DialogDescription>
                {t('alternateGroups.editDescription')}
              </DialogDescription>
            </DialogHeader>
            {editingGroup && (
              <AlternateGroupForm
                group={editingGroup}
                onSuccess={() => setEditingGroup(null)}
                onCancel={() => setEditingGroup(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingGroup} onOpenChange={() => setDeletingGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('alternateGroups.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('alternateGroups.deleteDescription', { name: deletingGroup?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('alternateGroups.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('alternateGroups.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
};

export default AlternateGroupsPage;

