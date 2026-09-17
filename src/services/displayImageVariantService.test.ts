import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockImageCompression } = vi.hoisted(() => ({
  mockImageCompression: vi.fn(),
}));

vi.mock('browser-image-compression', () => ({
  default: mockImageCompression,
}));

import {
  createDisplayImageVariants,
  DISPLAY_IMAGE_VARIANT_CONFIGS,
  DISPLAY_IMAGE_VARIANT_NAMES,
  DisplayImageVariantError,
} from '@/services/displayImageVariantService';

describe('displayImageVariantService', () => {
  beforeEach(() => {
    mockImageCompression.mockReset();
    mockImageCompression.mockResolvedValue(
      new Blob(['encoded-image'], { type: 'image/webp' }),
    );
  });

  it('creates exactly thumb, preview, and full WebP Files', async () => {
    const source = new File(['source-image'], 'camera.JPG', {
      type: 'image/jpeg',
      lastModified: 123,
    });

    const variants = await createDisplayImageVariants(source);

    expect(Object.keys(variants)).toEqual(DISPLAY_IMAGE_VARIANT_NAMES);
    expect(mockImageCompression).toHaveBeenCalledTimes(3);

    expect(variants.thumb).toBeInstanceOf(File);
    expect(variants.preview).toBeInstanceOf(File);
    expect(variants.full).toBeInstanceOf(File);

    expect(variants.thumb.name).toBe('thumb.webp');
    expect(variants.preview.name).toBe('preview.webp');
    expect(variants.full.name).toBe('full.webp');

    expect(variants.thumb.type).toBe('image/webp');
    expect(variants.preview.type).toBe('image/webp');
    expect(variants.full.type).toBe('image/webp');
  });

  it('passes the shared dimension, WebP, quality, and worker settings', async () => {
    const source = new File(['source-image'], 'camera.jpg', {
      type: 'image/jpeg',
    });

    await createDisplayImageVariants(source);

    const options = mockImageCompression.mock.calls.map(
      (call: [File, Record<string, unknown>]) => call[1],
    );

    expect(options).toEqual(
      expect.arrayContaining(
        DISPLAY_IMAGE_VARIANT_NAMES.map((variant) => ({
          ...DISPLAY_IMAGE_VARIANT_CONFIGS[variant],
        })),
      ),
    );
  });

  it('rejects with the variant name when compression fails', async () => {
    mockImageCompression.mockReset();
    mockImageCompression
      .mockRejectedValueOnce(new Error('codec failure'))
      .mockResolvedValue(
        new Blob(['encoded-image'], { type: 'image/webp' }),
      );

    const source = new File(['source-image'], 'camera.jpg', {
      type: 'image/jpeg',
    });

    await expect(createDisplayImageVariants(source)).rejects.toMatchObject({
      name: 'DisplayImageVariantError',
      variant: 'thumb',
    });
  });

  it('rejects invalid input before invoking the compressor', async () => {
    await expect(
      createDisplayImageVariants(null as unknown as File),
    ).rejects.toThrow('source image File is required.');

    expect(mockImageCompression).not.toHaveBeenCalled();
  });
});
