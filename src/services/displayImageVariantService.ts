import imageCompression from 'browser-image-compression';
import { logger } from '@/utils/logger';

export const DISPLAY_IMAGE_VARIANT_NAMES = ['thumb', 'preview', 'full'] as const;

export type DisplayImageVariantName = (typeof DISPLAY_IMAGE_VARIANT_NAMES)[number];

export type DisplayImageVariants = {
  thumb: File;
  preview: File;
  full: File;
};

export type DisplayImageVariantOptions = {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  initialQuality: number;
  fileType: 'image/webp';
  useWebWorker: true;
  preserveExif: false;
};

/**
 * Shared V2 settings for Equipment and Inventory display images.
 *
 * maxSizeMB values are practical byte-budget targets. The hard dimension
 * limits are enforced by maxWidthOrHeight. Each variant prefers a worker and
 * explicitly retries on the main thread if worker/canvas processing fails.
 */
export const DISPLAY_IMAGE_VARIANT_CONFIGS: Readonly<
  Record<DisplayImageVariantName, DisplayImageVariantOptions>
> = {
  thumb: {
    maxSizeMB: 0.03,
    maxWidthOrHeight: 160,
    initialQuality: 0.82,
    fileType: 'image/webp',
    useWebWorker: true,
    preserveExif: false,
  },
  preview: {
    maxSizeMB: 0.12,
    maxWidthOrHeight: 512,
    initialQuality: 0.82,
    fileType: 'image/webp',
    useWebWorker: true,
    preserveExif: false,
  },
  full: {
    maxSizeMB: 0.35,
    maxWidthOrHeight: 1024,
    initialQuality: 0.82,
    fileType: 'image/webp',
    useWebWorker: true,
    preserveExif: false,
  },
} as const;

export class DisplayImageVariantError extends Error {
  readonly variant: DisplayImageVariantName;
  readonly cause: unknown;

  constructor(variant: DisplayImageVariantName, cause: unknown) {
    super('Failed to create ' + variant + ' display image variant.');
    this.name = 'DisplayImageVariantError';
    this.variant = variant;
    this.cause = cause;
  }
}

function assertFileLike(source: File): void {
  if (
    !source ||
    typeof source !== 'object' ||
    typeof source.size !== 'number' ||
    typeof source.arrayBuffer !== 'function'
  ) {
    throw new TypeError('A source image File is required.');
  }
}

function normalizeWebpFile(
  compressed: Blob,
  variant: DisplayImageVariantName,
  source: File,
): File {
  if (!compressed || typeof compressed.size !== 'number') {
    throw new Error('Image compression returned an invalid result.');
  }

  return new File([compressed], variant + '.webp', {
    type: 'image/webp',
    lastModified: source.lastModified,
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function compressVariant(
  source: File,
  variant: DisplayImageVariantName,
): Promise<Blob> {
  const config = DISPLAY_IMAGE_VARIANT_CONFIGS[variant];
  const options = {
    maxSizeMB: config.maxSizeMB,
    maxWidthOrHeight: config.maxWidthOrHeight,
    initialQuality: config.initialQuality,
    fileType: config.fileType,
    useWebWorker: config.useWebWorker,
    preserveExif: config.preserveExif,
  };

  try {
    return await imageCompression(source, options);
  } catch (workerError) {
    logger.warn('Display image worker compression failed; retrying on main thread', {
      variant,
      sourceType: source.type,
      sourceSizeBytes: source.size,
      error: errorMessage(workerError),
    });

    try {
      return await imageCompression(source, {
        ...options,
        useWebWorker: false,
      });
    } catch (mainThreadError) {
      logger.error('Display image compression failed after main-thread retry', {
        variant,
        sourceType: source.type,
        sourceSizeBytes: source.size,
        workerError: errorMessage(workerError),
        error: errorMessage(mainThreadError),
      });
      throw mainThreadError;
    }
  }
}

async function createDisplayImageVariant(
  source: File,
  variant: DisplayImageVariantName,
): Promise<File> {
  try {
    const compressed = await compressVariant(source, variant);
    return normalizeWebpFile(compressed, variant, source);
  } catch (error) {
    if (error instanceof DisplayImageVariantError) {
      throw error;
    }

    throw new DisplayImageVariantError(variant, error);
  }
}

/**
 * Convert one source image into the three immutable display-image variants.
 *
 * Variants are intentionally created sequentially. Mobile browsers can fail
 * when multiple canvas/WebP jobs for the same camera image run concurrently.
 * The compression library normalizes EXIF orientation while drawing the source
 * image; EXIF metadata itself is not copied into the WebP outputs.
 */
export async function createDisplayImageVariants(
  source: File,
): Promise<DisplayImageVariants> {
  assertFileLike(source);

  const thumb = await createDisplayImageVariant(source, 'thumb');
  const preview = await createDisplayImageVariant(source, 'preview');
  const full = await createDisplayImageVariant(source, 'full');

  return { thumb, preview, full };
}
