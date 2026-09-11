import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { WorkOrder, WorkOrderPriority } from '@/features/work-orders/types/workOrder';
import { useVoiceTextAppender } from '@/hooks/useVoiceTextAppender';
import VoiceInputButton from '@/components/common/VoiceInputButton';
import VoiceInterimTranscript from '@/components/common/VoiceInterimTranscript';
import {
  canRunQRAction,
  type QRActionEquipment,
  type QRActionPermissionContext,
} from '@/features/equipment/services/equipmentQRPermissions';
import { createQRWorkOrder } from '@/features/equipment/services/equipmentQRActionService';
import { logger } from '@/utils/logger';
import { workOrders, workOrderMetrics } from '@/lib/queryKeys';
import WorkOrderCreationPhotoPicker from '@/features/work-orders/components/WorkOrderCreationPhotoPicker';
import { toast } from 'sonner';
import { WorkOrderPMChecklist } from '@/features/work-orders/components/WorkOrderPMChecklist';
import type { WorkOrderPMChecklistSetValue } from '@/features/work-orders/hooks/useWorkOrderPMChecklist';
import { QRDialogFormError } from '@/features/equipment/components/qr/QRDialogFormError';
import { useI18n } from '@/i18n';

interface QRWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: QRActionEquipment;
  permissionContext: QRActionPermissionContext | null;
  scanId?: string | null;
  onCreated: (workOrder: WorkOrder) => void;
}

const priorityOptions: WorkOrderPriority[] = ['low', 'medium', 'high'];

const PRIORITY_LABEL_KEYS: Record<WorkOrderPriority, string> = {
  low: 'equipmentQRScan.priorityLow',
  medium: 'equipmentQRScan.priorityMedium',
  high: 'equipmentQRScan.priorityHigh',
};

function getDefaultPmTemplateId(equipment: QRActionEquipment): string | null {
  return equipment.defaultPmTemplateId ?? null;
}

