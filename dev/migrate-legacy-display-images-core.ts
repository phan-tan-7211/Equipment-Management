import { createHash } from 'node:crypto';

export const DISPLAY_IMAGE_VARIANT_NAMES = ['thumb', 'preview', 'full'] as const;
export type DisplayImageVariantName = (typeof DISPLAY_IMAGE_VARIANT_NAMES)[number];

export const DISPLAY_IMAGE_VARIANT_CONFIGS: Readonly<
  Record<DisplayImageVariantName, { maxWidthOrHeight: number; quality: number }>
> = {
  thumb: { maxWidthOrHeight: 160, quality: 0.82 },
  preview: { maxWidthOrHeight: 512, quality: 0.82 },
  full: { maxWidthOrHeight: 1024, quality: 0.82 },
};

export const LEGACY_DISPLAY_IMAGE_BUCKETS = [
  'inventory-item-images',
  'work-order-images',
  'equipment-note-images',
] as const;

export type LegacyDisplayImageBucket =
  (typeof LEGACY_DISPLAY_IMAGE_BUCKETS)[number];

export type MigrationEntity = 'equipment' | 'inventory';
export type MigrationTable = 'equipment' | 'inventory_item_images' | 'inventory_items';

export interface LegacyDisplayImageCandidate {
  id: string;
  entity: MigrationEntity;
  organizationId: string;
  entityId: string;
  storedRef: string | null | undefined;
  table: MigrationTable;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
}

export interface LegacyImageSource {
  bucket: LegacyDisplayImageBucket;
  path: string;
}

export interface DownloadedLegacyImage {
  bytes: Uint8Array;
  contentType?: string | null;
}

export type DisplayImageVariantBytes = Record<
  DisplayImageVariantName,
  Uint8Array
>;

export interface MigrationDatabase {
  listCandidates(input: {
    cursor: string | null;
    limit: number;
    entity: MigrationEntity | 'all';
    organizationId?: string;
  }): Promise<{
    rows: LegacyDisplayImageCandidate[];
    nextCursor: string | null;
  }>;
  updateCanonicalRef(
    candidate: LegacyDisplayImageCandidate,
    canonicalRef: string,
  ): Promise<boolean>;
}

export interface MigrationStorage {
  download(
    bucket: LegacyDisplayImageBucket,
    path: string,
  ): Promise<DownloadedLegacyImage>;
  upload(
    bucket: 'display-images',
    path: string,
    bytes: Uint8Array,
  ): Promise<'uploaded' | 'already-exists'>;
  stat(
    bucket: 'display-images',
    path: string,
  ): Promise<{ exists: boolean; sizeBytes?: number | null }>;
}

export type DisplayImageVariantConverter = (input: {
  bytes: Uint8Array;
  contentType: string;
  fileName: string;
}) => Promise<DisplayImageVariantBytes>;

export interface MigrationFailure {
  id: string;
  entity: MigrationEntity;
  reason: string;
}

export interface MigrationSkip {
  id: string;
  entity: MigrationEntity;
  reason: string;
}

export interface MigrationReport {
  mode: 'dry-run' | 'apply';
  scanned: number;
  skipped: number;
  wouldMigrate: number;
  migrated: number;
  failed: number;
  bytesBefore: number;
  bytesAfter: number;
  bytesBeforeMeasured: number;
  bytesAfterMeasured: number;
  failures: MigrationFailure[];
  skips: MigrationSkip[];
  nextCursor: string | null;
  resumeCursor: string | null;
}

export interface RunLegacyDisplayImageMigrationOptions {
  mode: 'dry-run' | 'apply';
  limit: number;
  cursor?: string | null;
  entity: MigrationEntity | 'all';
  organizationId?: string;
}

export interface RunLegacyDisplayImageMigrationDependencies {
  database: MigrationDatabase;
  storage: MigrationStorage;
  convertToVariants: DisplayImageVariantConverter;
  createImageSetId?: (candidate: LegacyDisplayImageCandidate) => string;
}

export const MAX_MIGRATION_BATCH_SIZE = 100;

const SAFE_PATH_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._~-]*$/;

function isSafePathSegment(value: unknown): value is string {
  return typeof value === 'string' && SAFE_PATH_SEGMENT.test(value);
}

