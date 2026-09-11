import React, { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Camera, Clock, Loader2, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type {
  QRActionEquipment,
  QRActionPermissionContext,
  QRActionType,
} from '@/features/equipment/services/equipmentQRPermissions';
import type { Role } from '@/types/permissions';
import {
  canRunQRAction,
  fetchQRActionTeamMemberships,
} from '@/features/equipment/services/equipmentQRPermissions';
import { getAuthClaims } from '@/lib/authClaims';
import { logger } from '@/utils/logger';
import { useI18n } from '@/i18n';

const QRWorkOrderDialog = lazy(() => import('@/features/equipment/components/qr/QRWorkOrderDialog'));
const QRUpdateHoursDialog = lazy(() => import('@/features/equipment/components/qr/QRWorkingHoursDialog'));
const QRNoteImageDialog = lazy(() => import('@/features/equipment/components/qr/QRNoteImageDialog'));

interface EquipmentQRQuickActionsProps {
  equipment: QRActionEquipment;
  userRole: Role;
  userDisplayName: string;
  /** Scan that this action set originated from; used to attribute follow-up events. */
  scanId?: string | null;
  onWorkingHoursUpdated?: (newHours: number) => void;
}

type DialogState =
  | { type: 'work-order' }
  | { type: 'hours' }
  | { type: 'note' }
  | null;

type SuccessMessage =
  | { message: string; workOrderId?: string }
  | null;

const ACTION_DENIED_KEYS: Record<QRActionType, string> = {
  'pm-work-order': 'equipmentQRScan.deniedWorkOrder',
  'generic-work-order': 'equipmentQRScan.deniedWorkOrder',
  'update-hours': 'equipmentQRScan.deniedHours',
  'note-image': 'equipmentQRScan.deniedNote',
};

export default function EquipmentQRQuickActions({
  equipment,
  userRole,
  userDisplayName,
  scanId,
  onWorkingHoursUpdated,
}: EquipmentQRQuickActionsProps) {
  const { t } = useI18n();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [activePermissionContext, setActivePermissionContext] = useState<QRActionPermissionContext | null>(null);
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<SuccessMessage>(null);
  const [checkingAction, setCheckingAction] = useState<QRActionType | null>(null);

  const openAction = async (action: QRActionType, nextDialog: DialogState) => {
    setCheckingAction(action);
    setPermissionMessage(null);
    setSuccessMessage(null);

    try {
      const claims = await getAuthClaims();
      if (!claims?.sub) {
        setPermissionMessage(t('equipmentQRScan.userNotAuthenticated'));
        return;
      }
      const permissionContext: QRActionPermissionContext = {
        userId: claims.sub,
        organizationId: equipment.organizationId,
        userRole,
        teamMemberships: [],
      };
      const teamMemberships = await fetchQRActionTeamMemberships(
        equipment.organizationId,
        userRole,
        equipment.teamId
      );
      const nextPermissionContext = { ...permissionContext, teamMemberships };

      if (!canRunQRAction(action, nextPermissionContext, equipment.teamId)) {
        setPermissionMessage(t(ACTION_DENIED_KEYS[action]));
        return;
      }

      setActivePermissionContext(nextPermissionContext);
      setDialog(nextDialog);
    } catch (error) {
      logger.error('QR quick action permission check failed', error);
      setPermissionMessage(t('equipmentQRScan.permissionCheckFailed'));
    } finally {
      setCheckingAction(null);
    }
  };

  const renderSpinner = (action: QRActionType) =>
    checkingAction === action ? <Loader2 className="h-4 w-4 animate-spin" /> : null;

  return (
    <section className="space-y-3" aria-labelledby="qr-quick-actions-heading">
      <div>
        <h2 id="qr-quick-actions-heading" className="text-base font-semibold">
          {t('equipmentQRScan.quickActions')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('equipmentQRScan.quickActionsDescription')}
        </p>
      </div>

      {permissionMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{permissionMessage}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>{successMessage.message}</span>
            {successMessage.workOrderId && (
              <Button asChild variant="outline" size="sm" className="w-fit">
                <Link
                  to={`/dashboard/work-orders/${successMessage.workOrderId}`}
                  reloadDocument
                >
                  {t('equipmentQRScan.openWorkOrder')}
                </Link>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          className="min-h-[44px] justify-start gap-2"
          onClick={() => openAction('generic-work-order', { type: 'work-order' })}
          disabled={checkingAction !== null}
        >
          {renderSpinner('generic-work-order') ?? <Plus className="h-4 w-4" />}
          {t('equipmentQRScan.newWorkOrder')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] justify-start gap-2"
          onClick={() => openAction('update-hours', { type: 'hours' })}
          disabled={checkingAction !== null}
        >
          {renderSpinner('update-hours') ?? <Clock className="h-4 w-4" />}
          {t('equipmentQRScan.updateHours')}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-[44px] justify-start gap-2"
          onClick={() => openAction('note-image', { type: 'note' })}
          disabled={checkingAction !== null}
        >
          {renderSpinner('note-image') ?? <Camera className="h-4 w-4" />}
          {t('equipmentQRScan.addNoteImage')}
        </Button>
      </div>

      {dialog && (
        <Suspense fallback={null}>
          {dialog.type === 'work-order' && (
            <QRWorkOrderDialog
              open
              equipment={equipment}
              permissionContext={activePermissionContext}
              scanId={scanId}
              onOpenChange={(open) => {
                if (!open) {
                  setDialog(null);
                  setActivePermissionContext(null);
                }
              }}
              onCreated={(workOrder) => {
                setDialog(null);
                setActivePermissionContext(null);
                setSuccessMessage({
                  message: t('equipmentQRScan.workOrderCreated', { title: workOrder.title }),
                  workOrderId: workOrder.id,
                });
              }}
            />
          )}
          {dialog.type === 'hours' && (
            <QRUpdateHoursDialog
              open
              equipment={equipment}
              permissionContext={activePermissionContext}
              scanId={scanId}
              onOpenChange={(open) => {
                if (!open) {
                  setDialog(null);
                  setActivePermissionContext(null);
                }
              }}
              onSuccess={(newHours) => {
                setDialog(null);
                setActivePermissionContext(null);
                setSuccessMessage({
                  message: t('equipmentQRScan.hoursUpdated', { count: newHours }),
                });
                onWorkingHoursUpdated?.(newHours);
              }}
            />
          )}
          {dialog.type === 'note' && (
            <QRNoteImageDialog
              open
              onClose={() => {
                setDialog(null);
                setActivePermissionContext(null);
              }}
              equipmentId={equipment.id}
              equipmentName={equipment.name}
              organizationId={equipment.organizationId}
              equipmentTeamId={equipment.teamId}
              permissionContext={activePermissionContext}
              scanId={scanId}
              userDisplayName={userDisplayName}
              onSuccess={(message) => {
                setDialog(null);
                setActivePermissionContext(null);
                setSuccessMessage({ message });
              }}
            />
          )}
        </Suspense>
      )}
    </section>
  );
}
