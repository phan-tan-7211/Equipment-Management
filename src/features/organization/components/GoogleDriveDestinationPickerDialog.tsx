import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ChevronRight, FolderOpen, HardDrive, Plus, Trash2 } from 'lucide-react';
import { useAppToast } from '@/hooks/useAppToast';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';
import {
  createGoogleDriveDestinationFolder,
  deleteGoogleDriveDestinationFolder,
  GoogleDriveFolderDeleteConfirmationRequiredError,
  listGoogleDriveDestinations,
  type GoogleDriveDestinationBrowseItem,
  type GoogleExportSelectionKind,
} from '@/services/google-workspace';
import { getGoogleWorkspaceDestinationSaveErrorToast } from '@/features/organization/utils/googleWorkspaceDestinationSaveError';
import { resolveDriveFolderCreateTarget } from '@/features/organization/utils/googleDriveFolderCreateTarget';
import { GoogleDriveFolderDeleteConfirmDialog } from '@/features/organization/components/GoogleDriveFolderDeleteConfirmDialog';
import { integrationActionButtonClassName } from '@/features/organization/components/IntegrationCardLayout';

interface BrowseFrame {
  parentId: string | null;
  driveId: string | null;
  label: string;
}

type GoogleDriveDestinationPickerRowProps = {
  item: GoogleDriveDestinationBrowseItem;
  isProtected: boolean;
  isBusy: boolean;
  isDeleting: boolean;
  onDelete: (item: GoogleDriveDestinationBrowseItem) => void;
  onSelect: (item: GoogleDriveDestinationBrowseItem) => void;
  onOpen: (item: GoogleDriveDestinationBrowseItem) => void;
};

