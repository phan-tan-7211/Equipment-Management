import { Camera, CameraResultType, CameraSource, type Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export function isNativeAndroidImageRuntime(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

function isCancelled(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /cancel|canceled|cancelled|user cancelled|user canceled/i.test(message);
}

function extensionFor(photo: Pick<Photo, 'format'>, blob: Blob): string {
  const format = photo.format?.toLowerCase();
  if (format === 'jpg') return 'jpg';
  if (format === 'jpeg') return 'jpg';
  if (format === 'png') return 'png';
  if (format === 'gif') return 'gif';
  if (format === 'webp') return 'webp';

  const subtype = blob.type.split('/')[1]?.toLowerCase();
  if (subtype === 'jpeg') return 'jpg';
  return subtype || 'jpg';
}

async function photoToFile(photo: Photo, stem: string): Promise<File> {
  const source = photo.webPath ?? (photo.path ? Capacitor.convertFileSrc(photo.path) : undefined);
  if (!source) throw new Error('Android did not return an image path.');

  const response = await fetch(source);
  if (!response.ok) throw new Error('Could not read the selected image.');
  const blob = await response.blob();
  const extension = extensionFor(photo, blob);
  const mime = blob.type || (extension === 'jpg' ? 'image/jpeg' : `image/${extension}`);
  return new File([blob], `${stem}-${Date.now()}.${extension}`, { type: mime });
}

export async function takeNativeAndroidPhoto(stem = 'equipqr-photo'): Promise<File | null> {
  if (!isNativeAndroidImageRuntime()) return null;

  try {
    const photo = await Camera.getPhoto({
      source: CameraSource.Camera,
      resultType: CameraResultType.Uri,
      quality: 90,
      allowEditing: false,
      correctOrientation: true,
      saveToGallery: false,
    });
    return await photoToFile(photo, stem);
  } catch (error) {
    if (isCancelled(error)) return null;
    throw error;
  }
}

export async function pickNativeAndroidPhotos(
  limit = 5,
  stem = 'equipqr-photo',
): Promise<File[]> {
  if (!isNativeAndroidImageRuntime()) return [];

  try {
    const result = await Camera.pickImages({
      quality: 90,
      limit: Math.max(1, limit),
    });

    const files: File[] = [];
    for (const [index, photo] of result.photos.entries()) {
      files.push(await photoToFile(photo, `${stem}-${index + 1}`));
    }
    return files;
  } catch (error) {
    if (isCancelled(error)) return [];
    throw error;
  }
}
