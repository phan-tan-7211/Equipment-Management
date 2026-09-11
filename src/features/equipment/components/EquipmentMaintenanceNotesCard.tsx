import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import InlineEditField from './InlineEditField';
import { useI18n } from '@/i18n';

type Equipment = Tables<'equipment'>;

export type EquipmentMaintenanceNotesCardProps = {
  equipment: Equipment;
  canEdit: boolean;
  notesFieldId: string;
  onFieldUpdate: (field: keyof Equipment, value: string) => void | Promise<void>;
};

export function EquipmentMaintenanceNotesCard({
  equipment,
  canEdit,
  notesFieldId,
  onFieldUpdate,
}: EquipmentMaintenanceNotesCardProps) {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          {t('equipmentDetails.maintenanceInformation')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor={notesFieldId} className="text-sm font-medium text-muted-foreground">
            {t('equipmentDetails.notes')}
          </label>
          <div className="mt-1 w-full">
            <InlineEditField
              value={equipment.notes || ''}
              onSave={(value) => onFieldUpdate('notes', value)}
              canEdit={canEdit}
              fieldId={notesFieldId}
              type="textarea"
              placeholder={t('equipmentDetails.maintenanceNotesPlaceholder')}
              className="w-full text-base"
              editAriaLabel={t('equipmentDetails.editNotes')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
