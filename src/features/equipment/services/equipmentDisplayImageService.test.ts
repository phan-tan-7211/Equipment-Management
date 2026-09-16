import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockFrom,
  mockRemoveDisplayImageSet,
  mockUploadDisplayImageSet,
  mockParseDisplayImageRef,
  mockLoggerWarn,
} = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRemoveDisplayImageSet: vi.fn(),
  mockUploadDisplayImageSet: vi.fn(),
  mockParseDisplayImageRef: vi.fn(),
  mockLoggerWarn: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('@/services/displayImageStorageService', () => ({
  parseDisplayImageRef: mockParseDisplayImageRef,
  removeDisplayImageSet: mockRemoveDisplayImageSet,
  uploadDisplayImageSet: mockUploadDisplayImageSet,
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    warn: mockLoggerWarn,
  },
}));

vi.mock('@/services/imageUploadService', () => ({
  extractEquipmentDisplayImagePath: vi.fn((stored: string) =>
    stored.startsWith('legacy/') ? stored : null,
  ),
}));

import {
  replaceEquipmentDisplayImage,
  setEquipmentDisplayImageRef,
} from './equipmentDisplayImageService';

const OLD_REF =
  'display-images/org/org-1/equipment/eq-1/old-set/full.webp';
const NEW_REF =
  'display-images/org/org-1/equipment/eq-1/new-set/full.webp';

function parsedRef(canonicalRef: string, imageSetId: string) {
  return {
    canonicalRef,
    objectPath:
      'org/org-1/equipment/eq-1/' + imageSetId + '/full.webp',
    organizationId: 'org-1',
    entity: 'equipment' as const,
    entityId: 'eq-1',
    imageSetId,
    variant: 'full' as const,
  };
}

function makeChain() {
  const chain: Record<string, any> = {};
  chain.select = vi.fn(() => chain);
  chain.update = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(() =>
    Promise.resolve({ data: { image_url: OLD_REF }, error: null }),
  );
  chain.then = (
    resolve: (value: unknown) => unknown,
    reject?: (reason: unknown) => unknown,
  ) => Promise.resolve({ data: null, error: null }).then(resolve, reject);
  return chain;
}

describe('equipmentDisplayImageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParseDisplayImageRef.mockImplementation((stored: string) => {
      if (stored === OLD_REF) return parsedRef(OLD_REF, 'old-set');
      if (stored === NEW_REF) return parsedRef(NEW_REF, 'new-set');
      return null;
    });
    mockUploadDisplayImageSet.mockResolvedValue({
      imageSetId: 'new-set',
      canonicalRef: NEW_REF,
      objectPaths: {
        thumb: 'org/org-1/equipment/eq-1/new-set/thumb.webp',
        preview: 'org/org-1/equipment/eq-1/new-set/preview.webp',
        full: 'org/org-1/equipment/eq-1/new-set/full.webp',
      },
    });
    mockRemoveDisplayImageSet.mockResolvedValue(true);
    mockFrom.mockImplementation(() => makeChain());
  });

  it('uploads before committing and cleans the old set after the DB update', async () => {
    const events: string[] = [];
    mockUploadDisplayImageSet.mockImplementationOnce(async (input) => {
      events.push('upload');
      expect(input).toMatchObject({
        entity: 'equipment',
        organizationId: 'org-1',
        entityId: 'eq-1',
      });
      return {
        imageSetId: 'new-set',
        canonicalRef: NEW_REF,
        objectPaths: {
          thumb: 'org/org-1/equipment/eq-1/new-set/thumb.webp',
          preview: 'org/org-1/equipment/eq-1/new-set/preview.webp',
          full: 'org/org-1/equipment/eq-1/new-set/full.webp',
        },
      };
    });
    mockFrom.mockImplementation(() => {
      const chain = makeChain();
      chain.update = vi.fn((payload: unknown) => {
        events.push('update');
        expect(payload).toEqual({ image_url: NEW_REF });
        return chain;
      });
      return chain;
    });
    mockRemoveDisplayImageSet.mockImplementationOnce(async (ref: string) => {
      events.push('remove');
      expect(ref).toBe(OLD_REF);
      return true;
    });

    const result = await replaceEquipmentDisplayImage({
      organizationId: 'org-1',
      equipmentId: 'eq-1',
      source: {} as File,
    });

    expect(result).toBe(NEW_REF);
    expect(events).toEqual(['upload', 'update', 'remove']);
  });

  it('does not update equipment when the V2 upload fails', async () => {
    const update = vi.fn();
    mockFrom.mockImplementation(() => {
      const chain = makeChain();
      chain.update = update;
      return chain;
    });
    mockUploadDisplayImageSet.mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(
      replaceEquipmentDisplayImage({
        organizationId: 'org-1',
        equipmentId: 'eq-1',
        source: {} as File,
      }),
    ).rejects.toThrow('storage unavailable');

    expect(update).not.toHaveBeenCalled();
  });

  it('normalizes legacy selection and clears the image through the scoped DB update', async () => {
    const chains: any[] = [];
    mockFrom.mockImplementation(() => {
      const chain = makeChain();
      chain.update = vi.fn((payload: unknown) => {
        chains.push({ payload, chain });
        return chain;
      });
      return chain;
    });

    await setEquipmentDisplayImageRef('org-1', 'eq-1', 'legacy/path.jpg');
    await setEquipmentDisplayImageRef('org-1', 'eq-1', '');

    expect(chains.map((entry) => entry.payload)).toEqual([
      { image_url: 'legacy/path.jpg' },
      { image_url: null },
    ]);
  });
});
