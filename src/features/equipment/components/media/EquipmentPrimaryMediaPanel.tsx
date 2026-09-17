import React, { useMemo } from 'react';
import type { EquipmentImageData } from '@/features/equipment/services/equipmentImagesService';
import { getEquipmentDisplayImageUrl } from '@/services/imageUploadService';
import { isDisplayImageV2Ref } from '@/services/displayImageStorageService';
import { EquipmentMediaCarousel } from '@/features/equipment/components/media/EquipmentMediaCarousel';
import { useEquipmentMediaLibrary } from '@/features/equipment/hooks/useEquipmentMediaLibrary';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';

interface EquipmentPrimaryMediaPanelProps {
  equipmentId: string;
  organizationId: string;
  equipmentName: string;
  currentDisplayImage?: string | null;
  className?: string;
  emptyClassName?: string;
  /** When false, skip the media query (e.g. missing ids). */
  enabled?: boolean;
  /** Inline style for shared-element view transitions (applied to the media root). */
  mediaStyle?: React.CSSProperties;
}

/**
 * Fetches equipment media and renders the display-first chronological carousel
 * used on equipment details and work order equipment panels.
 */
export function EquipmentPrimaryMediaPanel({
  equipmentId,
  organizationId,
  equipmentName,
  currentDisplayImage,
  className,
  emptyClassName,
  enabled = true,
  mediaStyle,
}: EquipmentPrimaryMediaPanelProps) {
  const { t } = useI18n();
  const { displayOrderedImages, isLoading } = useEquipmentMediaLibrary({
    equipmentId,
    organizationId,
    currentDisplayImage,
    enabled: enabled && !!equipmentId && !!organizationId,
  });

  const v2DisplayImage = useMemo<EquipmentImageData | null>(() => {
    if (!currentDisplayImage || !isDisplayImageV2Ref(currentDisplayImage)) {
      return null;
    }

    const fileUrl = getEquipmentDisplayImageUrl(currentDisplayImage, 'full');
    if (!fileUrl) return null;

    return {
      id: 'display-image-v2:' + equipmentId,
      file_name: equipmentName + ' display.webp',
      file_url: fileUrl,
      created_at: '1970-01-01T00:00:00.000Z',
      uploaded_by: 'display-image-v2',
      source_type: 'equipment_note',
    };
  }, [currentDisplayImage, equipmentId, equipmentName]);

  const carouselImages = useMemo(
    () => {
      if (!v2DisplayImage) return displayOrderedImages;
      return [
        v2DisplayImage,
        ...displayOrderedImages.filter(
          (image) => image.file_url !== v2DisplayImage.file_url,
        ),
      ];
    },
    [displayOrderedImages, v2DisplayImage],
  );

  if (isLoading) {
    return (
      <div
        className={cn('animate-pulse rounded-lg bg-muted', emptyClassName ?? 'h-64', className)}
        style={mediaStyle}
        aria-busy="true"
        aria-label={t('equipmentResidual.loadingPhotos', { name: equipmentName })}
      />
    );
  }

  return (
    <div style={mediaStyle}>
      <EquipmentMediaCarousel
        images={carouselImages}
        equipmentName={equipmentName}
        className={className}
        emptyClassName={emptyClassName}
      />
    </div>
  );
}
