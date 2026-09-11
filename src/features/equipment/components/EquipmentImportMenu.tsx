import React from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/i18n';

interface EquipmentImportMenuProps {
  onImportCsv: () => void;
}

const EquipmentImportMenu: React.FC<EquipmentImportMenuProps> = ({ onImportCsv }) => {
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          aria-label={t('equipmentAux.importEquipment')}
        >
          <Upload className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {t('equipmentAux.importFormat')}
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={onImportCsv} className="gap-2 cursor-pointer">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-sm">{t('equipmentAux.importCsv')}</span>
            <span className="text-[10px] text-muted-foreground">{t('equipmentAux.addEquipmentFromFile')}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EquipmentImportMenu;
