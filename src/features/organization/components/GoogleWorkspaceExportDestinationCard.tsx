import { useCallback, useState } from 'react';
import { toast as sonnerToast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FolderOpen, Loader2, Copy, Check } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAppToast } from '@/hooks/useAppToast';
import { useI18n } from '@/i18n';
import { useGoogleWorkspaceConnectionStatus } from '@/features/organization/hooks/useGoogleWorkspaceConnectionStatus';
import { useGoogleWorkspaceExportDestination } from '@/features/organization/hooks/useGoogleWorkspaceExportDestination';
import {
  GOOGLE_EXPORT_DESTINATION_REQUIRED_SCOPES,
  hasAllGoogleScopes,
} from '@/services/google-workspace/auth';
import { ORGANIZATION_INTEGRATIONS_PATH } from '@/features/organization/constants/routes';
import { useGoogleWorkspaceConnect } from '@/features/organization/hooks/useGoogleWorkspaceConnect';
import { GoogleDriveDestinationPickerDialog } from './GoogleDriveDestinationPickerDialog';
import { getGoogleWorkspaceDestinationSaveErrorToast } from '@/features/organization/utils/googleWorkspaceDestinationSaveError';
import {
  IntegrationCardHeader,
  IntegrationCardLayout,
  integrationActionButtonClassName,
} from '@/features/organization/components/IntegrationCardLayout';
import { GoogleWorkspaceMarkIcon } from '@/components/icons/GoogleWorkspaceMarkIcon';
import { GoogleDriveExportFolderOrganizationSection } from '@/features/organization/components/GoogleDriveExportFolderOrganizationSection';

interface GoogleWorkspaceExportDestinationCardProps {
  currentUserRole: 'owner' | 'admin' | 'member';
}

