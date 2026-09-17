import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useEquipmentNotesPermissions } from '@/features/equipment/hooks/useEquipmentNotesPermissions';
import { useEquipmentMediaLibrary } from '@/features/equipment/hooks/useEquipmentMediaLibrary';
import ImageGallery from '@/components/common/ImageGallery';
import ImageUploadWithNote from '@/components/common/ImageUploadWithNote';
import { EquipmentMediaFiltersBar } from '@/features/equipment/components/media/EquipmentMediaFiltersBar';
import { EquipmentMediaExplorer } from '@/features/equipment/components/media/EquipmentMediaExplorer';
import {
  deleteEquipmentImage,
  updateEquipmentDisplayImage,
  type EquipmentImageData,
} from '@/features/equipment/services/equipmentImagesService';
import { createEquipmentNoteWithImages } from '@/features/equipment/services/equipmentNotesService';
import {
  removeEquipmentDisplayImage,
  removeEquipmentDisplayImageSet,
  replaceEquipmentDisplayImage,
} from '@/features/equipment/services/equipmentDisplayImageService';
import { validateImageFile } from '@/services/imageUploadService';
import { equipment } from '@/lib/queryKeys';
import { isEquipmentDisplayImage } from '@/features/equipment/utils/equipmentMediaFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Images, ImagePlus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';

interface EquipmentImagesTabProps {
  equipmentId: string;
  organizationId: string;
  equipmentTeamId?: string;
  currentDisplayImage?: string;
  equipmentName?: string;
}

