import React from 'react';
import { Button } from "@/components/ui/button";
import { useI18n } from '@/i18n';

interface EquipmentFormActionsProps {
  isEdit: boolean;
  isPending: boolean;
  onClose: () => void;
}

const EquipmentFormActions: React.FC<EquipmentFormActionsProps> = ({
  isEdit,
  isPending,
  onClose
}) => {
  const { t } = useI18n();

  return (
    <div className="flex gap-2 justify-end" data-testid="equipment-form-actions">
      <Button type="button" variant="outline" onClick={onClose}>
        {t('equipmentForm.cancel')}
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending
          ? t('equipmentForm.creating')
          : isEdit
            ? t('equipmentForm.updateEquipment')
            : t('equipmentForm.createEquipment')}
      </Button>
    </div>
  );
};

export default EquipmentFormActions;