export function GoogleWorkspaceExportDestinationCard({
  currentUserRole,
}: GoogleWorkspaceExportDestinationCardProps) {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const { toast } = useAppToast();
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';
  const [copiedId, setCopiedId] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showAdvancedId, setShowAdvancedId] = useState(false);

  const {
    isConnected: isGoogleWorkspaceConnected,
    domain: workspaceDomain,
    connectionStatus,
  } = useGoogleWorkspaceConnectionStatus({
    organizationId: currentOrganization?.id,
    enabled: canManage,
  });

  const needsGrantForDestination =
    isGoogleWorkspaceConnected &&
    !hasAllGoogleScopes(
      connectionStatus?.scopes,
      GOOGLE_EXPORT_DESTINATION_REQUIRED_SCOPES
    );

  const { connect: grantDrivePermissions, isConnecting: isGrantingPermissions } =
    useGoogleWorkspaceConnect({
      organizationId: currentOrganization?.id,
      redirectUrl: ORGANIZATION_INTEGRATIONS_PATH,
      consentMode: 'export',
    });

  const {
    destination,
    isLoadingDestination,
    setDestination,
    isSettingDestination,
  } = useGoogleWorkspaceExportDestination(currentOrganization?.id);

  const handleCopyParentId = useCallback(async () => {
    if (!destination?.parent_id) return;
    await navigator.clipboard.writeText(destination.parent_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }, [destination?.parent_id]);

  const handleSaveSelection = useCallback(
    async (selection: {
      selectionKind: 'folder' | 'shared_drive';
      parentId: string;
      displayName: string;
    }) => {
      await setDestination({
        selectionKind: selection.selectionKind,
        parentId: selection.parentId,
      });
      toast({
        title: t('organizationIntegrations.folderSaved'),
        description: t('organizationIntegrations.folderSavedDescription', { name: currentOrganization?.name ?? t('organizationIntegrations.thisOrganization'), folder: selection.displayName }),
      });
    },
    [currentOrganization?.name, setDestination, toast, t],
  );

  const [isSavingFlags, setIsSavingFlags] = useState(false);

  const handleToggleFolderFlag = useCallback(
    async (flag: 'folderByTeam' | 'folderByEquipment', checked: boolean) => {
      if (!destination) return;
      setIsSavingFlags(true);

      const settingKey = flag === 'folderByTeam'
        ? (checked ? 'organizationIntegrations.organizeByTeamEnabled' : 'organizationIntegrations.organizeByTeamDisabled')
        : (checked ? 'organizationIntegrations.organizeByEquipmentEnabled' : 'organizationIntegrations.organizeByEquipmentDisabled');

      try {
        await sonnerToast.promise(
          setDestination({
            selectionKind: destination.selection_kind,
            parentId: destination.parent_id,
            [flag]: checked,
          }),
          {
            loading: t('organizationIntegrations.folderSettingsSaving'),
            success: t(settingKey),
            error: (err: Error & { code?: string }) => {
              const errToast = getGoogleWorkspaceDestinationSaveErrorToast(
                err,
                t('organizationIntegrations.folderSaveFailed'),
              );
              return errToast.description;
            },
          },
        );
      } finally {
        setIsSavingFlags(false);
      }
    },
    [destination, setDestination, t],
  );

  if (!canManage) {
    return null;
  }

  const kindLabel = destination?.selection_kind === 'shared_drive' ? t('organizationIntegrations.sharedFolder') : t('organizationIntegrations.myFolder');
  const organizationName = currentOrganization?.name ?? t('organizationIntegrations.organization');

  return (
    <>
      <IntegrationCardLayout>
        <IntegrationCardHeader
          title={t('organizationIntegrations.fileStorage')}
          icon={<GoogleWorkspaceMarkIcon />}
          description={
            <>
              <p>
                {t('organizationIntegrations.organizationFolder', { name: organizationName })}
                {workspaceDomain ? t('organizationIntegrations.onDomain', { domain: workspaceDomain }) : ''}
              </p>
              {connectionStatus?.connected_email ? (
                <p>{t('organizationIntegrations.authorizedBy', { email: connectionStatus.connected_email })}</p>
              ) : null}
            </>
          }
          badge={
            destination ? (
              <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                {t('organizationIntegrations.configured')}
              </Badge>
            ) : undefined
          }
          actions={
            <Button
              variant="outline"
              size="sm"
              className={integrationActionButtonClassName}
              onClick={() => setPickerOpen(true)}
              disabled={!isGoogleWorkspaceConnected || isSettingDestination || needsGrantForDestination}
            >
              {isSettingDestination ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
              )}
              {t(destination ? 'organizationIntegrations.changeFolder' : 'organizationIntegrations.chooseFolder')}
            </Button>
          }
        />

        {isLoadingDestination && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t('organizationIntegrations.loadingFolder')}
          </div>
        )}

        {destination && (
          <div className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-3 sm:border-0 sm:bg-transparent sm:p-0">
            <div className="flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-1.5">
              <div className="flex min-w-0 items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0">{kindLabel}</span>
              </div>
              <div className="flex min-w-0 items-center gap-1.5 pl-5 sm:pl-0">
                <span className="text-muted-foreground shrink-0">/</span>
                <span className="font-medium truncate">{destination.display_name}</span>
              </div>
            </div>

            <div className="text-xs">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                onClick={() => setShowAdvancedId((prev) => !prev)}
              >
                {t(showAdvancedId ? 'organizationIntegrations.hideAdvanced' : 'organizationIntegrations.showFolderId')}
              </button>
              {showAdvancedId && (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="text-xs font-mono text-muted-foreground break-all sm:truncate sm:max-w-[240px]">
                    {destination.parent_id}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyParentId}
                    className="self-start text-muted-foreground hover:text-foreground transition-colors sm:self-auto"
                    aria-label={t('organizationIntegrations.copyFolderId')}
                  >
                    {copiedId ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <GoogleDriveExportFolderOrganizationSection
              rootFolderName={destination.display_name}
              folderByTeam={destination.folder_by_team}
              folderByEquipment={destination.folder_by_equipment}
              disabled={isSettingDestination || isSavingFlags}
              onToggleTeam={(checked) => handleToggleFolderFlag('folderByTeam', checked)}
              onToggleEquipment={(checked) => handleToggleFolderFlag('folderByEquipment', checked)}
            />
          </div>
        )}

        {!destination && !isLoadingDestination && (
          <p className="text-xs text-muted-foreground">
            {t('organizationIntegrations.chooseFolderDescription')}
          </p>
        )}

        {needsGrantForDestination && (
          <Alert>
            <AlertDescription className="text-sm space-y-3">
              <p>
                {t('organizationIntegrations.grantDriveDescription')}
              </p>
              <Button
                size="sm"
                variant="outline"
                className={integrationActionButtonClassName}
                onClick={grantDrivePermissions}
                disabled={isGrantingPermissions}
              >
                {isGrantingPermissions ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : null}
                {t('organizationIntegrations.grantDrive')}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!isGoogleWorkspaceConnected && !isLoadingDestination && (
          <p className="text-xs text-muted-foreground">
            {t('organizationIntegrations.connectFirst')}
          </p>
        )}
      </IntegrationCardLayout>

      {currentOrganization?.id && (
        <GoogleDriveDestinationPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          organizationId={currentOrganization.id}
          organizationName={organizationName}
          workspaceDomain={workspaceDomain}
          connectedEmail={connectionStatus?.connected_email ?? null}
          protectedFolderId={destination?.parent_id ?? null}
          onSelect={handleSaveSelection}
          isSaving={isSettingDestination}
        />
      )}
    </>
  );
}
