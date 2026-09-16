import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { InventoryEquipmentThumbnail } from '@/features/inventory/components/InventoryEquipmentThumbnail';

export type InventoryEquipmentPickerItem = {
  id: string;
  name: string;
  manufacturer?: string | null;
  model?: string | null;
  image_url?: string | null;
};

export type InventoryEquipmentPickerRowProps = {
  equipment: InventoryEquipmentPickerItem;
  isSelected: boolean;
  onToggle: (equipmentId: string, checked: boolean) => void;
  selectedBadgeLabel?: string;
};

export function InventoryEquipmentPickerRow({
  equipment,
  isSelected,
  onToggle,
  selectedBadgeLabel,
}: InventoryEquipmentPickerRowProps) {
  return (
    <div
      key={equipment.id}
      className="flex items-center gap-3 rounded p-2 hover:bg-muted/50"
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onToggle(equipment.id, checked as boolean)}
      />
      <InventoryEquipmentThumbnail equipment={equipment} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{equipment.name}</div>
        <div className="truncate text-sm text-muted-foreground">
          {equipment.manufacturer} {equipment.model}
        </div>
      </div>
      {isSelected && (
        <Badge variant="secondary" className="shrink-0 text-xs">
          <Check className="mr-1 h-3 w-3" />
          {selectedBadgeLabel}
        </Badge>
      )}
    </div>
  );
}
