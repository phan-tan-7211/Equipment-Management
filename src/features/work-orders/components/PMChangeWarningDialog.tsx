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
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, FileDown, Wrench } from "lucide-react";
import { useI18n } from '@/i18n';

interface PMChangeWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  changeType: 'disable' | 'change_template';
  hasExistingNotes?: boolean;
  hasCompletedItems?: boolean;
}

export const PMChangeWarningDialog: React.FC<PMChangeWarningDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  changeType,
  hasExistingNotes = false,
  hasCompletedItems = false,
}) => {
  const { t } = useI18n();
  const isDisabling = changeType === 'disable';
  
  const title = isDisabling 
    ? t('workOrderAudit.disablePmTitle')
    : t('workOrderAudit.changePmTitle');
  
  const description = isDisabling
    ? t('workOrderAudit.disablePmDescription')
    : t('workOrderAudit.changePmDescription');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>{description}</p>
            
            {(hasExistingNotes || hasCompletedItems) && (
              <Alert variant="destructive" className="mt-3">
                <Wrench className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>{t('workOrderAudit.warning')}</strong> {t('workOrderAudit.checklistContains')}
                  <ul className="list-disc ml-4 mt-1">
                    {hasCompletedItems && <li>{t('workOrderAudit.completedItems')}</li>}
                    {hasExistingNotes && <li>{t('workOrderAudit.technicianNotes')}</li>}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-warning/10 dark:bg-warning/15 border border-warning/30 dark:border-warning/50 rounded-lg p-3 mt-3">
              <div className="flex items-start gap-2">
                <FileDown className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <div className="text-sm text-warning dark:text-warning">
                  <strong>{t('workOrderAudit.recommendation')}</strong> {t('workOrderAudit.downloadPmPdf')}
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {t('workOrderAudit.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDisabling ? t('workOrderAudit.yesDisablePm') : t('workOrderAudit.yesChangeTemplate')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};



