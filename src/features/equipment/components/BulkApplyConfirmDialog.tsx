import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/i18n';

export interface BulkApplyConfirmDialogProps {
  open: boolean;
  fieldLabel: string;
  selectedCount: number;
  onApplyAll: () => void;
  onApplyOne: () => void;
  onCancel: () => void;
}

export const BulkApplyConfirmDialog: React.FC<BulkApplyConfirmDialogProps> = ({
  open,
  fieldLabel,
  selectedCount,
  onApplyAll,
  onApplyOne,
  onCancel,
}) => {
  const { t } = useI18n();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('equipmentBulk.applyTitle')}</DialogTitle>
          <DialogDescription>
            {t('equipmentBulk.applyDescription', { field: fieldLabel, count: selectedCount })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('equipmentBulk.cancel')}
          </Button>
          <Button type="button" variant="outline" onClick={onApplyOne}>
            {t('equipmentBulk.applyOne')}
          </Button>
          <Button type="button" onClick={onApplyAll}>
            {t('equipmentBulk.applyAll')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
