import { useI18n } from '@/i18n';
import { localizeWorkOrderStatus } from '@/features/work-orders/utils/workOrderI18nLabels';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { workOrderRevertService } from '@/features/work-orders/services/workOrderRevertService';
import { logger } from '@/utils/logger';
import type { WorkOrderLike } from '@/features/work-orders/utils/workOrderTypeConversion';

interface WorkOrderDetailsStatusLockWarningProps {
  workOrder: Pick<WorkOrderLike, 'id' | 'status'>;
  isWorkOrderLocked: boolean;
  baseCanAddNotes: boolean;
  isAdmin?: boolean;
  onStatusUpdate?: (newStatus: WorkOrderLike['status']) => void;
}

export const WorkOrderDetailsStatusLockWarning: React.FC<WorkOrderDetailsStatusLockWarningProps> = ({
  workOrder,
  isWorkOrderLocked,
  baseCanAddNotes,
  isAdmin = false,
  onStatusUpdate
}) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [isReverting, setIsReverting] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);

  const handleReopenWorkOrder = async () => {
    setIsReverting(true);
    try {
      const result = await workOrderRevertService.revertWorkOrderStatus(
        workOrder.id,
        'Reverted to accepted status by admin'
      );
      
      if (result.success) {
        toast({
          title: t('workOrderActivity.workOrderReopened'),
          description: t('workOrderActivity.statusChanged', { from: localizeWorkOrderStatus(result.old_status, t), to: localizeWorkOrderStatus(result.new_status, t) }),
        });
        onStatusUpdate?.('accepted');
      } else {
        toast({
          title: t('workOrderActivity.reopenFailed'),
          description: result.error || t('workOrderActivity.reopenFailedMessage'),
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error('Failed to reopen work order', error);
      toast({
        title: t('workOrderActivity.error'),
        description: t('workOrderActivity.unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setIsReverting(false);
    }
  };

  if (!isWorkOrderLocked || !baseCanAddNotes) return null;

  const canRevert = isAdmin && (workOrder.status === 'completed' || workOrder.status === 'cancelled');

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/10 dark:bg-warning/10 dark:border-warning/50 py-2.5 px-3 space-y-2">
      <div className="flex items-start gap-2 text-warning dark:text-warning">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <p className="text-sm font-medium">
          {t('workOrderActivity.lockedHint', { status: localizeWorkOrderStatus(workOrder.status, t) })}
        </p>
      </div>
      {canRevert && (
        <div className="space-y-2">
          <p className="text-xs text-warning/90 dark:text-warning">
            {t('workOrderActivity.reopenHint')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReopenDialog(true)}
            disabled={isReverting}
            className="w-full border-warning/40 text-warning hover:bg-warning/20 dark:border-warning/50 dark:text-warning dark:hover:bg-warning/20"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            {isReverting ? t('workOrderActivity.reopening') : t('workOrderActivity.reopenWorkOrder')}
          </Button>
          <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('workOrderActivity.reopenQuestion')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('workOrderActivity.reopenDescription', { status: localizeWorkOrderStatus(workOrder.status, t) })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isReverting}>{t('workOrderActivity.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setShowReopenDialog(false);
                    void handleReopenWorkOrder();
                  }}
                  disabled={isReverting}
                >
                  {isReverting ? t('workOrderActivity.reopening') : t('workOrderActivity.yesReopen')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};


