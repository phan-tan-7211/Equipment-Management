import { supabase } from '@/integrations/supabase/client';

const thumbnailCacheVersions = new Map<string, number>();

function thumbnailVersionKey(organizationId: string, itemId: string): string {
  return `${organizationId}:${itemId}`;
}

/** Return the current generation for one item's cached list thumbnail. */
export function getInventoryThumbnailCacheVersion(
  organizationId: string,
  itemId: string,
): number {
  return thumbnailCacheVersions.get(thumbnailVersionKey(organizationId, itemId)) ?? 0;
}

/** Invalidate a list thumbnail after its image metadata changes. */
export function clearInventoryItemThumbnailCache(
  organizationId: string,
  itemId: string,
): void {
  const key = thumbnailVersionKey(organizationId, itemId);
  thumbnailCacheVersions.set(key, getInventoryThumbnailCacheVersion(organizationId, itemId) + 1);
}

/**
 * Fetch one canonical display-image reference for each inventory item.
 *
 * Inventory items can have up to five rows in inventory_item_images. The oldest
 * uploaded image is the stable list thumbnail. Callers can fall back to the
 * legacy inventory_items.image_url field when an item has no image rows.
 */
export async function getPrimaryInventoryItemImageRefs(
  organizationId: string,
  itemIds: string[],
): Promise<Record<string, string>> {
  const uniqueItemIds = [...new Set(itemIds.filter(Boolean))];
  if (uniqueItemIds.length === 0) return {};

  const { data, error } = await supabase
    .from('inventory_item_images')
    .select('inventory_item_id, file_url, created_at')
    .eq('organization_id', organizationId)
    .in('inventory_item_id', uniqueItemIds)
    .order('created_at', { ascending: true });

  if (error) throw error;

  const primaryRefs: Record<string, string> = {};
  for (const row of data ?? []) {
    if (!primaryRefs[row.inventory_item_id] && row.file_url?.trim()) {
      primaryRefs[row.inventory_item_id] = row.file_url;
    }
  }

  return primaryRefs;
}

