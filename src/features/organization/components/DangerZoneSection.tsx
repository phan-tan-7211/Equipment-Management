/**
 * DangerZoneSection - Red-bordered card with horizontal action rows
 * for dangerous organization operations (transfer, leave, delete).
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  UserMinus,
  Trash2,
  ArrowRightLeft,
  Info,
} from 'lucide-react';
import { TransferOwnershipDialog } from './TransferOwnershipDialog';
import { LeaveOrganizationDialog } from './LeaveOrganizationDialog';
import { DeleteOrganizationDialog } from './DeleteOrganizationDialog';
import { PendingTransferCard } from './PendingTransferCard';
import { usePendingTransferForUser } from '@/features/organization/hooks/useOwnershipTransfer';
import type { SimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { useI18n } from '@/i18n';

interface DangerZoneSectionProps {
  organization: SimpleOrganization;
  currentUserRole: 'owner' | 'admin' | 'member';
  admins: Array<{ id: string; userId: string; name: string; email: string }>;
}

export const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({
  organization,
  currentUserRole,
  admins,
}) => {
  const { t } = useI18n();
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isOwner = currentUserRole === 'owner';

  const { data: pendingTransfer, isLoading: transferLoading } = usePendingTransferForUser();

  const transferableAdmins = admins;

  return (
    <div className="space-y-4">
      {/* Pending Transfer Alert */}
      {!transferLoading && pendingTransfer && pendingTransfer.is_incoming && (
        <PendingTransferCard transfer={pendingTransfer} />
      )}

      {!transferLoading && pendingTransfer && !pendingTransfer.is_incoming && isOwner && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning dark:text-warning">
            {t('organizationAdmin.pendingTransfer', { name: pendingTransfer.to_user_name })}
          </AlertDescription>
        </Alert>
      )}

      {/* Danger Zone Card */}
      <div className="rounded-lg border border-destructive/50 overflow-hidden">
        {/* Header */}
        <div className="bg-destructive/5 border-b border-destructive/30 px-4 py-3">
          <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t('organizationAdmin.danger')}
          </h3>
        </div>

        <div className="divide-y divide-destructive/20">
          {/* Transfer Ownership — Owner Only */}
          {isOwner && (
            <div className="px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t('organizationAdmin.transfer')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('organizationAdmin.transferDescription')}
                </p>
              </div>
              <div className="shrink-0">
                {transferableAdmins.length === 0 ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    {t('organizationAdmin.promoteAdmin')}
                  </p>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowTransferDialog(true)}
                    disabled={!!pendingTransfer}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                    {t('organizationAdmin.transferButton')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Leave Organization — Non-owners */}
          {!isOwner && (
            <div className="px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t('organizationAdmin.leave')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('organizationAdmin.leaveDescription')}
                </p>
              </div>
              <div className="shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setShowLeaveDialog(true)}
                >
                  <UserMinus className="h-3.5 w-3.5 mr-1.5" />
                  {t('organizationAdmin.leaveButton')}
                </Button>
              </div>
            </div>
          )}

          {/* Delete Organization — Owner Only */}
          {isOwner && (
            <div className="px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium">{t('organizationAdmin.delete')}</p>
                <p className="text-sm text-destructive/80 mt-0.5">
                  {t('organizationAdmin.deleteDescription')}
                </p>
              </div>
              <div className="shrink-0">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  {t('organizationAdmin.deleteButton')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <TransferOwnershipDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        organization={organization}
        admins={transferableAdmins}
      />

      <LeaveOrganizationDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        organization={organization}
      />

      <DeleteOrganizationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        organization={organization}
      />
    </div>
  );
};
