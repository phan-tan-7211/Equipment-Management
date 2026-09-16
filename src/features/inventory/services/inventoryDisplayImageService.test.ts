import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockParseDisplayImageRef,
  mockRemoveDisplayImageSet,
  mockUploadDisplayImageSet,
  mockLoggerWarn,
} = vi.hoisted(() => ({
  mockParseDisplayImageRef: vi.fn(),
  mockRemoveDisplayImageSet: vi.fn(),
  mockUploadDisplayImageSet: vi.fn(),
  mockLoggerWarn: vi.fn(),
}));

vi.mock('@/services/displayImageStorageService', () => ({
  createCanonicalDisplayImageRef: (input: {
    organizationId: string;
    entity: string;
    entityId: string;
    imageSetId: string;
  }) =>
    `display-images/org/${input.organizationId}/${input.entity}/${input.entityId}/${input.imageSetId}/full.webp`,
  createDisplayImageSetId: vi.fn(() => 'generated-set'),
  parseDisplayImageRef: mockParseDisplayImageRef,
  removeDisplayImageSet: mockRemoveDisplayImageSet,
  uploadDisplayImageSet: mockUploadDisplayImageSet,
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    warn: mockLoggerWarn,
  },
}));

import {
  removeInventoryDisplayImageSet,
  uploadInventoryDisplayImage,
} from './inventoryDisplayImageService';

const CANONICAL_REF =
  'display-images/org/org-1/inventory/item-1/set-1/full.webp';

function parsedRef(canonicalRef: string) {
  return {
    canonicalRef,
    objectPath: 'org/org-1/inventory/item-1/set-1/full.webp',
    organizationId: 'org-1',
    entity: 'inventory' as const,
    entityId: 'item-1',
    imageSetId: 'set-1',
    variant: 'full' as const,
  };
}

describe('inventoryDisplayImageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParseDisplayImageRef.mockImplementation((stored: string) =>
      stored === CANONICAL_REF ? parsedRef(CANONICAL_REF) : null,
    );
    mockRemoveDisplayImageSet.mockResolvedValue(true);
    mockUploadDisplayImageSet.mockResolvedValue({
      imageSetId: 'set-1',
      canonicalRef: CANONICAL_REF,
      objectPaths: {
        thumb: 'org/org-1/inventory/item-1/set-1/thumb.webp',
        preview: 'org/org-1/inventory/item-1/set-1/preview.webp',
        full: 'org/org-1/inventory/item-1/set-1/full.webp',
      },
    });
  });

  it('uploads each image as an Inventory V2 set', async () => {
    const source = {} as File;

    await uploadInventoryDisplayImage({
      organizationId: 'org-1',
      inventoryItemId: 'item-1',
      imageSetId: 'set-1',
      source,
    });

    expect(mockUploadDisplayImageSet).toHaveBeenCalledWith({
      entity: 'inventory',
      organizationId: 'org-1',
      entityId: 'item-1',
      imageSetId: 'set-1',
      source,
    });
    expect(mockRemoveDisplayImageSet).not.toHaveBeenCalled();
  });

  it('removes a partial set when a variant upload fails', async () => {
    mockUploadDisplayImageSet.mockRejectedValueOnce(new Error('preview failed'));

    await expect(
      uploadInventoryDisplayImage({
        organizationId: 'org-1',
        inventoryItemId: 'item-1',
        imageSetId: 'set-1',
        source: {} as File,
      }),
    ).rejects.toThrow('preview failed');

    expect(mockRemoveDisplayImageSet).toHaveBeenCalledWith(CANONICAL_REF);
  });

  it('removes only a matching Inventory set', async () => {
    await expect(
      removeInventoryDisplayImageSet('org-1', 'item-1', CANONICAL_REF),
    ).resolves.toBe(true);
    expect(mockRemoveDisplayImageSet).toHaveBeenCalledWith(CANONICAL_REF);

    mockParseDisplayImageRef.mockReturnValueOnce({
      ...parsedRef(CANONICAL_REF),
      organizationId: 'other-org',
    });
    await expect(
      removeInventoryDisplayImageSet('org-1', 'item-1', CANONICAL_REF),
    ).resolves.toBe(false);
    expect(mockRemoveDisplayImageSet).toHaveBeenCalledTimes(1);
  });
});