const QRWorkOrderDialog: React.FC<QRWorkOrderDialogProps> = ({
  open,
  onOpenChange,
  equipment,
  permissionContext,
  scanId,
  onCreated,
}) => {
  const { t } = useI18n();
  const [title, setTitle] = useState(() => t('equipmentQRScan.workOrderDefaultTitle', { name: equipment.name }));
  const [description, setDescription] = useState(() =>
    t('equipmentQRScan.workOrderDefaultDescription', { name: equipment.name }),
  );
  const [priority, setPriority] = useState<WorkOrderPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [hasPM, setHasPM] = useState(Boolean(getDefaultPmTemplateId(equipment)));
  const [pmTemplateId, setPmTemplateId] = useState<string | null>(getDefaultPmTemplateId(equipment));
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) {
      setImages([]);
      return;
    }

    const defaultTemplateId = getDefaultPmTemplateId(equipment);
    setTitle(t('equipmentQRScan.workOrderDefaultTitle', { name: equipment.name }));
    setDescription(t('equipmentQRScan.workOrderDefaultDescription', { name: equipment.name }));
    setPmTemplateId(defaultTemplateId);
    setHasPM(Boolean(defaultTemplateId));
  }, [open, equipment.id, equipment.name, equipment.defaultPmTemplateId, t]);

  const selectedEquipment = useMemo(
    () => ({
      id: equipment.id,
      name: equipment.name,
      default_pm_template_id: equipment.defaultPmTemplateId ?? null,
    }),
    [equipment.defaultPmTemplateId, equipment.id, equipment.name],
  );

  const pmValues = useMemo(
    () => ({ hasPM, pmTemplateId }),
    [hasPM, pmTemplateId],
  );

  const setPmValue = useCallback<WorkOrderPMChecklistSetValue>(
    (field, value) => {
      if (field === 'hasPM') {
        setHasPM(Boolean(value));
        return;
      }
      setPmTemplateId(typeof value === 'string' ? value : null);
    },
    [],
  );

  const {
    isListening,
    error: speechError,
    interimTranscript,
    toggleListening,
    canUseVoice,
  } = useVoiceTextAppender({
    value: description,
    onChange: setDescription,
    disabled: isSubmitting,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim()) {
      setError(t('equipmentQRScan.titleDescriptionRequired'));
      return;
    }

    if (
      !permissionContext ||
      !canRunQRAction('generic-work-order', permissionContext, equipment.teamId)
    ) {
      setError(t('equipmentQRScan.permissionChanged'));
      return;
    }

    if (images.length > 0 && typeof navigator !== 'undefined' && !navigator.onLine) {
      setError(t('equipmentQRScan.createWorkOrderFailed'));
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedTemplateId = pmTemplateId ?? undefined;
      const { workOrder, creationPhotosAttached } = await createQRWorkOrder({
        equipment,
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || undefined,
        attachPM: hasPM && Boolean(selectedTemplateId),
        pmTemplateId: selectedTemplateId,
        images: images.length ? images : undefined,
        creationPhotoNote: images.length
          ? `Photos from QR work order request: ${title.trim()}`
          : undefined,
        scanId,
      });
      if (images.length > 0) {
        queryClient.invalidateQueries({ queryKey: workOrders.images(workOrder.id) });
        queryClient.invalidateQueries({
          queryKey: workOrders.notesWithImages(workOrder.id),
        });
        queryClient.invalidateQueries({
          queryKey: workOrderMetrics.imageCount(workOrder.id),
        });
        if (!creationPhotosAttached) {
          toast.warning(t('equipmentQRScan.photosAttachFailed'));
        }
      }
      setImages([]);
      onCreated(workOrder);
      onOpenChange(false);
    } catch (submitError) {
      logger.error('QR work order creation failed', submitError);
      setError(t('equipmentQRScan.createWorkOrderFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('equipmentQRScan.newWorkOrder')}</DialogTitle>
          <DialogDescription>
            {t('equipmentQRScan.workOrderDescription', { name: equipment.name })}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <QRDialogFormError error={error} />

          <div className="space-y-2">
            <Label htmlFor="qr-work-order-title">{t('equipmentQRScan.title')}</Label>
            <Input
              id="qr-work-order-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <WorkOrderPMChecklist
            key={`qr-pm-${open}-${equipment.id}`}
            values={pmValues}
            setValue={setPmValue}
            selectedEquipment={selectedEquipment}
            autoDefaultFromEquipment
          />

          <div className="space-y-2">
            <Label htmlFor="qr-work-order-description">{t('equipmentQRScan.description')}</Label>
            <div className="relative">
              <Textarea
                id="qr-work-order-description"
                value={description}
                onChange={event => setDescription(event.target.value)}
                disabled={isSubmitting}
                rows={4}
                required
                className="pb-12"
              />
              <VoiceInterimTranscript
                isListening={isListening}
                interimTranscript={interimTranscript}
                className="bottom-12 left-2 right-2"
              />
              <VoiceInputButton
                isListening={isListening}
                onToggle={toggleListening}
                canUseVoice={canUseVoice}
                className="absolute bottom-2 left-2"
              />
            </div>
            {speechError && (
              <p className="text-sm text-destructive">{speechError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="qr-work-order-priority">{t('equipmentQRScan.priority')}</Label>
              <Select
                value={priority}
                onValueChange={value => setPriority(value as WorkOrderPriority)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="qr-work-order-priority">
                  <SelectValue placeholder={t('equipmentQRScan.selectPriority')} />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(option => (
                    <SelectItem key={option} value={option}>
                      {t(PRIORITY_LABEL_KEYS[option])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr-work-order-due-date">{t('equipmentQRScan.dueDateOptional')}</Label>
              <Input
                id="qr-work-order-due-date"
                type="date"
                value={dueDate}
                onChange={event => setDueDate(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <WorkOrderCreationPhotoPicker
            images={images}
            onImagesChange={setImages}
            disabled={isSubmitting}
          />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('equipmentQRScan.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('equipmentQRScan.createWorkOrder')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QRWorkOrderDialog;
