import {
  createDisplayImageSetId,
  parseDisplayImageRef,
  removeDisplayImageSet,
  uploadDisplayImageSet,
  type UploadedDisplayImageSet,
} from '@/services/displayImageStorageService';

export interface UploadInventoryDisplayImageInput {
  organizationId: string;
  inventoryItemId: string;
  source: File;
  imageSetId?: string;
}

/**
 * Upload one Inventory image through the shared immutable V2 pipeline.
 *
 * A caller-provided imageSetId is useful for retry-safe workflows and tests;
 * normal uploads receive a fresh set id per source image.
 */
export async function uploadInventoryDisplayImage(
  input: UploadInventoryDisplayImageInput,
): Promise<UploadedDisplayImageSet> {
  const imageSetId = input.imageSetId ?? createDisplayImageSetId();

  // The shared uploader cleans only the variants it confirmed as newly
  // uploaded. Keeping that transaction boundary in one place also makes
  // retry-safe, caller-supplied imageSetIds safe for every entity.
  return uploadDisplayImageSet({
    entity: 'inventory',
    organizationId: input.organizationId,
    entityId: input.inventoryItemId,
    imageSetId,
    source: input.source,
  });
}

/**
 * Remove all variants for an Inventory image set after its metadata is gone.
 * The identity checks prevent a caller from deleting another entity's set.
 */
export async function removeInventoryDisplayImageSet(
  organizationId: string,
  inventoryItemId: string,
  storedRef: string | null | undefined,
): Promise<boolean> {
  if (!storedRef?.trim()) return false;

  const parsed = parseDisplayImageRef(storedRef.trim());
  if (
    !parsed ||
    parsed.entity !== 'inventory' ||
    parsed.organizationId !== organizationId ||
    parsed.entityId !== inventoryItemId
  ) {
    return false;
  }

  return removeDisplayImageSet(parsed.canonicalRef);
}
