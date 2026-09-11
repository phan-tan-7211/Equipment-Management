import React from 'react';
import { Columns3, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useI18n } from '@/i18n';
import type { EquipmentTableColumnMeta } from './equipmentTableColumns';

export interface EquipmentColumnPickerProps { allColumns: readonly EquipmentTableColumnMeta[]; visibleColumns: Record<string, boolean>; onToggle: (key: string) => void; onReset: () => void; hasOverrides: boolean; }

const COLUMN_KEYS: Record<string, string> = {
  status: 'equipment.status', name: 'equipment.name', manufacturer: 'equipment.manufacturer', model: 'equipment.model', serial_number: 'equipment.serialNumber', working_hours: 'equipment.hours', location: 'equipment.location', team_name: 'equipment.team', last_maintenance: 'equipment.lastMaintenanceFull',
};

const EquipmentColumnPicker: React.FC<EquipmentColumnPickerProps> = ({ allColumns, visibleColumns, onToggle, onReset, hasOverrides }) => {
  const { t } = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" aria-label={t('equipment.toggleColumns')}>
          <Columns3 className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t('equipment.columns')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('equipment.columns')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allColumns.map((col) => {
          const checked = visibleColumns[col.key] ?? true;
          return (
            <DropdownMenuCheckboxItem key={col.key} checked={checked} disabled={!col.canHide} onCheckedChange={() => onToggle(col.key)} onSelect={(e) => e.preventDefault()}>
              {t(COLUMN_KEYS[col.key] ?? col.title)}
            </DropdownMenuCheckboxItem>
          );
        })}
        {hasOverrides && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => onReset()}><RotateCcw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />{t('equipment.resetColumns')}</DropdownMenuItem></>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EquipmentColumnPicker;
