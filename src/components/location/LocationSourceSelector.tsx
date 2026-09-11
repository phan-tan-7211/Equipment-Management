import { MapPin } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getLocationSelectorChoices } from '@/components/location/locationSourceSelectorChoices';
import { cn } from '@/lib/utils';
import type { EquipmentLocationOption, LocationDisplayMode } from '@/utils/effectiveLocation';
import { useI18n } from '@/i18n';

type LocationSourceSelectorProps = {
  value: LocationDisplayMode;
  onChange: (mode: LocationDisplayMode) => void;
  options: EquipmentLocationOption[];
  id?: string;
  className?: string;
  variant?: 'default' | 'header';
};

const LOCATION_LABEL_KEYS: Record<LocationDisplayMode, string> = {
  effective: 'equipmentLocation.effective',
  team: 'equipmentLocation.team',
  manual: 'equipmentLocation.manual',
  scan: 'equipmentLocation.scan',
  legacy: 'equipmentLocation.legacy',
};

export function LocationSourceSelector({
  value,
  onChange,
  options,
  id = 'location-source-selector',
  className,
  variant = 'default',
}: LocationSourceSelectorProps) {
  const { t } = useI18n();
  const choices = getLocationSelectorChoices(options);
  const sourceLabel = t('equipmentLocation.source');
  const effectiveLabel = t('equipmentLocation.effective');

  const selectContent = (
    <SelectContent>
      {choices.map((choice) => (
        <SelectItem key={choice.value} value={choice.value} disabled={choice.disabled}>
          {t(LOCATION_LABEL_KEYS[choice.value])}
        </SelectItem>
      ))}
    </SelectContent>
  );

  if (variant === 'header') {
    return (
      <Select value={value} onValueChange={(next) => onChange(next as LocationDisplayMode)}>
        <SelectTrigger
          id={id}
          aria-label={sourceLabel}
          className={cn(
            'h-auto min-h-0 w-full border-0 bg-transparent px-1 py-1.5 shadow-none',
            'text-sm font-medium hover:bg-muted/40 rounded-md -mx-1',
            'focus:ring-0 focus:ring-offset-0 [&>svg:last-child]:shrink-0 [&>svg:last-child]:opacity-60',
            className,
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 leading-none">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <SelectValue placeholder={effectiveLabel} className="truncate leading-none" />
          </div>
        </SelectTrigger>
        {selectContent}
      </Select>
    );
  }

  return (
    <div className={className}>
      <Label htmlFor={id} className="sr-only">
        {sourceLabel}
      </Label>
      <Select value={value} onValueChange={(next) => onChange(next as LocationDisplayMode)}>
        <SelectTrigger id={id} aria-label={sourceLabel} className="h-8 text-xs">
          <SelectValue placeholder={effectiveLabel} />
        </SelectTrigger>
        {selectContent}
      </Select>
    </div>
  );
}
