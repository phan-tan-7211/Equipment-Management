
import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Save, Settings, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SessionOrganization } from '@/contexts/SessionContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useSession } from '@/hooks/useSession';
import { updateOrganization, uploadOrganizationLogo, deleteOrganizationLogo } from '@/features/organization/services/organizationService';
import type { OrganizationUpdatePayload } from '@/features/organization/types/organization';
import { organizationFormSchema, OrganizationFormData } from './organizationSettingsSchema';
import { DangerZoneSection } from './DangerZoneSection';
import { OrganizationInventoryDefaultLocationSection } from './OrganizationInventoryDefaultLocationSection';
import { useOrganizationMembersQuery } from '@/features/organization/hooks/useOrganizationMembers';
import SingleImageUpload from '@/components/common/SingleImageUpload';
import { useI18n } from '@/i18n';

interface OrganizationSettingsProps {
  organization: SessionOrganization;
  currentUserRole: 'owner' | 'admin' | 'member';
}

export const OrganizationSettings: React.FC<OrganizationSettingsProps> = ({
  organization,
  currentUserRole,
}) => {
  const { t } = useI18n();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(organization.logo || null);
  const [privacyEnabled, setPrivacyEnabled] = useState(
    organization.scanLocationCollectionEnabled ?? false,
  );
  const [isTogglingPrivacy, setIsTogglingPrivacy] = useState(false);
  const queryClient = useQueryClient();
  const { refetch } = useOrganization();
  const { refreshSession } = useSession();

  const { data: members = [] } = useOrganizationMembersQuery(organization?.id || '');

  const admins = useMemo(() => {
    return members
      .filter(m => m.role === 'admin' && m.status === 'active')
      .map(m => ({
        id: m.id,
        userId: m.userId,
        name: m.name,
        email: m.email,
      }));
  }, [members]);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: organization.name,
      backgroundColor: organization.backgroundColor || '',
      scan_location_collection_enabled: organization.scanLocationCollectionEnabled ?? false,
    },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') {
      toast.error(t('organizationHub.noPermission'));
      return;
    }

    try {
      setIsUpdating(true);

      const updatePayload: OrganizationUpdatePayload = {
        name: data.name,
        background_color: data.backgroundColor || null,
      };

      const success = await updateOrganization(organization.id, updatePayload);

      if (!success) {
        throw new Error('Failed to update organization');
      }

      await queryClient.invalidateQueries({ queryKey: ['organizations'] });
      await queryClient.invalidateQueries({ queryKey: ['organization', organization.id] });
      await refetch();

      toast.success(t('organizationHub.updateSuccess'));
      form.reset(data);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error(t('organizationHub.updateFailure'));
    } finally {
      setIsUpdating(false);
    }
  };

  const invalidateOrgCache = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['organizations'] });
    await queryClient.invalidateQueries({ queryKey: ['organization', organization.id] });
    await queryClient.invalidateQueries({ queryKey: ['simple-organizations'] });
    await refreshSession(true);
    await refetch();
  }, [queryClient, organization.id, refetch, refreshSession]);

  const handlePrivacyToggle = useCallback(async (checked: boolean) => {
    const previous = privacyEnabled;
    setPrivacyEnabled(checked);
    setIsTogglingPrivacy(true);
    try {
      const success = await updateOrganization(organization.id, {
        scan_location_collection_enabled: checked,
      });
      if (!success) throw new Error('Update failed');
      await invalidateOrgCache();
      toast.success(t(checked ? 'organizationHub.locationEnabled' : 'organizationHub.locationDisabled'));
    } catch {
      setPrivacyEnabled(previous);
      toast.error(t('organizationHub.privacyFailure'));
    } finally {
      setIsTogglingPrivacy(false);
    }
  }, [privacyEnabled, organization.id, invalidateOrgCache, t]);

  const canEdit = currentUserRole === 'owner' || currentUserRole === 'admin';

  if (!canEdit) {
    return (
      <div className="rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">{t('organizationHub.settings')}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('organizationHub.contactAdmin')}
        </p>
      </div>
    );
  }

  const isValidHexColor = (color: string | undefined): boolean => {
    if (!color || color.trim() === '') return false;
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color.trim());
  };

  const watchedBackgroundColor = form.watch('backgroundColor');
  const backgroundColorValue = watchedBackgroundColor || '#ffffff';
  const showColorSwatch = isValidHexColor(watchedBackgroundColor) || backgroundColorValue === '#ffffff';

  const handleLogoUpload = async (file: File) => {
    const publicUrl = await uploadOrganizationLogo(organization.id, file);
    setCurrentLogo(publicUrl);
    await invalidateOrgCache();
  };

  const handleLogoDelete = async () => {
    if (!currentLogo) return;
    await deleteOrganizationLogo(organization.id, currentLogo);
    setCurrentLogo(null);
    await invalidateOrgCache();
  };

  return (
    <div className="divide-y">
      {/* Basic Information */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="pb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <div className="pt-0.5">
                <h2 className="text-sm font-semibold">{t('organizationHub.basicInfo')}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('organizationHub.branding')}
                </p>
              </div>
              <div className="md:col-span-2 space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">{t('organizationHub.name')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isUpdating}
                          placeholder={t('organizationHub.namePlaceholder')}
                          className="w-full max-w-md"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SingleImageUpload
                  currentImageUrl={currentLogo}
                  onUpload={handleLogoUpload}
                  onDelete={handleLogoDelete}
                  maxSizeMB={5}
                  disabled={isUpdating}
                  label={t('organizationHub.logo')}
                  helpText={t('organizationHub.logoHelp')}
                  variant="compact"
                />

                <FormField
                  control={form.control}
                  name="backgroundColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">{t('organizationHub.backgroundColor')}</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap items-center gap-2 max-w-md">
                          {showColorSwatch && (
                            <div
                              className="w-9 h-9 rounded border border-input shrink-0"
                              style={{ backgroundColor: backgroundColorValue }}
                            />
                          )}
                          <Input
                            {...field}
                            disabled={isUpdating}
                            placeholder="#ffffff"
                            type="text"
                            className="w-full min-w-0 flex-1 sm:w-32 font-mono text-sm"
                          />
                          <input
                            type="color"
                            value={field.value || '#ffffff'}
                            onChange={(e) => field.onChange(e.target.value)}
                            disabled={isUpdating}
                            className="w-9 h-9 rounded border border-input cursor-pointer disabled:cursor-not-allowed shrink-0 p-0.5"
                            title={t('organizationHub.pickColor')}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        {t('organizationHub.hexHelp')}
                      </p>
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4 flex justify-stretch sm:justify-end">
                  <Button type="submit" size="sm" disabled={isUpdating || !form.formState.isDirty} className="w-full sm:w-auto">
                    {isUpdating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isUpdating ? t('organizationHub.saving') : t('organizationHub.save')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* Privacy & Location */}
      <div className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <div className="pt-0.5">
            <h2 className="text-sm font-semibold">{t('organizationHub.privacy')}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t('organizationHub.privacyDescription')}
            </p>
          </div>
          <div className="md:col-span-2">
            <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium leading-none">
                  {t('organizationHub.scanLocation')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('organizationHub.scanLocationDescription')}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                {isTogglingPrivacy && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <Switch
                  checked={privacyEnabled}
                  onCheckedChange={handlePrivacyToggle}
                  disabled={isTogglingPrivacy}
                  aria-label={t('organizationHub.toggleLocation')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <OrganizationInventoryDefaultLocationSection
        organization={organization}
        onSaved={invalidateOrgCache}
      />

      {/* Danger Zone */}
      <div className="pt-8">
        <DangerZoneSection
          organization={organization}
          currentUserRole={currentUserRole}
          admins={admins}
        />
      </div>
    </div>
  );
};