const EquipmentImagesTab: React.FC<EquipmentImagesTabProps> = ({
  equipmentId,
  organizationId,
  equipmentTeamId,
  currentDisplayImage,
  equipmentName,
}) => {
  const { t } = useI18n();
  const resolvedEquipmentName = equipmentName || t('equipmentMedia.defaultEquipmentName');
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const permissions = useEquipmentNotesPermissions(equipmentTeamId);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [optionalNote, setOptionalNote] = useState('');
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [activeDisplayImage, setActiveDisplayImage] = useState(currentDisplayImage);
  const displayImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveDisplayImage(currentDisplayImage);
  }, [currentDisplayImage]);

  const media = useEquipmentMediaLibrary({
    equipmentId,
    organizationId,
    currentDisplayImage: activeDisplayImage,
  });

  const invalidateMedia = () => {
    queryClient.invalidateQueries({ queryKey: equipment.images(equipmentId) });
    queryClient.invalidateQueries({ queryKey: equipment.notesWithImages(equipmentId) });
    queryClient.invalidateQueries({ queryKey: equipment.list(organizationId) });
    queryClient.invalidateQueries({
      queryKey: equipment.byId(organizationId, equipmentId),
    });
  };

  const deleteImageMutation = useMutation({
    mutationFn: ({
      image,
    }: {
      image: EquipmentImageData;
    }) =>
      (async () => {
        if (image.source_type === 'equipment_display') {
          if (isEquipmentDisplayImage(image, activeDisplayImage)) {
            await removeEquipmentDisplayImage(organizationId, equipmentId);
          } else if (image.description?.startsWith('display-image:')) {
            await removeEquipmentDisplayImageSet(
              image.description.slice('display-image:'.length),
            );
          }

          // Display uploads are persisted as equipment-note media so they can
          // remain in the library. Delete that media record as well.
          if (!image.id.startsWith('equipment-display:')) {
            await deleteEquipmentImage({
              imageId: image.id,
              sourceType: 'equipment_note',
              organizationId,
              equipmentId,
            });
          }
          return;
        }

        return deleteEquipmentImage({
          imageId: image.id,
          sourceType: image.source_type,
          organizationId,
          equipmentId,
          workOrderId: image.source_type === 'work_order_note' ? image.source_id : undefined,
        });
      })(),
    onSuccess: () => {
      invalidateMedia();
      toast.success(t('equipmentMedia.imageDeleted'));
    },
    onError: (error) => {
      console.error('Error deleting image:', error);
      toast.error(t('equipmentMedia.imageDeleteFailed'));
    },
  });

  const setDisplayImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      if (!permissions.canSetDisplayImage) {
        throw new Error('Display image permission denied');
      }
      await updateEquipmentDisplayImage(organizationId, equipmentId, imageUrl);
      return imageUrl;
    },
    onSuccess: (imageUrl) => {
      setActiveDisplayImage(imageUrl || undefined);
      invalidateMedia();
      toast.success(t('equipmentMedia.displayImageUpdated'));
    },
    onError: (error) => {
      console.error('Error setting display image:', error);
      toast.error(
        permissions.canSetDisplayImage
          ? t('equipmentMedia.displayImageUpdateFailed')
          : t('equipmentMedia.displayImagePermissionDenied'),
      );
    },
  });

  const replaceDisplayImageMutation = useMutation({
    mutationFn: async (source: File) => {
      if (!permissions.canSetDisplayImage) {
        throw new Error('Display image permission denied');
      }
      const canonicalRef = await replaceEquipmentDisplayImage({
        organizationId,
        equipmentId,
        source,
      });
      const userName = user?.email?.split('@')[0] || 'User';
      await createEquipmentNoteWithImages(
        equipmentId,
        `${userName} uploaded a display image`,
        0,
        false,
        [source],
        organizationId,
        null,
        `display-image:${canonicalRef}`,
      );
      return canonicalRef;
    },
    onSuccess: (canonicalRef) => {
      setActiveDisplayImage(canonicalRef);
      invalidateMedia();
      toast.success(t('equipmentMedia.displayImageUpdated'));
    },
    onError: (error) => {
      console.error('Error replacing display image:', error);
      toast.error(t('equipmentMedia.displayImageUpdateFailed'));
    },
  });

  const handleDisplayImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const source = event.target.files?.[0];
    event.target.value = '';
    if (!source) return;

    try {
      validateImageFile(source);
      replaceDisplayImageMutation.mutate(source);
    } catch (error) {
      console.error('Error validating display image:', error);
      toast.error(t('equipmentMedia.displayImageUpdateFailed'));
    }
  };

  const uploadImagesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const userName = user?.email?.split('@')[0] || 'User';
      const trimmedNote = optionalNote.trim();
      // Keep automatic persisted audit captions canonical; do not store UI-language text.
      const noteContent =
        trimmedNote ||
        (files.length === 1
          ? `${userName} uploaded an image`
          : `${userName} uploaded ${files.length} images`);

      return createEquipmentNoteWithImages(
        equipmentId,
        noteContent,
        0,
        false,
        files,
        organizationId,
      );
    },
    onSuccess: () => {
      invalidateMedia();
      setShowUploadForm(false);
      setOptionalNote('');
    },
    onError: (error) => {
      console.error('Error uploading images:', error);
      toast.error(t('equipmentMedia.imagesUploadFailed'));
    },
  });

  const canDeleteImage = (image: EquipmentImageData): boolean => {
    if (image.source_type === 'equipment_display') return permissions.canSetDisplayImage;
    if (image.uploaded_by === user?.id) return true;
    return permissions.canDeleteImages;
  };

  const handleDeleteImage = async (imageId: string) => {
    const image = media.images.find((img) => img.id === imageId);
    if (!image) return;
    await deleteImageMutation.mutateAsync({ image });
  };

  if (media.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{t('equipmentMedia.library')}</h2>
          <p className="text-xs text-muted-foreground">
            {t(
              media.images.length === 1 ? 'equipmentMedia.itemSummary' : 'equipmentMedia.itemsSummary',
              { count: media.images.length },
            )}
            {currentOrganization?.name ? ` · ${currentOrganization.name}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setExplorerOpen(true)}
          >
            <Images className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {t('equipmentMedia.openExplorer')}
          </Button>
          {permissions.canSetDisplayImage && (
            <>
              <input
                ref={displayImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                aria-label={t('equipmentForm.displayImage')}
                onChange={handleDisplayImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={
                  replaceDisplayImageMutation.isPending ||
                  uploadImagesMutation.isPending
                }
                onClick={() => displayImageInputRef.current?.click()}
              >
                <ImagePlus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                {t('equipmentForm.displayImage')}
              </Button>
            </>
          )}
          {permissions.canUploadImages && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={replaceDisplayImageMutation.isPending}
              onClick={() => setShowUploadForm((open) => !open)}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {showUploadForm ? t('equipmentMedia.cancel') : t('equipmentMedia.upload')}
            </Button>
          )}
        </div>
      </div>

      <EquipmentMediaFiltersBar
        filters={media.filters}
        activeFilterCount={media.activeFilterCount}
        onSearchChange={media.setSearch}
        onSourceChange={media.setSource}
        onUploaderChange={media.setUploader}
        onDateFromChange={media.setDateFrom}
        onDateToChange={media.setDateTo}
        onSortChange={media.setSort}
        onClear={media.clearFilters}
      />

      {showUploadForm && (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="space-y-1">
            <Label htmlFor="media-upload-note" className="text-xs">
              {t('equipmentMedia.optionalNote')}
            </Label>
            <Input
              id="media-upload-note"
              value={optionalNote}
              onChange={(e) => setOptionalNote(e.target.value)}
              placeholder={t('equipmentMedia.notePlaceholder')}
              className="h-8"
            />
          </div>
          <ImageUploadWithNote
            onUpload={async (files) => {
              await uploadImagesMutation.mutateAsync(files);
            }}
            disabled={uploadImagesMutation.isPending}
          />
        </div>
      )}

      <ImageGallery
        images={media.filteredImages}
        onDelete={handleDeleteImage}
        onSetDisplayImage={async (imageUrl) => {
          await setDisplayImageMutation.mutateAsync(imageUrl);
        }}
        canDelete={canDeleteImage}
        canSetDisplayImage={permissions.canSetDisplayImage}
        currentDisplayImage={activeDisplayImage}
        title=""
        emptyMessage={
          media.hasActiveFilters
            ? t('equipmentMedia.noMediaMatchFilters')
            : t('equipmentMedia.noImages')
        }
      />

      <EquipmentMediaExplorer
        open={explorerOpen}
        onOpenChange={setExplorerOpen}
        equipmentName={resolvedEquipmentName}
        images={media.images}
        filteredImages={media.filteredImages}
        filters={media.filters}
        activeFilterCount={media.activeFilterCount}
        isLoading={media.isLoading}
        currentDisplayImage={activeDisplayImage}
        canSetDisplayImage={permissions.canSetDisplayImage}
        onSearchChange={media.setSearch}
        onSourceChange={media.setSource}
        onUploaderChange={media.setUploader}
        onDateFromChange={media.setDateFrom}
        onDateToChange={media.setDateTo}
        onSortChange={media.setSort}
        onClearFilters={media.clearFilters}
        onSetDisplayImage={async (imageUrl) => {
          await setDisplayImageMutation.mutateAsync(imageUrl);
        }}
      />
    </div>
  );
};

export default EquipmentImagesTab;
