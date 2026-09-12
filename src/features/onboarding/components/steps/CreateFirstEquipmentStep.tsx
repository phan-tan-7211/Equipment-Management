import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { OfflineAwareWorkOrderService } from '@/services/offlineAwareService';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import TeamPickerWithCreate from '@/features/teams/components/TeamPickerWithCreate';
import { useI18n } from '@/i18n';

interface CreateFirstEquipmentStepProps {
  defaultTeamId?: string;
  onEquipmentCreated: (equipmentId: string, equipmentName: string) => void;
  onBack: () => void;
}

export const CreateFirstEquipmentStep: React.FC<CreateFirstEquipmentStepProps> = ({
  defaultTeamId = '',
  onEquipmentCreated,
  onBack,
}) => {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [teamId, setTeamId] = useState(defaultTeamId);
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'active' | 'maintenance' | 'inactive'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!teamId) next.team_id = t('productOnboarding.selectTeam');
    if (!manufacturer.trim()) next.manufacturer = t('productOnboarding.manufacturerRequired');
    if (!model.trim()) next.model = t('productOnboarding.modelRequired');
    if (!serialNumber.trim()) next.serial_number = t('productOnboarding.serialRequired');
    if (!location.trim()) next.location = t('productOnboarding.locationRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !currentOrganization?.id || !user?.id) {
      return;
    }

    setIsSubmitting(true);
    try {
      const name = `${manufacturer.trim()} ${model.trim()}`.trim();
      const service = new OfflineAwareWorkOrderService(currentOrganization.id, user.id);
      const today = new Date().toISOString().slice(0, 10);

      const result = await service.createEquipmentFull({
        name,
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        serial_number: serialNumber.trim(),
        status,
        location: location.trim(),
        installation_date: today,
        notes: '',
        team_id: teamId,
      });

      if (result.queuedOffline) {
        toast({
          title: t('productOnboarding.offlineSaved'),
          description: t('productOnboarding.offlineDescription'),
          variant: 'destructive',
        });
        return;
      }

      if (!result.data?.id) {
        throw new Error('Failed to create equipment');
      }

      queryClient.invalidateQueries({ queryKey: ['equipment', currentOrganization.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', currentOrganization.id] });

      onEquipmentCreated(result.data.id, name);
    } catch (error) {
      console.error('Create first equipment failed:', error);
      toast({
        title: t('productOnboarding.equipmentCreateFailed'),
        description: t('productOnboarding.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="onboarding-step-create-equipment">
      <TeamPickerWithCreate
        value={teamId}
        onChange={setTeamId}
        requireTeam
        showBillingCallout
        id="onboarding-equipment-team"
      />
      {errors.team_id && <p className="text-sm text-destructive">{errors.team_id}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="onboarding-manufacturer">{t('productOnboarding.manufacturer')}</Label>
          <Input
            id="onboarding-manufacturer"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
          />
          {errors.manufacturer && (
            <p className="text-sm text-destructive">{errors.manufacturer}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="onboarding-model">{t('productOnboarding.model')}</Label>
          <Input
            id="onboarding-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
          {errors.model && <p className="text-sm text-destructive">{errors.model}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="onboarding-serial">{t('productOnboarding.serial')}</Label>
          <Input
            id="onboarding-serial"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
          />
          {errors.serial_number && (
            <p className="text-sm text-destructive">{errors.serial_number}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="onboarding-location">{t('productOnboarding.location')}</Label>
          <Input
            id="onboarding-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t('productOnboarding.locationPlaceholder')}
          />
          {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="onboarding-status">{t('productOnboarding.status')}</Label>
          <Select value={status} onValueChange={(v: 'active' | 'maintenance' | 'inactive') => setStatus(v)}>
            <SelectTrigger id="onboarding-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t('productOnboarding.active')}</SelectItem>
              <SelectItem value="maintenance">{t('productOnboarding.maintenance')}</SelectItem>
              <SelectItem value="inactive">{t('productOnboarding.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          {t('productOnboarding.back')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t('productOnboarding.creatingEquipment') : t('productOnboarding.continue')}
        </Button>
      </div>
    </form>
  );
};
