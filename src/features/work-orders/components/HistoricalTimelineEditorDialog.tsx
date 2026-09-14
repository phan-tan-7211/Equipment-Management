import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from '@/components/ui/button';
import { HistoricalTimelineEditor } from '@/features/work-orders/components/HistoricalTimelineEditor';
import {
  useConvertWorkOrderToHistorical,
  useReplaceHistoricalWorkOrderTimeline,
} from '@/features/work-orders/hooks/useHistoricalWorkOrders';
import { useWorkOrderPermissionLevels } from '@/features/work-orders/hooks/useWorkOrderPermissionLevels';
import {
  areTimelineEventsEqual,
  historyRowsToEditorEvents,
  validateTimelineEvents,
  type HistoricalTimelineEvent,
} from '@/features/work-orders/utils/historicalTimeline';
import type { WorkOrderTimelineHistoryRow } from '@/features/work-orders/services/historicalTimelineService';
import { useI18n } from '@/i18n';

type HistoricalTimelineEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
  organizationId: string;
  equipmentId: string;
  title?: string;
  historyRows?: WorkOrderTimelineHistoryRow[];
  initialEvents?: HistoricalTimelineEvent[];
  mode?: 'edit' | 'create' | 'convert';
  onCreateSave?: (events: HistoricalTimelineEvent[]) => void;
  historyReady?: boolean;
  historicalStartDate?: string | null;
};

export function HistoricalTimelineEditorDialog({
  open,
  onOpenChange,
  workOrderId,
  organizationId,
  equipmentId,
  title,
  historyRows,
  initialEvents,
  mode = 'edit',
  onCreateSave,
  historyReady = true,
  historicalStartDate,
}: HistoricalTimelineEditorDialogProps) {
  const { t } = useI18n();
  const replaceTimelineMutation = useReplaceHistoricalWorkOrderTimeline();
  const convertTimelineMutation = useConvertWorkOrderToHistorical();
  const { isManager } = useWorkOrderPermissionLevels();
  const [draftEvents, setDraftEvents] = useState<HistoricalTimelineEvent[]>([]);
  const [editorSeedEvents, setEditorSeedEvents] = useState<HistoricalTimelineEvent[]>([]);
  const [hasIncompleteRows, setHasIncompleteRows] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [editorSeeded, setEditorSeeded] = useState(false);

  const seedEvents = useMemo(() => {
    if (initialEvents && initialEvents.length > 0) {
      return initialEvents;
    }
    if (historyRows && historyRows.length > 0) {
      return historyRowsToEditorEvents(historyRows, historicalStartDate);
    }
    return [];
  }, [historyRows, historicalStartDate, initialEvents]);

  useEffect(() => {
    if (!open) {
      setEditorSeeded(false);
      setConfirmDiscardOpen(false);
      return;
    }

    if (mode === 'edit' && !historyReady) {
      return;
    }

    if (!editorSeeded) {
      setEditorSeedEvents(seedEvents);
      setDraftEvents(seedEvents);
      setHasIncompleteRows(false);
      setEditorSeeded(true);
    }
  }, [open, seedEvents, mode, historyReady, editorSeeded]);

  const validationErrors = validateTimelineEvents(draftEvents);
  const isInitializing = open && mode === 'edit' && !editorSeeded;
  const isInvalid = editorSeeded && (hasIncompleteRows || validationErrors.length > 0);
  const isDirty = useMemo(
    () => !areTimelineEventsEqual(draftEvents, editorSeedEvents),
    [draftEvents, editorSeedEvents],
  );
  const canSave = validationErrors.length === 0 && draftEvents.length > 0 && !hasIncompleteRows;
  const isSaving = replaceTimelineMutation.isPending || convertTimelineMutation.isPending;
  const saveLabel = t('workOrderResidual.timelineSave');

  const performClose = () => {
    onOpenChange(false);
  };

  const handleRequestClose = () => {
    if (isInitializing) {
      performClose();
      return;
    }

    if (isInvalid) {
      return;
    }

    if (isDirty) {
      setConfirmDiscardOpen(true);
      return;
    }

    performClose();
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    handleRequestClose();
  };

  const handleConfirmDiscard = () => {
    setConfirmDiscardOpen(false);
    performClose();
  };

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    if (mode === 'create') {
      onCreateSave?.(draftEvents);
      onOpenChange(false);
      return;
    }

    if (!isManager) {
      return;
    }

    if (mode === 'convert') {
      try {
        await convertTimelineMutation.mutateAsync({
          workOrderId,
          events: draftEvents,
        });
        onOpenChange(false);
      } catch {
        // onError toast handled by mutation hook
      }
      return;
    }

    try {
      await replaceTimelineMutation.mutateAsync({
        workOrderId,
        events: draftEvents,
      });
      onOpenChange(false);
    } catch {
      // onError toast handled by mutation hook
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          className="flex max-h-[calc(100dvh-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
          onInteractOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            handleRequestClose();
          }}
        >
          <DialogHeader className="space-y-1 border-b px-6 py-4">
            <DialogTitle>{title || t('workOrderResidual.timelineTitle')}</DialogTitle>
            <DialogDescription className="text-xs leading-snug">
              {mode === 'convert' ? t('workOrderResidual.timelineConvertHelp') : t('workOrderResidual.timelineHelp')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isInitializing ? (
              <p className="text-sm text-muted-foreground">{t('workOrderResidual.timelineLoading')}</p>
            ) : (
              <HistoricalTimelineEditor
                initialEvents={editorSeedEvents}
                organizationId={organizationId}
                equipmentId={equipmentId}
                onChange={setDraftEvents}
                onIncompleteRowsChange={setHasIncompleteRows}
              />
            )}
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleRequestClose}
              disabled={isInvalid}
            >
              {t('workOrderResidual.cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canSave || isSaving}
            >
              {isSaving ? t('workOrderResidual.saving') : saveLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workOrderResidual.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('workOrderResidual.discardHelp')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('workOrderResidual.keepEditing')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>{t('workOrderResidual.discard')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
