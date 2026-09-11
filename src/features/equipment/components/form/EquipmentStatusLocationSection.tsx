import React, { useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from 'react-hook-form';
import { type EquipmentFormData } from '@/features/equipment/types/equipment';
import GooglePlacesAutocomplete, { type PlaceLocationData } from '@/components/ui/GooglePlacesAutocomplete';
import { useGoogleMapsLoader } from '@/hooks/useGoogleMapsLoader';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/i18n';

interface EquipmentStatusLocationSectionProps {
  form: UseFormReturn<EquipmentFormData>;
}

function buildAddressDisplay(values: EquipmentFormData): string {
  const parts = [
    values.assigned_location_street,
    values.assigned_location_city,
    values.assigned_location_state,
    values.assigned_location_country,
  ].filter(Boolean);
  return parts.join(', ');
}

const EquipmentStatusLocationSection: React.FC<EquipmentStatusLocationSectionProps> = ({ form }) => {
  const { t } = useI18n();
  const { isLoaded } = useGoogleMapsLoader();
  const values = form.getValues();
  const addressDisplay = buildAddressDisplay(values);

  const handlePlaceSelect = useCallback(
    (data: PlaceLocationData) => {
      form.setValue('assigned_location_street', data.street, { shouldDirty: true });
      form.setValue('assigned_location_city', data.city, { shouldDirty: true });
      form.setValue('assigned_location_state', data.state, { shouldDirty: true });
      form.setValue('assigned_location_country', data.country, { shouldDirty: true });
      form.setValue('assigned_location_lat', data.lat ?? undefined, { shouldDirty: true });
      form.setValue('assigned_location_lng', data.lng ?? undefined, { shouldDirty: true });
    },
    [form],
  );

  const handleClear = useCallback(() => {
    form.setValue('assigned_location_street', undefined, { shouldDirty: true });
    form.setValue('assigned_location_city', undefined, { shouldDirty: true });
    form.setValue('assigned_location_state', undefined, { shouldDirty: true });
    form.setValue('assigned_location_country', undefined, { shouldDirty: true });
    form.setValue('assigned_location_lat', undefined, { shouldDirty: true });
    form.setValue('assigned_location_lng', undefined, { shouldDirty: true });
  }, [form]);

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          {t('equipmentForm.statusAndLocation')}
        </h3>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('equipmentForm.statusRequired')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder={t('equipmentForm.selectStatus')} /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="active">{t('equipmentForm.statusActive')}</SelectItem>
                  <SelectItem value="maintenance">{t('equipmentForm.statusMaintenance')}</SelectItem>
                  <SelectItem value="inactive">{t('equipmentForm.statusInactive')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('equipmentForm.locationDescriptionRequired')}</FormLabel>
              <FormControl><Input placeholder={t('equipmentForm.locationPlaceholder')} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <Label>{t('equipmentForm.assignedAddress')}</Label>
          <GooglePlacesAutocomplete
            value={addressDisplay}
            onPlaceSelect={handlePlaceSelect}
            onClear={handleClear}
            placeholder={t('equipmentForm.searchAddress')}
            isLoaded={isLoaded}
          />
          <p className="text-xs text-muted-foreground">{t('equipmentForm.addressHelp')}</p>
        </div>
        <FormField control={form.control} name="installation_date" render={({ field }) => (
          <FormItem><FormLabel>{t('equipmentForm.installationDate')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="warranty_expiration" render={({ field }) => (
          <FormItem><FormLabel>{t('equipmentForm.warrantyExpiration')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="last_maintenance" render={({ field }) => (
          <FormItem><FormLabel>{t('equipmentForm.lastMaintenance')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
      </CardContent>
    </Card>
  );
};

export default EquipmentStatusLocationSection;
