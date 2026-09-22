import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Star, StarOff } from 'lucide-react';
import DynamicImageViewport from '@/components/common/DynamicImageViewport';
import ImageLightboxDialog from '@/components/common/ImageLightboxDialog';
import { toast } from 'sonner';
import { useI18n } from '@/i18n';
import {
  formatFinalAuditCopy,
  getFinalHardcodedAuditCopy,
} from '@/i18n/finalHardcodedAuditCopy';
import { isEquipmentDisplayImage } from '@/features/equipment/utils/equipmentMediaFilters';

export interface ImageData {
  id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  description?: string;
  created_at: string;
  uploaded_by_name?: string;
  uploaded_by: string;
  note_content?: string;
  note_author_name?: string;
}

// Generic over the concrete image record shape so callers with a richer
// projection (e.g. EquipmentImageData, which adds source_type/source_id)
// can pass their own `canDelete`/`onDelete` callbacks typed against that
// richer shape instead of casting down to this component's minimal
// `ImageData`. The only real caller today is EquipmentImagesTab.
interface ImageGalleryProps<T extends ImageData = ImageData> {
  images: T[];
  onDelete?: (imageId: string) => Promise<void>;
  onSetDisplayImage?: (imageUrl: string) => Promise<void>;
  canDelete?: (image: T) => boolean;
  canSetDisplayImage?: boolean;
  currentDisplayImage?: string;
  title?: string;
  emptyMessage?: string;
}

const ImageGallery = <T extends ImageData = ImageData>({
  images,
  onDelete,
  onSetDisplayImage,
  canDelete,
  canSetDisplayImage = false,
  currentDisplayImage,
  title,
  emptyMessage,
}: ImageGalleryProps<T>) => {
  const { language } = useI18n();
  const copy = getFinalHardcodedAuditCopy(language);
  const resolvedTitle = title ?? copy.images;
  const resolvedEmptyMessage = emptyMessage ?? copy.noImages;
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSettingDisplay, setIsSettingDisplay] = useState<string | null>(null);

  const handleDelete = async (image: ImageData) => {
    if (!onDelete) return;
    setIsDeleting(image.id);
    try {
      await onDelete(image.id);
      toast.success(copy.imageDeleted);
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast.error(copy.imageDeleteFailed);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSetDisplayImage = async (image: ImageData) => {
    if (!onSetDisplayImage) return;
    setIsSettingDisplay(image.id);
    try {
      await onSetDisplayImage(image.file_url);
      toast.success(copy.displayImageUpdated);
    } catch (error) {
      console.error('Failed to set display image:', error);
      toast.error(copy.displayImageUpdateFailed);
    } finally {
      setIsSettingDisplay(null);
    }
  };

  const handleRemoveDisplayImage = async () => {
    if (!onSetDisplayImage) return;
    try {
      await onSetDisplayImage('');
      toast.success(copy.displayImageRemoved);
    } catch (error) {
      console.error('Failed to remove display image:', error);
      toast.error(copy.displayImageRemoveFailed);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / 1024 / 1024;
    return mb > 1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`;
  };

  const handleImagePreviewKeyDown = (e: React.KeyboardEvent<HTMLElement>, image: ImageData) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedImage(image);
    }
  };

  if (images.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-lg">{resolvedTitle}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground text-center py-8">{resolvedEmptyMessage}</p></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            {resolvedTitle}
            <Badge variant="secondary">{images.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                  <button
                    type="button"
                    className="block h-full w-full border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setSelectedImage(image)}
                    onKeyDown={(e) => handleImagePreviewKeyDown(e, image)}
                    aria-label={formatFinalAuditCopy(copy.openImage, { name: image.file_name })}
                  >
                    <DynamicImageViewport src={image.file_url} alt={image.file_name} fileName={image.file_name} className="aspect-square h-full w-full rounded-lg" showControls={false} />
                  </button>

                  {isEquipmentDisplayImage(image, currentDisplayImage) && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-warning text-warning-foreground text-xs"><Star className="h-3 w-3 mr-1" />{copy.display}</Badge>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity space-y-1">
                    <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => setSelectedImage(image)} aria-label={formatFinalAuditCopy(copy.viewImage, { name: image.file_name })}><Eye className="h-4 w-4" /></Button>
                    {canSetDisplayImage && !isEquipmentDisplayImage(image, currentDisplayImage) && (
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => handleSetDisplayImage(image)} disabled={isSettingDisplay === image.id} aria-label={formatFinalAuditCopy(copy.setDisplayImage, { name: image.file_name })}><Star className="h-4 w-4" /></Button>
                    )}
                    {canSetDisplayImage && isEquipmentDisplayImage(image, currentDisplayImage) && (
                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={handleRemoveDisplayImage} disabled={isSettingDisplay === image.id} aria-label={formatFinalAuditCopy(copy.removeDisplayImage, { name: image.file_name })}><StarOff className="h-4 w-4" /></Button>
                    )}
                    {onDelete && canDelete?.(image) && (
                      <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={() => handleDelete(image)} disabled={isDeleting === image.id} aria-label={formatFinalAuditCopy(copy.deleteImage, { name: image.file_name })}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium truncate">{image.file_name}</p>
                  {image.file_size && <p className="text-xs text-muted-foreground">{formatFileSize(image.file_size)}</p>}
                  {image.note_content && <p className="text-xs text-muted-foreground line-clamp-2">{image.note_content}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ImageLightboxDialog
        open={selectedImage !== null}
        onOpenChange={(open) => { if (!open) setSelectedImage(null); }}
        image={selectedImage ? { src: selectedImage.file_url, alt: selectedImage.file_name, fileName: selectedImage.file_name } : null}
      />
    </>
  );
};

export default ImageGallery;
