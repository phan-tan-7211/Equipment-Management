import React, { useState } from 'react';
import { useI18n } from '@/i18n';
import { useUser } from '@/contexts/useUser';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAppToast } from '@/hooks/useAppToast';
import { useAuth } from '@/hooks/useAuth';
import SingleImageUpload from '@/components/common/SingleImageUpload';
import { uploadAvatar, deleteAvatar } from '@/services/profileService';
import { normalizeStoredObjectPath } from '@/services/imageUploadService';
import { useResolvedAvatarUrl } from '@/hooks/useResolvedAvatarUrl';
import { Save, Loader2 } from 'lucide-react';
import { trimmedAvatarPath, userDisplayInitials } from '@/utils/userDisplayInitials';
import { resolveEffectiveAvatarUrl } from '@/utils/resolveEffectiveAvatarUrl';

const ProfileSettings = () => {
  const { t } = useI18n();
  const { currentUser, setCurrentUser } = useUser();
  const { user: authUser } = useAuth();
  const { data: avatarDisplayUrl } = useResolvedAvatarUrl(currentUser?.avatar_url);
  const appToast = useAppToast();
  const [name, setName] = useState(currentUser?.name || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', currentUser.id);

      if (error) throw error;

      setCurrentUser({
        ...currentUser,
        name
      });

      appToast.success({ description: t('settingsForms.profileSaved') });
    } catch (error) {
      console.error('Error updating profile:', error);
      appToast.error({ description: t('settingsForms.profileSaveFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!currentUser) return;
    const publicUrl = await uploadAvatar(currentUser.id, file);
    setCurrentUser({ ...currentUser, avatar_url: publicUrl });
  };

  const handleAvatarDelete = async () => {
    if (!currentUser) return;
    // Bucket-aware: storage paths + legacy Supabase URL forms are deletable;
    // external Google CDN URLs normalize to null and stay as display-only fallbacks.
    const deletablePath = normalizeStoredObjectPath(
      trimmedAvatarPath(currentUser.avatar_url),
      'user-avatars',
    );
    if (!deletablePath) return;

    // Errors propagate to SingleImageUpload, which surfaces useAppToast feedback.
    await deleteAvatar(currentUser.id, deletablePath);
    setCurrentUser({
      ...currentUser,
      avatar_url: resolveEffectiveAvatarUrl(null, authUser?.user_metadata),
    });
  };

  if (!currentUser) return null;

  const initials = userDisplayInitials(currentUser.name);
  const avatarPath = trimmedAvatarPath(currentUser.avatar_url);
  const deletableAvatarPath = normalizeStoredObjectPath(avatarPath, 'user-avatars');
  const canDeleteAvatar = deletableAvatarPath != null;

  return (
    <>
      <SingleImageUpload
        currentImageUrl={avatarDisplayUrl}
        onUpload={handleAvatarUpload}
        onDelete={canDeleteAvatar ? handleAvatarDelete : undefined}
        maxSizeMB={5}
        disabled={isLoading}
        variant="avatar"
        avatarFallback={initials}
      />

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">{t('settingsForms.displayName')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('settingsForms.displayNamePlaceholder')}
          className="max-w-md"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">{t('settingsForms.email')}</Label>
        <Input
          id="email"
          value={currentUser.email}
          disabled
          className="bg-muted max-w-md"
        />
        <p className="text-xs text-muted-foreground">
          {t('settingsForms.emailCannotChange')}
        </p>
      </div>

      <div className="border-t pt-4 flex justify-end">
        <Button
          onClick={handleSave}
          size="sm"
          disabled={isLoading || name === currentUser.name}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isLoading ? t('settingsForms.saving') : t('settingsForms.saveChanges')}
        </Button>
      </div>
    </>
  );
};

export default ProfileSettings;
