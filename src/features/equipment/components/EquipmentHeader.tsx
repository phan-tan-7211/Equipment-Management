import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Upload } from 'lucide-react';
import { useI18n } from '@/i18n';
import PageHeader from '@/components/layout/PageHeader';

interface EquipmentHeaderProps {
  organizationName: string;
  canCreate: boolean;
  canImport: boolean;
  onAddEquipment: () => void;
  onImportCsv: () => void;
}

const EquipmentHeader: React.FC<EquipmentHeaderProps> = ({
  organizationName,
  canCreate,
  canImport,
  onAddEquipment,
  onImportCsv
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-testid="equipment-header">
      <PageHeader
        className="w-full"
        title={t('equipment.title')}
        description={t('equipment.manageFor', { name: organizationName })}
        actions={(
          <div className="flex flex-col sm:flex-row gap-2" data-testid="button-container">
            {canImport && (
              <Button
                variant="outline"
                onClick={onImportCsv}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                {t('equipmentImport.title')}
              </Button>
            )}
            {canCreate && (
              <Button
                onClick={onAddEquipment}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                {t('equipment.addEquipment')}
              </Button>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default EquipmentHeader;