function assertSafePathSegment(label: string, value: string): void {
  if (!isSafePathSegment(value)) {
    throw new TypeError(label + ' must be a safe non-empty path segment.');
  }
}

function decodeStoragePath(value: string): string {
  const withoutQuery = value.split(/[?#]/, 1)[0].replace(/^\/+/, '');
  try {
    return decodeURIComponent(withoutQuery);
  } catch {
    return withoutQuery;
  }
}

function isSafeStorageObjectPath(value: string): boolean {
  const normalized = decodeStoragePath(value);
  return (
    normalized.length > 0 &&
    !normalized.startsWith('/') &&
    normalized.split('/').every((segment) => segment.length > 0 && segment !== '.' && segment !== '..')
  );
}

function objectPathAfterMarker(
  storedRef: string,
  marker: string,
): string | null {
  const lowerRef = storedRef.toLowerCase();
  const lowerMarker = marker.toLowerCase();
  const markerIndex = lowerRef.indexOf(lowerMarker);
  if (markerIndex === -1) return null;

  const path = decodeStoragePath(
    storedRef.slice(markerIndex + marker.length),
  );
  return isSafeStorageObjectPath(path) ? path : null;
}

const DISPLAY_IMAGE_V2_MARKERS = [
  '/storage/v1/object/public/display-images/',
  '/storage/v1/object/sign/display-images/',
  '/object/public/display-images/',
  '/object/sign/display-images/',
] as const;

function extractDisplayImageObjectPath(storedRef: string): string | null {
  const trimmed = storedRef.trim();
  if (!trimmed) return null;

  if (trimmed.toLowerCase().startsWith('display-images/')) {
    const path = decodeStoragePath(trimmed.slice('display-images/'.length));
    return isSafeStorageObjectPath(path) ? path : null;
  }

  for (const marker of DISPLAY_IMAGE_V2_MARKERS) {
    const path = objectPathAfterMarker(trimmed, marker);
    if (path) return path;
  }

  return null;
}

export interface ParsedDisplayImageV2Ref {
  organizationId: string;
  entity: MigrationEntity;
  entityId: string;
  imageSetId: string;
  variant: DisplayImageVariantName;
  canonicalRef: string;
}

export function parseDisplayImageV2Ref(
  storedRef: string | null | undefined,
): ParsedDisplayImageV2Ref | null {
  if (!storedRef?.trim()) return null;

  const objectPath = extractDisplayImageObjectPath(storedRef);
  if (!objectPath) return null;

  const segments = objectPath.split('/');
  if (segments.length !== 6 || segments[0] !== 'org') return null;

  const organizationId = segments[1];
  const entity = segments[2];
  const entityId = segments[3];
  const imageSetId = segments[4];
  const filename = segments[5];
  const variant = DISPLAY_IMAGE_VARIANT_NAMES.find(
    (candidate) => filename === candidate + '.webp',
  );

  if (
    !isSafePathSegment(organizationId) ||
    (entity !== 'equipment' && entity !== 'inventory') ||
    !isSafePathSegment(entityId) ||
    !isSafePathSegment(imageSetId) ||
    !variant
  ) {
    return null;
  }

  return {
    organizationId,
    entity,
    entityId,
    imageSetId,
    variant,
    canonicalRef: createCanonicalDisplayImageRef({
      organizationId,
      entity,
      entityId,
      imageSetId,
    }),
  };
}

export function isDisplayImageV2Ref(
  storedRef: string | null | undefined,
): boolean {
  return parseDisplayImageV2Ref(storedRef) !== null;
}

export function isDisplayImagesRefPrefix(
  storedRef: string | null | undefined,
): boolean {
  const trimmed = storedRef?.trim().toLowerCase() ?? '';
  return (
    trimmed === 'display-images' ||
    trimmed.startsWith('display-images/') ||
    DISPLAY_IMAGE_V2_MARKERS.some((marker) =>
      trimmed.includes(marker.toLowerCase()),
    )
  );
}

export function createDisplayImagePath(
  candidate: LegacyDisplayImageCandidate,
  imageSetId: string,
  variant: DisplayImageVariantName,
): string {
  assertSafePathSegment('organizationId', candidate.organizationId);
  assertSafePathSegment('entityId', candidate.entityId);
  assertSafePathSegment('imageSetId', imageSetId);

  return [
    'org',
    candidate.organizationId,
    candidate.entity,
    candidate.entityId,
    imageSetId,
    variant + '.webp',
  ].join('/');
}

export function createCanonicalDisplayImageRef(
  input: Pick<
    LegacyDisplayImageCandidate,
    'organizationId' | 'entity' | 'entityId'
  > & { imageSetId: string },
): string {
  return (
    'display-images/' +
    createDisplayImagePath(
      input as LegacyDisplayImageCandidate,
      input.imageSetId,
      'full',
    )
  );
}

export function createMigrationImageSetId(
  candidate: LegacyDisplayImageCandidate,
): string {
  const digest = createHash('sha256')
    .update(
      candidate.entity +
        ':' +
        candidate.table +
        ':' +
        candidate.organizationId +
        ':' +
        candidate.id,
    )
    .digest('hex')
    .slice(0, 32)
    .split('');

  digest[12] = '4';
  digest[16] = (parseInt(digest[16], 16) & 0x3 | 0x8).toString(16);

  return [
    digest.slice(0, 8).join(''),
    digest.slice(8, 12).join(''),
    digest.slice(12, 16).join(''),
    digest.slice(16, 20).join(''),
    digest.slice(20, 32).join(''),
  ].join('-');
}

export type LegacySourceResolution =
  | { source: LegacyImageSource }
  | { skipReason: string };

export function resolveLegacyImageSource(
  candidate: LegacyDisplayImageCandidate,
): LegacySourceResolution {
  const storedRef = candidate.storedRef?.trim() ?? '';
  if (!storedRef) {
    return { skipReason: 'missing legacy display-image reference' };
  }

  if (isDisplayImageV2Ref(storedRef)) {
    return { skipReason: 'already uses display-images V2' };
  }

  if (isDisplayImagesRefPrefix(storedRef)) {
    return { skipReason: 'invalid or unsupported display-images V2 reference' };
  }

  for (const bucket of LEGACY_DISPLAY_IMAGE_BUCKETS) {
    const markers = [
      '/storage/v1/object/public/' + bucket + '/',
      '/storage/v1/object/sign/' + bucket + '/',
      '/object/public/' + bucket + '/',
      '/object/sign/' + bucket + '/',
    ];

    for (const marker of markers) {
      const path = objectPathAfterMarker(storedRef, marker);
      if (path) {
        return { source: { bucket, path } };
      }
    }

    const canonicalPrefix = bucket + '/';
    if (storedRef.toLowerCase().startsWith(canonicalPrefix)) {
      const path = decodeStoragePath(storedRef.slice(canonicalPrefix.length));
      if (isSafeStorageObjectPath(path)) {
        return { source: { bucket, path } };
      }
    }
  }

  if (/^https?:\/\//i.test(storedRef)) {
    return { skipReason: 'unsupported external image URL' };
  }

  const path = decodeStoragePath(storedRef);
  if (!isSafeStorageObjectPath(path)) {
    return { skipReason: 'invalid legacy storage path' };
  }

  if (candidate.entity === 'inventory') {
    return {
      source: {
        bucket: 'inventory-item-images',
        path,
      },
    };
  }

  const segments = path.split('/');
  if (segments.length < 3) {
    return { skipReason: 'legacy equipment path has too few segments' };
  }

  if (segments[1] === candidate.entityId) {
    return {
      source: {
        bucket: 'equipment-note-images',
        path,
      },
    };
  }

  return {
    source: {
      bucket: 'work-order-images',
      path,
    },
  };
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/g, ' ').trim().slice(0, 400);
}

async function downloadLegacyImage(
  storage: MigrationStorage,
  source: LegacyImageSource,
): Promise<DownloadedLegacyImage> {
  return storage.download(source.bucket, source.path);
}

function validateVariantBytes(
  variants: DisplayImageVariantBytes,
): void {
  for (const variant of DISPLAY_IMAGE_VARIANT_NAMES) {
    const bytes = variants[variant];
    if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
      throw new Error('Variant ' + variant + ' is empty or invalid.');
    }
  }
}

