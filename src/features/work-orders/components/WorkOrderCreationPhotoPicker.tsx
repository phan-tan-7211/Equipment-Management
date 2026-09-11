import React, { useId, useRef, useState } from 'react';
import { useFileObjectUrlPreview } from '@/components/common/useFileObjectUrlPreview';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, Image, X } from 'lucide-react';
import { toast } from 'sonner';
import { validateAndAppendWorkOrderCreationImages } from '@/features/work-orders/utils/workOrderCreationImages';
import {
  isNativeAndroidImageRuntime,
  pickNativeAndroidPhotos,
  takeNativeAndroidPhoto,
} from '@/services/nativeImagePicker';

const Thumbnail: React.FC<{
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}> = ({ file, onRemove, disabled }) => {
  const previewUrl = useFileObjectUrlPreview(file);

  if (!previewUrl) return null;

  return (
    <div className="group relative shrink-0">
      <div className="relative h-16 w-16 overflow-hidden rounded-md border border-input bg-muted">
        <img src={previewUrl} alt={file.name} className="h-full w-full object-cover" />
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onRemove}
          disabled={disabled}
          className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0"
          title="Remove image"
          aria-label={`Remove ${file.name}`}
        >
          <X className="h-3 w-3" aria-hidden />
        </Button>
      </div>
    </div>
  );
};

export interface WorkOrderCreationPhotoPickerProps {
  images: File[];
  onImagesChange: (files: File[]) => void;
  disabled?: boolean;
  /** Brief helper shown under the label */
  description?: string;
}

/** Shared creation-time photo picker (QR flow, full form, request form). */
const WorkOrderCreationPhotoPicker: React.FC<WorkOrderCreationPhotoPickerProps> = ({
  images,
  onImagesChange,
  disabled = false,
  description = 'JPEG, PNG, GIF, or WebP — up to 5 images, 10 MB each.',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [nativeBusy, setNativeBusy] = useState(false);
  const generatedId = useId();
  const inputId = `${generatedId}-work-order-creation-photos`;
  const cameraInputId = `${inputId}-camera`;
  const hintId = `${inputId}-hint`;
  const nativeAndroid = isNativeAndroidImageRuntime();

  const appendPickedFiles = (picked: File[]) => {
    const next = validateAndAppendWorkOrderCreationImages(images, picked);
    onImagesChange(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    appendPickedFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleCameraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    appendPickedFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleAddPhotos = async () => {
    if (!nativeAndroid) {
      inputRef.current?.click();
      return;
    }

    setNativeBusy(true);
    try {
      const picked = await pickNativeAndroidPhotos(Math.max(1, 5 - images.length), 'work-order');
      if (picked.length > 0) appendPickedFiles(picked);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not open Android photo picker.');
    } finally {
      setNativeBusy(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!nativeAndroid) {
      cameraInputRef.current?.click();
      return;
    }

    setNativeBusy(true);
    try {
      const photo = await takeNativeAndroidPhoto('work-order');
      if (photo) appendPickedFiles([photo]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not open Android camera.');
    } finally {
      setNativeBusy(false);
    }
  };

  const controlsDisabled = disabled || nativeBusy || images.length >= 5;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={inputId}>Attach photos from this request</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={controlsDisabled}
            onClick={() => void handleTakePhoto()}
          >
            <Camera className="h-4 w-4" aria-hidden />
            Take photo
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            disabled={controlsDisabled}
            onClick={() => void handleAddPhotos()}
          >
            <Image className="h-4 w-4" aria-hidden />
            Add photos
          </Button>
        </div>
      </div>
      <p id={hintId} className="text-xs text-muted-foreground">
        {description}
      </p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="sr-only"
        aria-describedby={hintId}
        disabled={disabled}
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        id={cameraInputId}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-describedby={hintId}
        disabled={disabled}
        onChange={handleCameraFileChange}
      />
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {images.map((file, index) => (
            <Thumbnail
              key={`${file.name}-${file.size}-${index}`}
              file={file}
              disabled={disabled}
              onRemove={() => {
                const next = images.filter((_, i) => i !== index);
                onImagesChange(next);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default WorkOrderCreationPhotoPicker;
