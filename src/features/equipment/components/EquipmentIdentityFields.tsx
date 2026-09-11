import React from 'react';
import { Tables } from '@/integrations/supabase/types';
import InlineEditField from './InlineEditField';
import { useI18n } from '@/i18n';

type Equipment = Tables<'equipment'>;

export interface EquipmentIdentityFieldsProps {
  equipment: Equipment;
  canEdit: boolean;
  manufacturerFieldId: string;
  modelFieldId: string;
  serialNumberFieldId: string;
  onFieldUpdate: (field: keyof Equipment, value: string) => void | Promise<void>;
}

export const EquipmentIdentityFields: React.FC<EquipmentIdentityFieldsProps> = ({
  equipment,
  canEdit,
  manufacturerFieldId,
  modelFieldId,
  serialNumberFieldId,
  onFieldUpdate,
}) => {
  const { t } = useI18n();

  return (
    <>
      <div>
        <label htmlFor={manufacturerFieldId} className="text-sm font-medium text-muted-foreground">
          {t('equipmentDetails.manufacturer')}
        </label>
        <div className="mt-1 w-full">
          <InlineEditField
            value={equipment.manufacturer || ''}
            onSave={(value) => onFieldUpdate('manufacturer', value)}
            canEdit={canEdit}
            fieldId={manufacturerFieldId}
            placeholder={t('equipmentDetails.manufacturerPlaceholder')}
            className="w-full text-base"
            editAriaLabel={t('equipmentDetails.editManufacturer')}
          />
        </div>
      </div>

      <div>
        <label htmlFor={modelFieldId} className="text-sm font-medium text-muted-foreground">
          {t('equipmentDetails.model')}
        </label>
        <div className="mt-1 w-full">
          <InlineEditField
            value={equipment.model || ''}
            onSave={(value) => onFieldUpdate('model', value)}
            canEdit={canEdit}
            fieldId={modelFieldId}
            placeholder={t('equipmentDetails.modelPlaceholder')}
            className="w-full text-base"
            editAriaLabel={t('equipmentDetails.editModel')}
          />
        </div>
      </div>

      <div>
        <label htmlFor={serialNumberFieldId} className="text-sm font-medium text-muted-foreground">
          {t('equipmentDetails.serialNumber')}
        </label>
        <div className="mt-1 w-full">
          <InlineEditField
            value={equipment.serial_number || ''}
            onSave={(value) => onFieldUpdate('serial_number', value)}
            canEdit={canEdit}
            fieldId={serialNumberFieldId}
            placeholder={t('equipmentDetails.serialNumberPlaceholder')}
            className="w-full text-base"
            editAriaLabel={t('equipmentDetails.editSerialNumber')}
          />
        </div>
      </div>
    </>
  );
};
