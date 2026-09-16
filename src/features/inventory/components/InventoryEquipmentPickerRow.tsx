import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Check, Forklift } from 'lucide-react';
import { displayableImageSrc } from '@/services/imageUploadService';

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
  const imageSrc = displayableImageSrc(equipment.image_url);

  return (
    <div
      key={equipment.id}
      className="flex items-center gap-3 rounded p-2 hover:bg-muted/50"
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={(checked) => onToggle(equipment.id, checked as boolean)}
      />
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border/70 bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <Forklift className="h-4 w-4 text-muted-foreground/50" aria-hidden="true" />
        </div>
        {imageSrc && (
          <img
            src={imageSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        )}
      </div>
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
