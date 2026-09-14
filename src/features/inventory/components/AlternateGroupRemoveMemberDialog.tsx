import { useI18n } from '@/i18n';
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
import type { AlternateGroupMember } from '@/features/inventory/services/partAlternatesService';

type AlternateGroupRemoveMemberDialogProps = {
  member: AlternateGroupMember | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function AlternateGroupRemoveMemberDialog({
  member,
  onOpenChange,
  onConfirm,
}: AlternateGroupRemoveMemberDialogProps) {
  const { t } = useI18n();
  return (
    <AlertDialog open={!!member} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('alternateGroupDetail.removeTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('alternateGroupDetail.removeDescription', { name: member?.inventory_name || member?.identifier_value || t('alternateGroupDetail.itemFallback') })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('alternateGroups.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('alternateGroupDetail.remove')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
