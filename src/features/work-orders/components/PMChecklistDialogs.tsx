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
import { useI18n } from '@/i18n';

type PMChecklistDialogsProps = {
  showSetAllOKDialog: boolean;
  onSetAllOKDialogOpenChange: (open: boolean) => void;
  isSettingAllOK: boolean;
  onConfirmSetAllOK: () => void;
  showRevertPMDialog: boolean;
  onRevertPMDialogOpenChange: (open: boolean) => void;
  isReverting: boolean;
  onConfirmRevert: () => void;
  /** When true, confirm copy explains the parent work order will reopen to accepted. */
  willReopenWorkOrder?: boolean;
};

export function PMChecklistDialogs({
  showSetAllOKDialog,
  onSetAllOKDialogOpenChange,
  isSettingAllOK,
  onConfirmSetAllOK,
  showRevertPMDialog,
  onRevertPMDialogOpenChange,
  isReverting,
  onConfirmRevert,
  willReopenWorkOrder = false,
}: PMChecklistDialogsProps) {
  const { t } = useI18n();
  return (
    <>
      <AlertDialog open={showSetAllOKDialog} onOpenChange={onSetAllOKDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workOrderResidual.setAllConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('workOrderResidual.setAllDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSettingAllOK}>{t('workOrderResidual.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmSetAllOK} disabled={isSettingAllOK}>
              {isSettingAllOK ? t('workOrderResidual.settingAndSaving') : t('workOrderResidual.setAllAndSave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRevertPMDialog} onOpenChange={onRevertPMDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('workOrderResidual.revertConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {willReopenWorkOrder
                ? t('workOrderResidual.revertReopensDescription')
                : t('workOrderResidual.revertDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReverting}>{t('workOrderResidual.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRevertPMDialogOpenChange(false);
                onConfirmRevert();
              }}
              disabled={isReverting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isReverting ? t('workOrderResidual.reverting') : t('workOrderResidual.confirmRevert')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
