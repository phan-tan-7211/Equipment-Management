import { logger } from '@/utils/logger';
import {
  createCanonicalDisplayImageRef,
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
  const canonicalRef = createCanonicalDisplayImageRef({
    organizationId: input.organizationId,
    entity: 'inventory',
    entityId: input.inventoryItemId,
    imageSetId,
  });

  try {
    return await uploadDisplayImageSet({
      entity: 'inventory',
      organizationId: input.organizationId,
      entityId: input.inventoryItemId,
      imageSetId,
      source: input.source,
    });
  } catch (error) {
    // The shared uploader may have written one or two variants before a later
    // variant failed. Removing the whole deterministic set is idempotent and
    // prevents a partial upload from becoming an orphan.
    try {
      await removeDisplayImageSet(canonicalRef);
    } catch (cleanupError) {
      logger.warn('Failed to remove incomplete Inventory display image set', {
        canonicalRef,
        error: cleanupError,
      });
    }
    throw error;
  }
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
