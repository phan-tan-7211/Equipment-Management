import React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { useI18n } from '@/i18n';

interface DeleteTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  isPending: boolean;
  onConfirm: () => void;
}

const DeleteTeamDialog: React.FC<DeleteTeamDialogProps> = ({
  open,
  onOpenChange,
  teamName,
  isPending,
  onConfirm,
}) => {
  const { t } = useI18n();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t('teamsDetail.deleteQuestion')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                {t('teamsDetail.deleteDescription', { name: teamName })}
              </p>
              <p>{t('teamsDetail.cannotUndo')}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('teamsDetail.cancel')}</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('teamsDetail.deleting')}
              </>
            ) : (
              t('teamsDetail.delete')
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTeamDialog;