function GoogleDriveDestinationPickerRow({
  item,
  isProtected,
  isBusy,
  isDeleting,
  onDelete,
  onSelect,
  onOpen,
}: GoogleDriveDestinationPickerRowProps) {
  const { t } = useI18n();
  const canDelete = item.kind === 'folder' && !isProtected;
  const kindLabel =
    item.kind === 'shared_drive' ? t('organizationIntegrations.sharedDrive') : isProtected ? t('organizationIntegrations.orgFolder') : t('organizationIntegrations.folder');

  return (
    <div className="flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        {item.kind === 'shared_drive' ? (
          <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <FolderOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium wrap-break-word leading-snug sm:truncate">{item.name}</p>
          {isProtected ? (
            <Badge
              variant="outline"
              title={t('organizationIntegrations.currentOrgFolder')}
              className="mt-1.5 h-5 px-1.5 text-[10px] font-normal bg-primary/5"
            >
              {t('organizationIntegrations.orgFolder')}
            </Badge>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">{kindLabel}</p>
          )}
        </div>
      </div>

      <div
        className={cn(
          'grid w-full gap-2 sm:flex sm:w-auto sm:shrink-0 sm:items-center',
          canDelete && item.selectable && 'grid-cols-[auto_1fr_1fr]',
          !canDelete && item.selectable && 'grid-cols-2',
          canDelete && !item.selectable && 'grid-cols-[auto_1fr]',
          !canDelete && !item.selectable && 'grid-cols-1',
        )}
      >
        {canDelete && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            disabled={isBusy}
            onClick={() => onDelete(item)}
            aria-label={t('organizationIntegrations.deleteNamedFolder', { name: item.name })}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        )}
        {item.selectable && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 w-full justify-center sm:w-auto"
            disabled={isBusy}
            onClick={() => onSelect(item)}
          >
            {t('organizationIntegrations.select')}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant={item.selectable ? 'ghost' : 'outline'}
          className={cn(
            'h-9 w-full justify-center sm:w-auto',
            !item.selectable && 'col-span-full sm:col-span-1',
          )}
          disabled={isBusy}
          onClick={() => onOpen(item)}
          aria-label={t('organizationIntegrations.openNamed', { name: item.name })}
        >
          {t('organizationIntegrations.open')}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

interface GoogleDriveDestinationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
  workspaceDomain: string | null;
  connectedEmail: string | null;
  protectedFolderId?: string | null;
  onSelect: (selection: {
    selectionKind: GoogleExportSelectionKind;
    parentId: string;
    displayName: string;
  }) => Promise<void>;
  isSaving?: boolean;
}

export function GoogleDriveDestinationPickerDialog({
  open,
  onOpenChange,
  organizationId,
  organizationName,
  workspaceDomain,
  connectedEmail,
  protectedFolderId = null,
  onSelect,
  isSaving = false,
}: GoogleDriveDestinationPickerDialogProps) {
  const { t } = useI18n();
  const { toast } = useAppToast();
  const queryClient = useQueryClient();
  const [stack, setStack] = useState<BrowseFrame[]>([
    { parentId: null, driveId: null, label: 'All locations' },
  ]);
  const [newFolderName, setNewFolderName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<GoogleDriveDestinationBrowseItem | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteChildCount, setPendingDeleteChildCount] = useState(0);

  const currentFrame = stack[stack.length - 1];
  const createTarget = useMemo(
    () =>
      resolveDriveFolderCreateTarget({
        parentId: currentFrame.parentId,
        driveId: currentFrame.driveId,
        locationLabel: currentFrame.label === 'All locations' ? null : currentFrame.label,
      }),
    [currentFrame.driveId, currentFrame.label, currentFrame.parentId],
  );

  const browseQuery = useQuery({
    queryKey: [
      'google-workspace',
      'drive-destinations',
      organizationId,
      currentFrame.parentId,
      currentFrame.driveId,
    ],
    queryFn: () =>
      listGoogleDriveDestinations({
        organizationId,
        parentId: currentFrame.parentId,
        driveId: currentFrame.driveId,
      }),
    enabled: open && Boolean(organizationId),
    staleTime: 30 * 1000,
  });

  const invalidateBrowse = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['google-workspace', 'drive-destinations', organizationId] });
  }, [organizationId, queryClient]);

  const createFolderMutation = useMutation({
    mutationFn: (name: string) =>
      createGoogleDriveDestinationFolder({
        organizationId,
        parentId: createTarget.parentId,
        driveId: createTarget.driveId,
        name,
      }),
    onSuccess: async (folder) => {
      setNewFolderName('');
      await invalidateBrowse();
      toast({
        title: t('organizationIntegrations.created'),
        description: t('organizationIntegrations.createdDescription', { name: folder.name }),
      });
    },
    onError: (error: Error & { code?: string }) => {
      toast(
        getGoogleWorkspaceDestinationSaveErrorToast(
          error,
          t('organizationIntegrations.createFailed'),
        ),
      );
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (input: { folderId: string; confirmDataLoss?: boolean }) =>
      deleteGoogleDriveDestinationFolder({
        organizationId,
        folderId: input.folderId,
        confirmDataLoss: input.confirmDataLoss,
      }),
    onSuccess: async (_result, variables) => {
      setDeleteConfirmOpen(false);
      setPendingDelete(null);
      setPendingDeleteChildCount(0);
      await invalidateBrowse();
      toast({
        title: t('organizationIntegrations.deleted'),
        description: variables.confirmDataLoss
          ? t('organizationIntegrations.deletedContents')
          : t('organizationIntegrations.deletedEmpty'),
      });
    },
    onError: (error: unknown) => {
      if (error instanceof GoogleDriveFolderDeleteConfirmationRequiredError) {
        setPendingDeleteChildCount(error.childCount);
        setDeleteConfirmOpen(true);
        return;
      }

      toast(
        getGoogleWorkspaceDestinationSaveErrorToast(
          error as Error & { code?: string },
          t('organizationIntegrations.deleteFailed'),
        ),
      );
    },
  });

  const resetNavigation = useCallback(() => {
    setStack([{ parentId: null, driveId: null, label: 'All locations' }]);
    setNewFolderName('');
    setPendingDelete(null);
    setDeleteConfirmOpen(false);
    setPendingDeleteChildCount(0);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetNavigation();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetNavigation],
  );

  const breadcrumb = useMemo(
    () => stack.map((frame, index) => index === 0 ? t('organizationIntegrations.allLocations') : frame.label).join(' / '),
    [stack, t],
  );

  const handleNavigateInto = useCallback((item: GoogleDriveDestinationBrowseItem) => {
    setStack((prev) => [
      ...prev,
      {
        parentId: item.kind === 'shared_drive' ? 'root' : item.id,
        driveId: item.kind === 'shared_drive' ? item.id : item.driveId,
        label: item.name,
      },
    ]);
  }, []);

  const handleSelectFolder = useCallback(
    async (item: GoogleDriveDestinationBrowseItem) => {
      const selectionKind: GoogleExportSelectionKind =
        item.kind === 'shared_drive' ? 'shared_drive' : 'folder';
      try {
        await onSelect({
          selectionKind,
          parentId: item.id,
          displayName: item.name,
        });
        handleOpenChange(false);
      } catch (error) {
        toast(
          getGoogleWorkspaceDestinationSaveErrorToast(
            error as Error & { code?: string },
            t('organizationIntegrations.selectedFolderFailed'),
          ),
        );
      }
    },
    [handleOpenChange, onSelect, toast, t],
  );

  const handleBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const handleCreateFolder = useCallback(() => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) {
      return;
    }
    createFolderMutation.mutate(trimmedName);
  }, [createFolderMutation, newFolderName]);

  const handleDeleteFolder = useCallback(
    (item: GoogleDriveDestinationBrowseItem) => {
      if (item.kind !== 'folder') {
        return;
      }

      if (protectedFolderId && item.id === protectedFolderId) {
        toast({
          title: t('organizationIntegrations.cannotDeleteOrg'),
          description:
            t('organizationIntegrations.cannotDeleteOrgDescription'),
          variant: 'error',
        });
        return;
      }

      setPendingDelete(item);
      deleteFolderMutation.mutate({ folderId: item.id, confirmDataLoss: false });
    },
    [deleteFolderMutation, protectedFolderId, toast, t],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDelete) {
      return;
    }

    deleteFolderMutation.mutate({
      folderId: pendingDelete.id,
      confirmDataLoss: true,
    });
  }, [deleteFolderMutation, pendingDelete]);

  const displayCreateLocation = currentFrame.parentId === null
    ? t('organizationIntegrations.myDriveRoot')
    : currentFrame.parentId === 'root' && currentFrame.driveId
      ? t('organizationIntegrations.driveRoot', { name: currentFrame.label })
      : createTarget.locationLabel;
  const items = browseQuery.data?.items ?? [];
  const isBusy =
    isSaving ||
    browseQuery.isLoading ||
    createFolderMutation.isPending ||
    deleteFolderMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent size="md" className="max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('organizationIntegrations.chooseFolder')}</DialogTitle>
            <DialogDescription>
              {t('organizationIntegrations.pickerDescription', {
                name: organizationName,
                domain: workspaceDomain ? t('organizationIntegrations.pickerDomain', {
                  domain: workspaceDomain, authorized: connectedEmail ? t('organizationIntegrations.authorizedEmail', { email: connectedEmail }) : '',
                }) : '',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 min-h-0 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground truncate">{breadcrumb}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={stack.length <= 1 || isBusy}
              >
                {t('organizationIntegrations.back')}
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  placeholder={t('organizationIntegrations.newFolder')}
                  disabled={isBusy}
                  aria-label={t('organizationIntegrations.newFolder')}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleCreateFolder();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className={integrationActionButtonClassName}
                  disabled={isBusy || newFolderName.trim().length === 0}
                  onClick={handleCreateFolder}
                >
                  {createFolderMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {t('organizationIntegrations.createFolder')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('organizationIntegrations.createLocation', { location: displayCreateLocation })}
              </p>
            </div>

            {browseQuery.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('organizationIntegrations.loadingFolders')}
              </div>
            )}

            {browseQuery.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {browseQuery.error instanceof Error
                    ? browseQuery.error.message
                    : t('organizationIntegrations.loadingFoldersFailed')}
                </AlertDescription>
              </Alert>
            )}

            {!browseQuery.isLoading && !browseQuery.error && (
              <div className="overflow-y-auto rounded-md border divide-y min-h-0">
                {items.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    {t('organizationIntegrations.noFolders', { location: displayCreateLocation })}
                  </p>
                ) : (
                  items.map((item) => (
                    <GoogleDriveDestinationPickerRow
                      key={item.id}
                      item={item}
                      isProtected={protectedFolderId === item.id}
                      isBusy={isBusy}
                      isDeleting={
                        deleteFolderMutation.isPending && pendingDelete?.id === item.id
                      }
                      onDelete={handleDeleteFolder}
                      onSelect={(selected) => void handleSelectFolder(selected)}
                      onOpen={handleNavigateInto}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving || deleteFolderMutation.isPending}
            >
              {t('organizationIntegrations.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GoogleDriveFolderDeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(nextOpen) => {
          setDeleteConfirmOpen(nextOpen);
          if (!nextOpen) {
            setPendingDelete(null);
            setPendingDeleteChildCount(0);
          }
        }}
        folderName={pendingDelete?.name ?? t('organizationIntegrations.folder')}
        childCount={pendingDeleteChildCount}
        isDeleting={deleteFolderMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
