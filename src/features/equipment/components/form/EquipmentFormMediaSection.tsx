import React, { useEffect, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, ImagePlus, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import type { EquipmentFormData } from '@/features/equipment/types/equipment';
import { useLocalFilePreviewUrls } from '@/hooks/useLocalFilePreviewUrls';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import {
  isNativeAndroidImageRuntime,
  pickNativeAndroidPhotos,
  takeNativeAndroidPhoto,
} from '@/services/nativeImagePicker';

export type EquipmentFormPendingMedia = {
  files: File[];
  displayIndex: number;
};

interface EquipmentFormMediaSectionProps {
  form: UseFormReturn<EquipmentFormData>;
  onPendingMediaChange: (media: EquipmentFormPendingMedia) => void;
  disabled?: boolean;
}

export function EquipmentFormMediaSection({
  form,
  onPendingMediaChange,
  disabled = false,
}: EquipmentFormMediaSectionProps) {
  const { t } = useI18n();
  const [files, setFiles] = useState<File[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [nativeBusy, setNativeBusy] = useState(false);
  const { getPreviewUrl, revokePreviewUrl } = useLocalFilePreviewUrls();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onPendingMediaChange({ files, displayIndex });
  }, [files, displayIndex, onPendingMediaChange]);

  useEffect(() => {
    if (form.getValues('image_url')) form.setValue('image_url', '');
  }, [form]);

  const addFiles = (incoming: File[]) => {
    const accepted = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const valid = incoming.filter((file) => {
      if (!accepted.includes(file.type)) {
        toast.error(t('equipmentForm.unsupportedImageFormat', { name: file.name }));
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('equipmentForm.imageTooLarge', { name: file.name }));
        return false;
      }
      return true;
    });
    setFiles((prev) => {
      const next = [...prev, ...valid].slice(0, 5);
      if (displayIndex >= next.length) setDisplayIndex(0);
      return next;
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const removed = prev[index];
      if (removed) revokePreviewUrl(removed);
      const next = prev.filter((_, i) => i !== index);
      setDisplayIndex((current) => {
        if (next.length === 0) return 0;
        if (index === current) return 0;
        if (index < current) return Math.max(0, current - 1);
        return current;
      });
      return next;
    });
  };

  const handleFromDevice = async () => {
    if (!isNativeAndroidImageRuntime()) {
      fileInputRef.current?.click();
      return;
    }

    setNativeBusy(true);
    try {
      const picked = await pickNativeAndroidPhotos(Math.max(1, 5 - files.length), 'equipment');
      if (picked.length > 0) addFiles(picked);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not open Android photo picker.');
    } finally {
      setNativeBusy(false);
    }
  };

  const handleCamera = async () => {
    if (!isNativeAndroidImageRuntime()) {
      cameraInputRef.current?.click();
      return;
    }

    setNativeBusy(true);
    try {
      const photo = await takeNativeAndroidPhoto('equipment');
      if (photo) addFiles([photo]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not open Android camera.');
    } finally {
      setNativeBusy(false);
    }
  };

  const controlsDisabled = disabled || nativeBusy || files.length >= 5;

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {t('equipmentForm.displayImage')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('equipmentForm.displayImageDescription')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={controlsDisabled}
            onClick={() => void handleFromDevice()}
          >
            <ImagePlus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {t('equipmentForm.fromDevice')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={controlsDisabled}
            onClick={() => void handleCamera()}
          >
            <Camera className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {t('equipmentForm.camera')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []));
              e.target.value = '';
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []));
              e.target.value = '';
            }}
          />
        </div>

        {files.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {files.map((file, index) => {
              const preview = getPreviewUrl(file);
              const isDisplay = index === displayIndex;
              return (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className={cn(
                    'group relative aspect-square overflow-hidden rounded-md border bg-muted',
                    isDisplay && 'ring-2 ring-primary',
                  )}
                >
                  {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : null}
                  <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-black/50 p-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-white hover:bg-white/20"
                      aria-label={isDisplay ? t('equipmentForm.selectedDisplayImage') : t('equipmentForm.setAsDisplayImage')}
                      onClick={() => setDisplayIndex(index)}
                    >
                      <Star className={cn('h-3 w-3', isDisplay && 'fill-amber-400 text-amber-400')} aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="ml-auto h-6 w-6 text-white hover:bg-white/20"
                      aria-label={t('equipmentForm.removeFile', { name: file.name })}
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </Button>
                  </div>
                  {isDisplay ? (
                    <Label className="absolute left-1 top-1 rounded bg-primary px-1 text-[9px] text-primary-foreground">
                      {t('equipmentForm.display')}
                    </Label>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t('equipmentForm.noPhotosSelected')}</p>
        )}
      </CardContent>
    </Card>
  );
}
