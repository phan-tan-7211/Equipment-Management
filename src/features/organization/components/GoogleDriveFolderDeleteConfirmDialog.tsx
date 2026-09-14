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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/i18n';

type GoogleDriveFolderDeleteConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  childCount: number;
  isDeleting: boolean;
  onConfirm: () => void;
};

export function GoogleDriveFolderDeleteConfirmDialog({
  open,
  onOpenChange,
  folderName,
  childCount,
  isDeleting,
  onConfirm,
}: GoogleDriveFolderDeleteConfirmDialogProps) {
  const { t } = useI18n();
  const [acknowledged, setAcknowledged] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAcknowledged(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('organizationIntegrations.deleteFolderTitle')}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                {t('organizationIntegrations.folderContains', { name: folderName, count: childCount === 1 ? 1 : `${childCount}+` })}
              </p>
              <p>
                {t('organizationIntegrations.deleteFolderDisclaimer')}
              </p>
              <div className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <Checkbox
                  id="delete-folder-acknowledge"
                  checked={acknowledged}
                  disabled={isDeleting}
                  onCheckedChange={(checked) => setAcknowledged(Boolean(checked))}
                  className="mt-0.5"
                />
                <Label htmlFor="delete-folder-acknowledge" className="text-sm leading-snug cursor-pointer">
                  {t('organizationIntegrations.folderDeleteAcknowledgement')}
                </Label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel disabled={isDeleting}>{t('organizationIntegrations.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!acknowledged || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('organizationIntegrations.deletingFolder')}
              </>
            ) : (
              t('organizationIntegrations.deleteFolder')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
