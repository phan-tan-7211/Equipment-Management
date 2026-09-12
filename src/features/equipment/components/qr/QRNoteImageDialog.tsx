import React, { useCallback, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import InlineNoteComposer from '@/components/common/InlineNoteComposer';
import { createQREquipmentNote } from '@/features/equipment/services/equipmentQRActionService';
import { canRunQRAction, type QRActionPermissionContext } from '@/features/equipment/services/equipmentQRPermissions';
import { useI18n } from '@/i18n';

interface QRNoteImageDialogProps {
  open: boolean;
  onClose: () => void;
  equipmentId: string;
  equipmentName: string;
  organizationId: string;
  equipmentTeamId: string | null;
  permissionContext: QRActionPermissionContext | null;
  scanId?: string | null;
  userDisplayName: string;
  onSuccess: (message: string) => void;
}

const QRNoteImageDialog: React.FC<QRNoteImageDialogProps> = ({
  open,
  onClose,
  equipmentId,
  equipmentName,
  organizationId,
  equipmentTeamId,
  permissionContext,
  scanId,
  userDisplayName,
  onSuccess,
}) => {
  const { t } = useI18n();
  const [noteContent, setNoteContent] = useState('');
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = useCallback(() => {
    setNoteContent('');
    setAttachedImages([]);
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = async (data: {
    content: string;
    images: File[];
    machineHours?: number;
    isPrivate?: boolean;
  }) => {
    let finalContent = data.content.trim();
    if (!finalContent && data.images.length > 0) {
      // Persist a canonical audit note rather than language-specific UI text.
      finalContent =
        data.images.length === 1
          ? `${userDisplayName} uploaded 1 image.`
          : `${userDisplayName} uploaded ${data.images.length} images.`;
    }

    if (!finalContent) {
      setError(t('equipmentQRScan.noteRequired'));
      return;
    }

    if (
      !permissionContext ||
      !canRunQRAction('note-image', permissionContext, equipmentTeamId)
    ) {
      setError(t('equipmentQRScan.permissionChanged'));
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await createQREquipmentNote({
        equipmentId,
        organizationId,
        content: finalContent,
        images: data.images,
        isPrivate: data.isPrivate || false,
        machineHours: data.machineHours,
        scanId,
      });
      onSuccess(t('equipmentQRScan.noteAdded'));
      resetAndClose();
    } catch {
      setError(t('equipmentQRScan.addNoteFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isSubmitting ? undefined : (nextOpen) => { if (!nextOpen) resetAndClose(); }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('equipmentQRScan.addNoteImage')}</DialogTitle>
          <DialogDescription>
            {t('equipmentQRScan.noteDescription', { name: equipmentName })}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent standalone>
            <InlineNoteComposer
              value={noteContent}
              onChange={setNoteContent}
              onSubmit={handleSubmit}
              attachedImages={attachedImages}
              onImagesAdd={(files) => setAttachedImages(prev => [...prev, ...files])}
              onImageRemove={(index) => setAttachedImages(prev => prev.filter((_, i) => i !== index))}
              showPrivateToggle
              showMachineHours
              disabled={isSubmitting}
              isSubmitting={isSubmitting}
              placeholder={t('equipmentQRScan.notePlaceholder')}
              userDisplayName={userDisplayName}
            />
          </CardContent>
        </Card>

        <Button type="button" variant="outline" onClick={resetAndClose} disabled={isSubmitting}>
          {t('equipmentQRScan.close')}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default QRNoteImageDialog;
