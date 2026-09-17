import { createEquipmentNoteWithImages } from './equipmentNotesService';
import type { EquipmentImageData } from './equipmentImagesService';
import { getEquipmentDisplayImageUrl } from '@/services/imageUploadService';
import { equipmentMediaPathsMatch } from '@/features/equipment/utils/equipmentMediaFilters';
import { isDisplayImageV2Ref } from '@/services/displayImageStorageService';

interface PersistCurrentEquipmentDisplayImageInput {
  equipmentId: string;
  organizationId: string;
  currentDisplayImage?: string | null;
  images: EquipmentImageData[];
  userName: string;
  equipmentName?: string;
}

function hasPersistedDisplayMedia(
  images: EquipmentImageData[],
  currentDisplayImage: string,
): boolean {
  return images.some((image) => {
    const persistedRef = image.description?.startsWith('display-image:')
      ? image.description.slice('display-image:'.length)
      : null;
    return Boolean(persistedRef && equipmentMediaPathsMatch(persistedRef, currentDisplayImage));
  });
}

function createDisplayMediaFile(blob: Blob, equipmentName?: string): File {
  const safeName = equipmentName?.trim().replace(/[^a-zA-Z0-9._-]+/g, '-') || 'equipment';
  const contentType = blob.type || 'image/webp';
  return new File([blob], `${safeName}-display.webp`, { type: contentType });
}

/**
 * Older V2 display uploads were represented only by equipment.image_url and a
 * synthetic gallery card. Materialize that card before changing the display
 * reference so the previous image remains reusable after the switch.
 */
export async function persistCurrentEquipmentDisplayImageIfNeeded(
  input: PersistCurrentEquipmentDisplayImageInput,
): Promise<void> {
  const currentDisplayImage = input.currentDisplayImage?.trim();
  if (!currentDisplayImage || !isDisplayImageV2Ref(currentDisplayImage)) return;
  if (hasPersistedDisplayMedia(input.images, currentDisplayImage)) return;

  const sourceUrl =
    input.images.find((image) => image.id === `equipment-display:${currentDisplayImage}`)?.file_url ||
    getEquipmentDisplayImageUrl(currentDisplayImage, 'full');
  if (!sourceUrl) {
    throw new Error('Could not resolve the previous Equipment display image for media preservation.');
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Could not download the previous Equipment display image (${response.status}).`);
  }

  const source = createDisplayMediaFile(await response.blob(), input.equipmentName);
  await createEquipmentNoteWithImages(
    input.equipmentId,
    `${input.userName} preserved a previous display image`,
    0,
    false,
    [source],
    input.organizationId,
    null,
    `display-image:${currentDisplayImage}`,
  );
}
