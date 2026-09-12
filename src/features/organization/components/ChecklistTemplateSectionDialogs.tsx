import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type ChecklistTemplateSectionDialogsProps = {
  renameDialogOpen: boolean;
  onRenameDialogOpenChange: (open: boolean) => void;
  renameOriginal: string | null;
  renameInput: string;
  onRenameInputChange: (value: string) => void;
  onConfirmRename: () => void;
  deleteDialogOpen: boolean;
  onDeleteDialogOpenChange: (open: boolean) => void;
  deleteTarget: string | null;
  deleteTargetItemCount: number;
  onConfirmDelete: () => void;
};

export function ChecklistTemplateSectionDialogs({
  renameDialogOpen,
  onRenameDialogOpenChange,
  renameOriginal,
  renameInput,
  onRenameInputChange,
  onConfirmRename,
  deleteDialogOpen,
  onDeleteDialogOpenChange,
  deleteTarget,
  deleteTargetItemCount,
  onConfirmDelete,
}: ChecklistTemplateSectionDialogsProps) {
  const { t } = useI18n();
  return (
    <>
      <Dialog open={renameDialogOpen} onOpenChange={onRenameDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pmTemplates.editor.renameSectionTitle')}</DialogTitle>
            <DialogDescription>{t('pmTemplates.editor.renameSectionDescription', { name: renameOriginal ?? '' })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="section-name">{t('pmTemplates.editor.sectionName')}</Label>
            <Input
              id="section-name"
              value={renameInput}
              onChange={(e) => onRenameInputChange(e.target.value)}
              placeholder={t('pmTemplates.editor.sectionNamePlaceholder')}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onRenameDialogOpenChange(false)}>
              {t('pmTemplates.editor.cancel')}
            </Button>
            <Button
              onClick={onConfirmRename}
              disabled={!renameInput.trim() || renameInput.trim() === renameOriginal}
            >
              {t('pmTemplates.editor.rename')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pmTemplates.editor.deleteSectionTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? t('pmTemplates.editor.deleteSectionDescription', { name: deleteTarget, count: deleteTargetItemCount })
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('pmTemplates.editor.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('pmTemplates.editor.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
