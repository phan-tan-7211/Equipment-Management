import React from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n';

type WorkOrderDeleteImageSummary = {
  count: number;
};

type WorkOrderDeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageData?: WorkOrderDeleteImageSummary | null;
  isDeleting: boolean;
  onConfirm: () => void;
  requireTypedConfirm?: boolean;
  confirmText?: string;
  onConfirmTextChange?: (text: string) => void;
  confirmInputId?: string;
};

export function WorkOrderDeleteConfirmDialog({
  open,
  onOpenChange,
  imageData,
  isDeleting,
  onConfirm,
  requireTypedConfirm = false,
  confirmText = '',
  onConfirmTextChange,
  confirmInputId = 'work-order-delete-confirm',
}: WorkOrderDeleteConfirmDialogProps) {
  const { t } = useI18n();
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) onConfirmTextChange?.('');
  };

  const confirmDisabled =
    isDeleting || (requireTypedConfirm && confirmText.trim() !== 'DELETE');

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('workOrderAudit.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                {t('workOrderAudit.deleteQuestion')}
              </p>
              <ul className="space-y-1 text-sm">
                <li>• {t('workOrderAudit.workOrderDetails')}</li>
                <li>• {t('workOrderAudit.notes')}</li>
                <li>• {t('workOrderAudit.costs')}</li>
                <li>• {t('workOrderAudit.statusHistory')}</li>
                <li>• {t('workOrderAudit.pmRecords')}</li>
                {imageData && imageData.count > 0 && (
                  <li className="flex items-center gap-2">
                    • {t('workOrderAudit.uploadedImages')}
                    <Badge variant="destructive" className="text-xs">
                      {imageData.count} {imageData.count === 1 ? t('workOrderAudit.image') : t('workOrderAudit.images')}
                    </Badge>
                  </li>
                )}
              </ul>
              {requireTypedConfirm && onConfirmTextChange ? (
                <div className="space-y-2">
                  <Label htmlFor={confirmInputId}>{t('workOrderAudit.typeDelete')}</Label>
                  <Input
                    id={confirmInputId}
                    autoComplete="off"
                    value={confirmText}
                    onChange={(e) => onConfirmTextChange(e.target.value)}
                    placeholder={t('workOrderAudit.deletePlaceholder')}
                    className="font-mono"
                  />
                </div>
              ) : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{t('workOrderAudit.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? t('workOrderAudit.deleting') : t('workOrderAudit.deletePermanently')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
