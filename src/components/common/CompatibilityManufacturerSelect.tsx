import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type CompatibilityManufacturerSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  manufacturers: string[];
  disabled?: boolean;
  placeholder?: string;
};

export function CompatibilityManufacturerSelect({
  value,
  onValueChange,
  manufacturers,
  disabled,
  placeholder = 'Select manufacturer...',
}: CompatibilityManufacturerSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {manufacturers.map((mfr) => (
          <SelectItem key={mfr} value={mfr}>
            {mfr}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
