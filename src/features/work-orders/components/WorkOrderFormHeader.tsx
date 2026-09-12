import { useI18n } from '@/i18n';
import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { OfflineFormBanner } from '@/features/offline-queue/components/OfflineFormBanner';

interface WorkOrderFormHeaderProps {
  isEditMode: boolean;
  preSelectedEquipment?: {
    id?: string;
    name?: string;
  } | null;
}

export const WorkOrderFormHeader: React.FC<WorkOrderFormHeaderProps> = ({
  isEditMode,
  preSelectedEquipment
}) => {
  const { t } = useI18n();
  return (
    <DialogHeader>
      <DialogTitle>{isEditMode ? t('workOrderForm.editTitle') : t('workOrderForm.createTitle')}</DialogTitle>
      <DialogDescription>
        {isEditMode ?
          t('workOrderForm.editDescription') :
          (preSelectedEquipment ?
            t('workOrderForm.createForEquipment', { name: preSelectedEquipment.name || '' }) :
            t('workOrderForm.createDescription')
          )
        }
      </DialogDescription>
      <OfflineFormBanner />
    </DialogHeader>
  );
};

