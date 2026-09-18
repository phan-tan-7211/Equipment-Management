import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCreateSignedUrl,
  mockCreateSignedUrls,
  mockFrom,
  mockGetPublicUrl,
  mockRemove,
  mockUpload,
} = vi.hoisted(() => ({
  mockCreateSignedUrl: vi.fn(),
  mockCreateSignedUrls: vi.fn(),
  mockFrom: vi.fn(),
  mockGetPublicUrl: vi.fn(),
  mockRemove: vi.fn(),
  mockUpload: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: mockFrom,
    },
  },
}));

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}));

import imageCompression from 'browser-image-compression';

import {
  createCanonicalDisplayImageRef,
  createDisplayImagePath,
  createDisplayImageSetId,
  getDisplayImageObjectPath,
  removeDisplayImageSet,
  uploadDisplayImageSet,
  getDisplayImagePublicUrl,
  getDisplayImagePublicUrls,
  isDisplayImageV2Ref,
  parseCanonicalDisplayImageRef,
  parseDisplayImageRef,
  resolveDisplayImageRef,
} from '@/services/displayImageStorageService';

const EQUIPMENT_INPUT = {
  entity: 'equipment' as const,
  organizationId: 'org-123',
  entityId: 'equipment-456',
  imageSetId: 'set-789',
};

const INVENTORY_INPUT = {
  entity: 'inventory' as const,
  organizationId: 'org-123',
  entityId: 'item-456',
  imageSetId: 'set-789',
};

function publicUrlFor(path: string): string {
  return (
    'https://example.supabase.co/storage/v1/object/public/display-images/' +
    path
  );
}

