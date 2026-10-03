import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockImageCompression, mockLoggerWarn, mockLoggerError } = vi.hoisted(() => ({
  mockImageCompression: vi.fn(),
  mockLoggerWarn: vi.fn(),
  mockLoggerError: vi.fn(),
}));

vi.mock('browser-image-compression', () => ({
  default: mockImageCompression,
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    warn: mockLoggerWarn,
    error: mockLoggerError,
  },
}));

import {
  createDisplayImageVariants,
  DISPLAY_IMAGE_VARIANT_CONFIGS,
  DISPLAY_IMAGE_VARIANT_NAMES,
} from '@/services/displayImageVariantService';

describe('displayImageVariantService', () => {
  beforeEach(() => {
    mockImageCompression.mockReset();
    mockLoggerWarn.mockReset();
    mockLoggerError.mockReset();
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
      (call) => (call as unknown as [File, Record<string, unknown>])[1],
    );

    expect(options).toEqual(
      DISPLAY_IMAGE_VARIANT_NAMES.map((variant) => ({
        ...DISPLAY_IMAGE_VARIANT_CONFIGS[variant],
      })),
    );
  });

  it('creates variants sequentially to avoid concurrent mobile canvas work', async () => {
    let activeCompressionCount = 0;
    let maxActiveCompressionCount = 0;

    mockImageCompression.mockImplementation(async () => {
      activeCompressionCount += 1;
      maxActiveCompressionCount = Math.max(
        maxActiveCompressionCount,
        activeCompressionCount,
      );

      await Promise.resolve();
      activeCompressionCount -= 1;
      return new Blob(['encoded-image'], { type: 'image/webp' });
    });

    const source = new File(['source-image'], 'camera.jpg', {
      type: 'image/jpeg',
    });

    await createDisplayImageVariants(source);

    expect(maxActiveCompressionCount).toBe(1);
    expect(mockImageCompression).toHaveBeenCalledTimes(3);
  });

  it('retries one failed worker compression on the main thread', async () => {
    mockImageCompression.mockReset();
    mockImageCompression
      .mockRejectedValueOnce(new Error('worker failed'))
      .mockResolvedValue(
        new Blob(['encoded-image'], { type: 'image/webp' }),
      );

    const source = new File(['source-image'], 'camera.jpg', {
      type: 'image/jpeg',
    });

    await createDisplayImageVariants(source);

    expect(mockImageCompression).toHaveBeenCalledTimes(4);
    expect(mockImageCompression.mock.calls[0]?.[1]).toMatchObject({
      useWebWorker: true,
    });
    expect(mockImageCompression.mock.calls[1]?.[1]).toMatchObject({
      useWebWorker: false,
    });
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'Display image worker compression failed; retrying on main thread',
      expect.objectContaining({
        variant: 'thumb',
        error: 'worker failed',
      }),
    );
  });

  it('rejects with the variant name when both compression attempts fail', async () => {
    mockImageCompression.mockReset();
    mockImageCompression
      .mockRejectedValueOnce(new Error('worker codec failure'))
      .mockRejectedValueOnce(new Error('main-thread codec failure'));

    const source = new File(['source-image'], 'camera.jpg', {
      type: 'image/jpeg',
    });

    await expect(createDisplayImageVariants(source)).rejects.toMatchObject({
      name: 'DisplayImageVariantError',
      variant: 'thumb',
      cause: expect.objectContaining({
        message: 'main-thread codec failure',
      }),
    });

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Display image compression failed after main-thread retry',
      expect.objectContaining({
        variant: 'thumb',
        workerError: 'worker codec failure',
        error: 'main-thread codec failure',
      }),
    );
  });

  it('rejects invalid input before invoking the compressor', async () => {
    await expect(
      createDisplayImageVariants(null as unknown as File),
    ).rejects.toThrow('source image File is required.');

    expect(mockImageCompression).not.toHaveBeenCalled();
  });
});
