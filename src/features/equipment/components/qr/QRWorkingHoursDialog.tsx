import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { QRDialogFormError } from '@/features/equipment/components/qr/QRDialogFormError';
import { useVoiceTextAppender } from '@/hooks/useVoiceTextAppender';
import VoiceInputButton from '@/components/common/VoiceInputButton';
import VoiceInterimTranscript from '@/components/common/VoiceInterimTranscript';
import {
  canRunQRAction,
  type QRActionEquipment,
  type QRActionPermissionContext,
} from '@/features/equipment/services/equipmentQRPermissions';
import { updateQRWorkingHours } from '@/features/equipment/services/equipmentQRActionService';
import { logger } from '@/utils/logger';
import { useI18n } from '@/i18n';

interface QRWorkingHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: QRActionEquipment;
  permissionContext: QRActionPermissionContext | null;
  scanId?: string | null;
  onSuccess: (newHours: number) => void;
}

const QRWorkingHoursDialog: React.FC<QRWorkingHoursDialogProps> = ({
  open,
  onOpenChange,
  equipment,
  permissionContext,
  scanId,
  onSuccess,
}) => {
  const { t } = useI18n();
  const [newHours, setNewHours] = useState(
    equipment.workingHours == null ? '' : String(equipment.workingHours)
  );
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isListening,
    error: speechError,
    interimTranscript,
    toggleListening,
    canUseVoice,
  } = useVoiceTextAppender({
    value: reason,
    onChange: setReason,
    disabled: isSubmitting,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsedHours = Number(newHours);
    if (!Number.isFinite(parsedHours) || parsedHours < 0) {
      setError(t('equipmentQRScan.invalidHours'));
      return;
    }

    if (
      !permissionContext ||
      !canRunQRAction('update-hours', permissionContext, equipment.teamId)
    ) {
      setError(t('equipmentQRScan.permissionChanged'));
      return;
    }

    setIsSubmitting(true);
    try {
      await updateQRWorkingHours({
        organizationId: equipment.organizationId,
        equipmentId: equipment.id,
        newHours: parsedHours,
        notes: reason.trim() || undefined,
        scanId,
      });

      onSuccess(parsedHours);
      onOpenChange(false);
    } catch (submitError) {
      logger.error('Failed to update QR working hours', submitError);
      setError(t('equipmentQRScan.updateHoursFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('equipmentQRScan.updateHours')}</DialogTitle>
          <DialogDescription>
            {t('equipmentQRScan.updateHoursDescription', { name: equipment.name })}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <QRDialogFormError error={error} />

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            {t('equipmentQRScan.currentHours')}{' '}
            <span className="font-semibold">
              {equipment.workingHours == null
                ? t('equipmentQRScan.notRecorded')
                : t('equipmentQRScan.hoursValue', { count: equipment.workingHours })}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qr-new-hours">{t('equipmentQRScan.newTotalHours')}</Label>
            <Input
              id="qr-new-hours"
              type="number"
              min="0"
              step="0.1"
              value={newHours}
              onChange={event => setNewHours(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qr-hours-reason">{t('equipmentQRScan.reasonOptional')}</Label>
            <div className="relative">
              <Textarea
                id="qr-hours-reason"
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder={t('equipmentQRScan.reasonPlaceholder')}
                rows={3}
                disabled={isSubmitting}
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

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
              {t('equipmentQRScan.updateHours')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QRWorkingHoursDialog;