describe('displayImageStorageService', () => {
  beforeEach(() => {
    vi.mocked(imageCompression).mockReset();
    mockCreateSignedUrl.mockReset();
    mockCreateSignedUrls.mockReset();
    mockGetPublicUrl.mockReset();
    mockRemove.mockReset();
    mockUpload.mockReset();
    mockFrom.mockReset();

    mockUpload.mockResolvedValue({ data: { path: 'uploaded/path.webp' }, error: null });
    mockRemove.mockResolvedValue({ data: [], error: null });
    mockGetPublicUrl.mockImplementation((path: string) => ({
      data: { publicUrl: publicUrlFor(path) },
    }));
    mockFrom.mockImplementation(() => ({
      getPublicUrl: mockGetPublicUrl,
      createSignedUrl: mockCreateSignedUrl,
      createSignedUrls: mockCreateSignedUrls,
      remove: mockRemove,
      upload: mockUpload,
    }));
  });

  it('generates the immutable equipment and inventory object paths', () => {
    expect(
      createDisplayImagePath({
        ...EQUIPMENT_INPUT,
        variant: 'thumb',
      }),
    ).toBe('org/org-123/equipment/equipment-456/set-789/thumb.webp');

    expect(
      createDisplayImagePath(
        'inventory',
        INVENTORY_INPUT.organizationId,
        INVENTORY_INPUT.entityId,
        INVENTORY_INPUT.imageSetId,
        'preview',
      ),
    ).toBe('org/org-123/inventory/item-456/set-789/preview.webp');

    expect(
      createDisplayImagePath({
        ...INVENTORY_INPUT,
        variant: 'full',
      }),
    ).toBe('org/org-123/inventory/item-456/set-789/full.webp');
  });

  it('creates an image-set ID with crypto.randomUUID', () => {
    const randomUUID = vi.fn(() => 'image-set-uuid');
    vi.stubGlobal('crypto', { randomUUID });

    expect(createDisplayImageSetId()).toBe('image-set-uuid');
    expect(randomUUID).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });

  it('stores and parses a canonical full.webp reference', () => {
    const canonicalRef = createCanonicalDisplayImageRef(EQUIPMENT_INPUT);

    expect(canonicalRef).toBe(
      'display-images/org/org-123/equipment/equipment-456/set-789/full.webp',
    );

    expect(parseCanonicalDisplayImageRef(canonicalRef)).toMatchObject({
      canonicalRef,
      objectPath:
        'org/org-123/equipment/equipment-456/set-789/full.webp',
      organizationId: 'org-123',
      entity: 'equipment',
      entityId: 'equipment-456',
      imageSetId: 'set-789',
      variant: 'full',
    });
  });

  it('derives sibling paths from a canonical ref', () => {
    const canonicalRef = createCanonicalDisplayImageRef(INVENTORY_INPUT);

    expect(getDisplayImageObjectPath(canonicalRef, 'thumb')).toBe(
      'org/org-123/inventory/item-456/set-789/thumb.webp',
    );
    expect(getDisplayImageObjectPath(canonicalRef, 'preview')).toBe(
      'org/org-123/inventory/item-456/set-789/preview.webp',
    );
    expect(getDisplayImageObjectPath(canonicalRef, 'full')).toBe(
      'org/org-123/inventory/item-456/set-789/full.webp',
    );
  });

  it('parses public URLs and derives all three public URLs without signing', () => {
    const canonicalRef = createCanonicalDisplayImageRef(EQUIPMENT_INPUT);
    const publicRef = publicUrlFor(
      'org/org-123/equipment/equipment-456/set-789/full.webp',
    );

    expect(parseDisplayImageRef(publicRef)).toMatchObject({
      canonicalRef,
      variant: 'full',
    });
    expect(isDisplayImageV2Ref(publicRef)).toBe(true);

    expect(getDisplayImagePublicUrls(canonicalRef)).toEqual({
      thumb: publicUrlFor(
        'org/org-123/equipment/equipment-456/set-789/thumb.webp',
      ),
      preview: publicUrlFor(
        'org/org-123/equipment/equipment-456/set-789/preview.webp',
      ),
      full: publicUrlFor(
        'org/org-123/equipment/equipment-456/set-789/full.webp',
      ),
    });
    expect(mockGetPublicUrl).toHaveBeenCalledTimes(3);
    expect(mockCreateSignedUrl).not.toHaveBeenCalled();
    expect(mockCreateSignedUrls).not.toHaveBeenCalled();
  });

  it('never sends a V2 ref to the legacy resolver', async () => {
    const canonicalRef = createCanonicalDisplayImageRef(EQUIPMENT_INPUT);
    const legacyResolver = vi.fn().mockResolvedValue('legacy-signed-url');

    const resolved = await resolveDisplayImageRef(
      canonicalRef,
      'thumb',
      legacyResolver,
    );

    expect(resolved).toBe(
      publicUrlFor(
        'org/org-123/equipment/equipment-456/set-789/thumb.webp',
      ),
    );
    expect(legacyResolver).not.toHaveBeenCalled();
    expect(mockCreateSignedUrl).not.toHaveBeenCalled();
    expect(mockCreateSignedUrls).not.toHaveBeenCalled();
  });

  it('keeps legacy refs on the injected existing-resolution path', async () => {
    const legacyResolver = vi.fn().mockResolvedValue('legacy-signed-url');

    await expect(
      resolveDisplayImageRef('legacy/private/path.jpg', 'preview', legacyResolver),
    ).resolves.toBe('legacy-signed-url');

    expect(legacyResolver).toHaveBeenCalledWith(
      'legacy/private/path.jpg',
      'preview',
    );
  });

  it('rejects unsafe path segments before building a ref', () => {
    expect(() =>
      createDisplayImagePath({
        ...EQUIPMENT_INPUT,
        organizationId: '../other-org',
        variant: 'full',
      }),
    ).toThrow('organizationId must be a non-empty path segment');
  });

  it('uploads all immutable WebP variants with cacheable non-upsert options', async () => {
    const randomUUID = vi.fn(() => 'generated-set');
    vi.stubGlobal('crypto', { randomUUID });
    vi.mocked(imageCompression).mockImplementation(async () =>
      new Blob(['webp'], { type: 'image/webp' }),
    );

    const source = {
      size: 1,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      name: 'source.jpg',
      type: 'image/jpeg',
      lastModified: 123,
    } as File;

    try {
      const uploaded = await uploadDisplayImageSet({
        entity: EQUIPMENT_INPUT.entity,
        organizationId: EQUIPMENT_INPUT.organizationId,
        entityId: EQUIPMENT_INPUT.entityId,
        source,
      });

      expect(uploaded).toEqual({
        imageSetId: 'generated-set',
        canonicalRef:
          'display-images/org/org-123/equipment/equipment-456/generated-set/full.webp',
        objectPaths: {
          thumb: 'org/org-123/equipment/equipment-456/generated-set/thumb.webp',
          preview: 'org/org-123/equipment/equipment-456/generated-set/preview.webp',
          full: 'org/org-123/equipment/equipment-456/generated-set/full.webp',
        },
      });
      expect(mockUpload).toHaveBeenCalledTimes(3);
      expect(mockUpload.mock.calls.map((call) => call[0])).toEqual([
        'org/org-123/equipment/equipment-456/generated-set/thumb.webp',
        'org/org-123/equipment/equipment-456/generated-set/preview.webp',
        'org/org-123/equipment/equipment-456/generated-set/full.webp',
      ]);
      for (const call of mockUpload.mock.calls) {
        expect(call[1]).toBeInstanceOf(File);
        expect(call[2]).toEqual({
          upsert: false,
          cacheControl: '31536000',
          contentType: 'image/webp',
        });
      }
      expect(mockCreateSignedUrl).not.toHaveBeenCalled();
      expect(mockCreateSignedUrls).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('cleans confirmed variants when the next upload fails', async () => {
    vi.mocked(imageCompression).mockImplementation(async () =>
      new Blob(['webp'], { type: 'image/webp' }),
    );
    const source = {
      size: 1,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      name: 'source.jpg',
      type: 'image/jpeg',
      lastModified: 123,
    } as File;
    mockUpload
      .mockResolvedValueOnce({ data: { path: 'thumb.webp' }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: new Error('preview unavailable'),
      });

    await expect(
      uploadDisplayImageSet({
        ...EQUIPMENT_INPUT,
        source,
      }),
    ).rejects.toMatchObject({
      name: 'DisplayImageUploadError',
      variant: 'preview',
    });

    expect(mockRemove).toHaveBeenCalledWith([
      'org/org-123/equipment/equipment-456/set-789/thumb.webp',
    ]);
  });

  it('cleans the full partial set when the final variant fails', async () => {
    vi.mocked(imageCompression).mockImplementation(async () =>
      new Blob(['webp'], { type: 'image/webp' }),
    );
    const source = {
      size: 1,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      name: 'source.jpg',
      type: 'image/jpeg',
      lastModified: 123,
    } as File;
    mockUpload
      .mockResolvedValueOnce({ data: { path: 'thumb.webp' }, error: null })
      .mockResolvedValueOnce({ data: { path: 'preview.webp' }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: new Error('full unavailable'),
      });

    await expect(
      uploadDisplayImageSet({
        ...EQUIPMENT_INPUT,
        source,
      }),
    ).rejects.toMatchObject({
      name: 'DisplayImageUploadError',
      variant: 'full',
    });

    expect(mockRemove).toHaveBeenCalledWith([
      'org/org-123/equipment/equipment-456/set-789/thumb.webp',
      'org/org-123/equipment/equipment-456/set-789/preview.webp',
    ]);
  });

  it('removes all variants for a valid V2 display image reference', async () => {
    const canonicalRef = createCanonicalDisplayImageRef(EQUIPMENT_INPUT);

    await expect(removeDisplayImageSet(canonicalRef)).resolves.toBe(true);

    expect(mockRemove).toHaveBeenCalledWith([
      'org/org-123/equipment/equipment-456/set-789/thumb.webp',
      'org/org-123/equipment/equipment-456/set-789/preview.webp',
      'org/org-123/equipment/equipment-456/set-789/full.webp',
    ]);
  });
});