function createInitialReport(
  mode: 'dry-run' | 'apply',
): MigrationReport {
  return {
    mode,
    scanned: 0,
    skipped: 0,
    wouldMigrate: 0,
    migrated: 0,
    failed: 0,
    bytesBefore: 0,
    bytesAfter: 0,
    bytesBeforeMeasured: 0,
    bytesAfterMeasured: 0,
    failures: [],
    skips: [],
    nextCursor: null,
    resumeCursor: null,
  };
}

export function normalizeMigrationBatchLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 1;
  return Math.min(
    MAX_MIGRATION_BATCH_SIZE,
    Math.max(1, Math.floor(limit)),
  );
}

export async function runLegacyDisplayImageMigration(
  dependencies: RunLegacyDisplayImageMigrationDependencies,
  options: RunLegacyDisplayImageMigrationOptions,
): Promise<MigrationReport> {
  const report = createInitialReport(options.mode);
  const batchLimit = normalizeMigrationBatchLimit(options.limit);
  const startCursor = options.cursor ?? null;
  const page = await dependencies.database.listCandidates({
    cursor: startCursor,
    limit: batchLimit,
    entity: options.entity,
    organizationId: options.organizationId,
  });

  for (const candidate of page.rows) {
    report.scanned += 1;

    const resolution = resolveLegacyImageSource(candidate);
    if ('skipReason' in resolution) {
      report.skipped += 1;
      report.skips.push({
        id: candidate.id,
        entity: candidate.entity,
        reason: resolution.skipReason,
      });
      continue;
    }

    try {
      const downloaded = await downloadLegacyImage(
        dependencies.storage,
        resolution.source,
      );
      if (downloaded.bytes.byteLength > 0) {
        report.bytesBefore += downloaded.bytes.byteLength;
        report.bytesBeforeMeasured += 1;
      }

      const variants = await dependencies.convertToVariants({
        bytes: downloaded.bytes,
        contentType:
          downloaded.contentType?.trim() ||
          candidate.mimeType?.trim() ||
          'application/octet-stream',
        fileName:
          candidate.fileName?.trim() ||
          resolution.source.path.split('/').pop() ||
          candidate.id + '.image',
      });
      validateVariantBytes(variants);

      const imageSetId =
        dependencies.createImageSetId?.(candidate) ??
        createMigrationImageSetId(candidate);
      const canonicalRef = createCanonicalDisplayImageRef({
        organizationId: candidate.organizationId,
        entity: candidate.entity,
        entityId: candidate.entityId,
        imageSetId,
      });
      const variantPaths = Object.fromEntries(
        DISPLAY_IMAGE_VARIANT_NAMES.map((variant) => [
          variant,
          createDisplayImagePath(candidate, imageSetId, variant),
        ]),
      ) as Record<DisplayImageVariantName, string>;

      const bytesAfter = DISPLAY_IMAGE_VARIANT_NAMES.reduce(
        (total, variant) => total + variants[variant].byteLength,
        0,
      );

      if (options.mode === 'dry-run') {
        report.wouldMigrate += 1;
        report.bytesAfter += bytesAfter;
        report.bytesAfterMeasured += 1;
        continue;
      }

      for (const variant of DISPLAY_IMAGE_VARIANT_NAMES) {
        await dependencies.storage.upload(
          'display-images',
          variantPaths[variant],
          variants[variant],
        );
      }

      for (const variant of DISPLAY_IMAGE_VARIANT_NAMES) {
        const stat = await dependencies.storage.stat(
          'display-images',
          variantPaths[variant],
        );
        if (!stat.exists) {
          throw new Error('Uploaded ' + variant + ' object could not be verified.');
        }
        if (
          stat.sizeBytes != null &&
          stat.sizeBytes !== variants[variant].byteLength
        ) {
          throw new Error(
            'Verified ' +
              variant +
              ' object size does not match the generated bytes.',
          );
        }
      }

      const updated = await dependencies.database.updateCanonicalRef(
        candidate,
        canonicalRef,
      );
      if (!updated) {
        throw new Error(
          'Database row changed or was not found; canonical ref was not committed.',
        );
      }

      report.migrated += 1;
      report.bytesAfter += bytesAfter;
      report.bytesAfterMeasured += 1;
    } catch (error) {
      report.failed += 1;
      report.failures.push({
        id: candidate.id,
        entity: candidate.entity,
        reason: safeErrorMessage(error),
      });
    }
  }

  report.nextCursor = page.nextCursor;
  report.resumeCursor =
    report.failed > 0 ? startCursor : page.nextCursor;

  return report;
}
