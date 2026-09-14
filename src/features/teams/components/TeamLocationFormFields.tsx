import React from 'react';
import { Label } from '@/components/ui/label';
import GooglePlacesAutocomplete, { type PlaceLocationData } from '@/components/ui/GooglePlacesAutocomplete';
import { useI18n } from '@/i18n';

export type TeamLocationFormFieldsProps = {
  locationAddress: string;
  onPlaceSelect: (data: PlaceLocationData) => void;
  onClear: () => void;
  isLoaded: boolean;
  locationLabel?: string;
};

export function TeamLocationFormFields({
  locationAddress,
  onPlaceSelect,
  onClear,
  isLoaded,
  locationLabel,
}: TeamLocationFormFieldsProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <Label>{locationLabel ?? t('teamsCards.location')}</Label>
      <GooglePlacesAutocomplete
        value={locationAddress}
        onPlaceSelect={onPlaceSelect}
        onClear={onClear}
        placeholder={t('teamsCards.searchAddress')}
        isLoaded={isLoaded}
      />
    </div>
  );
}
