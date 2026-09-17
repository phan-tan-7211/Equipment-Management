#!/usr/bin/env tsx

/**
 * Safe, resumable legacy display-image migration tool.
 *
 * The command is dry-run by default. Only --apply writes display-images objects
 * or database references, and --allow-production is required for the configured
 * production project in addition to --apply.
 *
 * Usage:
 *   npm run migrate:legacy-display-images -- --organization-id <org-uuid>
 *   npm run migrate:legacy-display-images -- --apply --organization-id <org-uuid>
 *
 * Required environment:
 *   SUPABASE_URL or VITE_SUPABASE_URL
 *   SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY
 *
 * Install the browser once before running:
 *   npx playwright install chromium
 */

import { createClient } from '@supabase/supabase-js';
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  DISPLAY_IMAGE_VARIANT_CONFIGS,
  DISPLAY_IMAGE_VARIANT_NAMES,
  MAX_MIGRATION_BATCH_SIZE,
  runLegacyDisplayImageMigration,
  type DisplayImageVariantBytes,
  type DisplayImageVariantConverter,
  type LegacyDisplayImageCandidate,
  type MigrationDatabase,
  type MigrationEntity,
  type MigrationStorage,
} from './migrate-legacy-display-images-core';

const PRODUCTION_PROJECT_REF = 'wgynakhoppqkrutnslmv';
const DEFAULT_BATCH_SIZE = 25;
const CURSOR_PREFIX = 'v1.';

const USAGE = [
  'Usage:',
  '  npm run migrate:legacy-display-images -- [options]',
  '',
  'Options:',
  '  --apply                         Write V2 objects and DB refs (default: dry-run).',
  '  --allow-production              Required with --apply for the production project only.',
  '  --entity equipment|inventory|all  Candidate scope (default: all).',
  '  --organization-id <uuid>        Limit the run to one organization.',
  '  --limit <1-100>                 Bounded batch size (default: 25).',
  '  --cursor <token>                Resume from a token printed by a previous run.',
  '  --state-file <path>              Read/write a local resume state JSON file.',
  '  --report <path>                  Write the JSON report to a local file.',
  '  --dry-run                        Explicitly select the default read-only mode.',
  '  --help                           Show this help.',
  '',
  'The first pass never deletes legacy objects. Keep the generated report and',
  'run later batches with the emitted resumeCursor after reviewing failures.',
].join('\n');

type CliOptions = {
  apply: boolean;
  allowProduction: boolean;
  entity: MigrationEntity | 'all';
  organizationId?: string;
  limit: number;
  cursor: string | null;
  stateFile?: string;
  reportFile?: string;
};

type CursorState = {
  equipmentId: string | null;
  inventoryImageId: string | null;
  inventoryItemId: string | null;
};

type CandidatePage = {
  rows: LegacyDisplayImageCandidate[];
  fetchedCount: number;
};

function requiredValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1]?.trim();
  if (!value || value.startsWith('--')) {
    throw new Error(flag + ' requires a value.');
  }
  return value;
}

function parseArgs(argv: string[]): CliOptions | null {
  if (argv.includes('--help') || argv.includes('-h')) return null;

  let apply = false;
  let allowProduction = false;
  let entity: MigrationEntity | 'all' = 'all';
  let organizationId: string | undefined;
  let limit = DEFAULT_BATCH_SIZE;
  let cursor: string | null = null;
  let stateFile: string | undefined;
  let reportFile: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--apply') {
      apply = true;
      continue;
    }
    if (arg === '--dry-run') {
      apply = false;
      continue;
    }
    if (arg === '--allow-production') {
      allowProduction = true;
      continue;
    }
    if (arg === '--organization-id') {
      organizationId = requiredValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === '--entity') {
      const value = requiredValue(argv, index, arg);
      if (value !== 'equipment' && value !== 'inventory' && value !== 'all') {
        throw new Error('--entity must be equipment, inventory, or all.');
      }
      entity = value;
      index += 1;
      continue;
    }
    if (arg === '--limit') {
      const value = Number(requiredValue(argv, index, arg));
      if (!Number.isInteger(value) || value < 1 || value > MAX_MIGRATION_BATCH_SIZE) {
        throw new Error('--limit must be an integer from 1 to ' + MAX_MIGRATION_BATCH_SIZE + '.');
      }
      limit = value;
      index += 1;
      continue;
    }
    if (arg === '--cursor') {
      cursor = requiredValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === '--state-file') {
      stateFile = requiredValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === '--report') {
      reportFile = requiredValue(argv, index, arg);
      index += 1;
      continue;
    }

    throw new Error('Unknown option: ' + arg);
  }

  if (apply && !organizationId) {
    throw new Error('--organization-id is required with --apply.');
  }

  return {
    apply,
    allowProduction,
    entity,
    organizationId,
    limit,
    cursor,
    stateFile,
    reportFile,
  };
}

function emptyCursorState(): CursorState {
  return {
    equipmentId: null,
    inventoryImageId: null,
    inventoryItemId: null,
  };
}

function encodeCursor(state: CursorState): string {
  return (
    CURSOR_PREFIX +
    Buffer.from(JSON.stringify(state), 'utf8').toString('base64url')
  );
}

function decodeCursor(
  cursor: string | null,
  entity: MigrationEntity | 'all',
): CursorState {
  if (!cursor) return emptyCursorState();

  if (!cursor.startsWith(CURSOR_PREFIX)) {
    const state = emptyCursorState();
    if (entity === 'equipment') {
      state.equipmentId = cursor;
      return state;
    }
    if (entity === 'inventory') {
      state.inventoryImageId = cursor;
      state.inventoryItemId = cursor;
      return state;
    }
    throw new Error('Invalid cursor. Use the opaque cursor emitted by the tool.');
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(cursor.slice(CURSOR_PREFIX.length), 'base64url').toString('utf8'),
    ) as Partial<CursorState>;

    return {
      equipmentId: typeof parsed.equipmentId === 'string' ? parsed.equipmentId : null,
      inventoryImageId:
        typeof parsed.inventoryImageId === 'string'
          ? parsed.inventoryImageId
          : null,
      inventoryItemId:
        typeof parsed.inventoryItemId === 'string'
          ? parsed.inventoryItemId
          : null,
    };
  } catch {
    throw new Error('Invalid cursor. Use the opaque cursor emitted by the tool.');
  }
}

function readResumeCursor(options: CliOptions): string | null {
  if (options.cursor) return options.cursor;
  if (!options.stateFile || !fs.existsSync(options.stateFile)) return null;

  try {
    const state = JSON.parse(
      fs.readFileSync(options.stateFile, 'utf8'),
    ) as { resumeCursor?: unknown };
    return typeof state.resumeCursor === 'string' ? state.resumeCursor : null;
  } catch (error) {
    throw new Error(
      'Could not read state file: ' +
        (error instanceof Error ? error.message : String(error)),
    );
  }
}

function writeJson(filePath: string, value: unknown): void {
  const absolutePath = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(
    absolutePath,
    JSON.stringify(value, null, 2) + '\n',
    'utf8',
  );
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function asRequiredString(value: unknown, field: string): string {
  const result = asString(value);
  if (!result) throw new Error('Supabase row is missing ' + field + '.');
  return result;
}

function candidateKey(candidate: LegacyDisplayImageCandidate): string {
  return candidate.table + ':' + candidate.id;
}

function candidateSortKey(candidate: LegacyDisplayImageCandidate): string {
  const tableOrder =
    candidate.table === 'equipment'
      ? '0'
      : candidate.table === 'inventory_item_images'
        ? '1'
        : '2';
  return tableOrder + ':' + candidate.id;
}

class SupabaseMigrationDatabase implements MigrationDatabase {
  constructor(private readonly client: ReturnType<typeof createClient>) {}

  private async fetchEquipment(
    limit: number,
    cursor: string | null,
    organizationId?: string,
  ): Promise<CandidatePage> {
    let query = this.client
      .from('equipment')
      .select('id, organization_id, image_url')
      .not('image_url', 'is', null)
      .order('id', { ascending: true })
      .limit(limit);

    if (cursor) query = query.gt('id', cursor);
    if (organizationId) query = query.eq('organization_id', organizationId);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return {
      fetchedCount: rows.length,
      rows: rows.map((row) => {
        const id = asRequiredString(row.id, 'equipment.id');
        return {
          id,
          entity: 'equipment',
          organizationId: asRequiredString(row.organization_id, 'equipment.organization_id'),
          entityId: id,
          storedRef: asString(row.image_url),
          table: 'equipment',
        };
      }),
    };
  }

  private async fetchInventoryImageRows(
    limit: number,
    cursor: string | null,
    organizationId?: string,
  ): Promise<CandidatePage> {
    let query = this.client
      .from('inventory_item_images')
      .select(
        'id, inventory_item_id, organization_id, file_url, file_name, file_size, mime_type',
      )
      .not('file_url', 'is', null)
      .order('id', { ascending: true })
      .limit(limit);

    if (cursor) query = query.gt('id', cursor);
    if (organizationId) query = query.eq('organization_id', organizationId);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return {
      fetchedCount: rows.length,
      rows: rows.map((row) => ({
        id: asRequiredString(row.id, 'inventory_item_images.id'),
        entity: 'inventory' as const,
        organizationId: asRequiredString(
          row.organization_id,
          'inventory_item_images.organization_id',
        ),
        entityId: asRequiredString(
          row.inventory_item_id,
          'inventory_item_images.inventory_item_id',
        ),
        storedRef: asString(row.file_url),
        table: 'inventory_item_images' as const,
        fileName: asString(row.file_name),
        fileSize: asNumber(row.file_size),
        mimeType: asString(row.mime_type),
      })),
    };
  }

  private async fetchInventoryItemRows(
    limit: number,
    cursor: string | null,
    organizationId?: string,
  ): Promise<CandidatePage> {
    let query = this.client
      .from('inventory_items')
      .select('id, organization_id, image_url')
      .not('image_url', 'is', null)
      .order('id', { ascending: true })
      .limit(limit);

    if (cursor) query = query.gt('id', cursor);
    if (organizationId) query = query.eq('organization_id', organizationId);

    const { data, error } = await query;
    if (error) throw error;

    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return {
      fetchedCount: rows.length,
      rows: rows.map((row) => {
        const id = asRequiredString(row.id, 'inventory_items.id');
        return {
          id,
          entity: 'inventory',
          organizationId: asRequiredString(row.organization_id, 'inventory_items.organization_id'),
          entityId: id,
          storedRef: asString(row.image_url),
          table: 'inventory_items',
        };
      }),
    };
  }

  async listCandidates(input: {
    cursor: string | null;
    limit: number;
    entity: MigrationEntity | 'all';
    organizationId?: string;
  }): Promise<{
    rows: LegacyDisplayImageCandidate[];
    nextCursor: string | null;
  }> {
    const state = decodeCursor(input.cursor, input.entity);
    const shouldFetchEquipment =
      input.entity === 'equipment' || input.entity === 'all';
    const shouldFetchInventory =
      input.entity === 'inventory' || input.entity === 'all';

    const [equipment, inventoryImages, inventoryItems] = await Promise.all([
      shouldFetchEquipment
        ? this.fetchEquipment(input.limit, state.equipmentId, input.organizationId)
        : Promise.resolve({ rows: [], fetchedCount: 0 }),
      shouldFetchInventory
        ? this.fetchInventoryImageRows(
            input.limit,
            state.inventoryImageId,
            input.organizationId,
          )
        : Promise.resolve({ rows: [], fetchedCount: 0 }),
      shouldFetchInventory
        ? this.fetchInventoryItemRows(
            input.limit,
            state.inventoryItemId,
            input.organizationId,
          )
        : Promise.resolve({ rows: [], fetchedCount: 0 }),
    ]);

    const availableRows = [
      ...equipment.rows,
      ...inventoryImages.rows,
      ...inventoryItems.rows,
    ].sort((left, right) =>
      candidateSortKey(left).localeCompare(candidateSortKey(right)),
    );

    const selectedRows = availableRows.slice(0, input.limit);
    const nextState = { ...state };

    for (const row of selectedRows) {
      if (row.table === 'equipment') nextState.equipmentId = row.id;
      if (row.table === 'inventory_item_images') {
        nextState.inventoryImageId = row.id;
      }
      if (row.table === 'inventory_items') {
        nextState.inventoryItemId = row.id;
      }
    }

    const hasMore =
      availableRows.length > selectedRows.length ||
      equipment.fetchedCount === input.limit ||
      inventoryImages.fetchedCount === input.limit ||
      inventoryItems.fetchedCount === input.limit;

    return {
      rows: selectedRows,
      nextCursor: selectedRows.length > 0 && hasMore ? encodeCursor(nextState) : null,
    };
  }

  async updateCanonicalRef(
    candidate: LegacyDisplayImageCandidate,
    canonicalRef: string,
  ): Promise<boolean> {
    let query =
      candidate.table === 'equipment'
        ? this.client
            .from('equipment')
            .update({ image_url: canonicalRef })
            .eq('id', candidate.entityId)
            .eq('organization_id', candidate.organizationId)
            .eq('image_url', candidate.storedRef)
            .select('id')
        : candidate.table === 'inventory_item_images'
          ? this.client
              .from('inventory_item_images')
              .update({ file_url: canonicalRef })
              .eq('id', candidate.id)
              .eq('organization_id', candidate.organizationId)
              .eq('file_url', candidate.storedRef)
              .select('id')
          : this.client
              .from('inventory_items')
              .update({ image_url: canonicalRef })
              .eq('id', candidate.entityId)
              .eq('organization_id', candidate.organizationId)
              .eq('image_url', candidate.storedRef)
              .select('id');

    const { data, error } = await query;
    if (error) throw error;
    return Array.isArray(data) && data.length === 1;
  }
}

class SupabaseMigrationStorage implements MigrationStorage {
  constructor(private readonly client: ReturnType<typeof createClient>) {}

  async download(
    bucket: 'inventory-item-images' | 'work-order-images' | 'equipment-note-images',
    objectPath: string,
  ) {
    const { data, error } = await this.client.storage
      .from(bucket)
      .download(objectPath);

    if (error || !data) {
      throw new Error(
        'Legacy download failed for ' +
          bucket +
          ': ' +
          (error?.message ?? 'empty response'),
      );
    }

    return {
      bytes: new Uint8Array(await data.arrayBuffer()),
      contentType: data.type || null,
    };
  }

  async upload(
    bucket: 'display-images',
    objectPath: string,
    bytes: Uint8Array,
  ): Promise<'uploaded' | 'already-exists'> {
    const { error } = await this.client.storage.from(bucket).upload(
      objectPath,
      bytes,
      {
        upsert: false,
        cacheControl: '31536000',
        contentType: 'image/webp',
      },
    );

    if (!error) return 'uploaded';

    try {
      const existing = await this.stat(bucket, objectPath);
      if (existing.exists) return 'already-exists';
    } catch {
      // Preserve the original upload error when the conflict cannot be checked.
    }

    throw new Error('V2 upload failed: ' + error.message);
  }

  async stat(
    bucket: 'display-images',
    objectPath: string,
  ): Promise<{ exists: boolean; sizeBytes?: number | null }> {
    const slashIndex = objectPath.lastIndexOf('/');
    const folder = slashIndex === -1 ? '' : objectPath.slice(0, slashIndex);
    const fileName =
      slashIndex === -1 ? objectPath : objectPath.slice(slashIndex + 1);

    const { data, error } = await this.client.storage.from(bucket).list(folder, {
      limit: 10,
      search: fileName,
    });

    if (error) throw error;

    const item = (data ?? []).find((entry) => entry.name === fileName);
    if (!item) return { exists: false };

    const metadata = item.metadata as { size?: unknown } | null | undefined;
    const sizeBytes = asNumber(metadata?.size);
    return { exists: true, sizeBytes };
  }
}

type BrowserConverterInput = {
  base64: string;
  contentType: string;
  configs: typeof DISPLAY_IMAGE_VARIANT_CONFIGS;
};

type BrowserConverterOutput = Record<DisplayImageVariantName, number[]>;

async function createBrowserVariantConverter(): Promise<{
  convertToVariants: DisplayImageVariantConverter;
  close: () => Promise<void>;
}> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const convertToVariants: DisplayImageVariantConverter = async (input) => {
    const base64 = Buffer.from(input.bytes).toString('base64');
    const contentType =
      input.contentType === 'application/octet-stream'
        ? 'image/jpeg'
        : input.contentType;

    const encoded = await page.evaluate<BrowserConverterOutput, BrowserConverterInput>(
      async (value) => {
        const binary = atob(value.base64);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }

        const blob = new Blob([bytes], { type: value.contentType });
        let bitmap: ImageBitmap;
        try {
          bitmap = await createImageBitmap(blob, {
            imageOrientation: 'from-image',
          });
        } catch {
          bitmap = await createImageBitmap(blob);
        }

        const values = {} as BrowserConverterOutput;
        for (const variant of ['thumb', 'preview', 'full'] as DisplayImageVariantName[]) {
          const config = value.configs[variant];
          const scale = Math.min(
            1,
            config.maxWidthOrHeight / Math.max(bitmap.width, bitmap.height),
          );
          const width = Math.max(1, Math.round(bitmap.width * scale));
          const height = Math.max(1, Math.round(bitmap.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const context = canvas.getContext('2d');
          if (!context) throw new Error('Canvas 2D context is unavailable.');
          context.drawImage(bitmap, 0, 0, width, height);

          const output = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/webp', config.quality);
          });
          if (!output) {
            throw new Error('Browser could not encode ' + variant + ' as WebP.');
          }

          values[variant] = Array.from(
            new Uint8Array(await output.arrayBuffer()),
          );
        }

        bitmap.close();
        return values;
      },
      {
        base64,
        contentType,
        configs: DISPLAY_IMAGE_VARIANT_CONFIGS,
      },
    );

    return {
      thumb: new Uint8Array(encoded.thumb),
      preview: new Uint8Array(encoded.preview),
      full: new Uint8Array(encoded.full),
    } satisfies DisplayImageVariantBytes;
  };

  return {
    convertToVariants,
    close: () => browser.close(),
  };
}

function isProductionTarget(url: string): boolean {
  if (process.env.SUPABASE_PROJECT_REF?.trim() === PRODUCTION_PROJECT_REF) {
    return true;
  }

  try {
    return new URL(url).hostname.includes(PRODUCTION_PROJECT_REF);
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    console.log(USAGE);
    return;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim();
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL or VITE_SUPABASE_URL is required.');
  }
  if (!supabaseKey) {
    throw new Error(
      'SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is required.',
    );
  }

  if (options.apply && isProductionTarget(supabaseUrl) && !options.allowProduction) {
    throw new Error(
      'Refusing production writes. Obtain explicit authorization, then pass --allow-production with --apply.',
    );
  }

  const cursor = readResumeCursor(options);
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const database = new SupabaseMigrationDatabase(client);
  const storage = new SupabaseMigrationStorage(client);
  const browserConverter = await createBrowserVariantConverter();

  try {
    const report = await runLegacyDisplayImageMigration(
      {
        database,
        storage,
        convertToVariants: browserConverter.convertToVariants,
      },
      {
        mode: options.apply ? 'apply' : 'dry-run',
        limit: options.limit,
        cursor,
        entity: options.entity,
        organizationId: options.organizationId,
      },
    );

    const output = {
      target: new URL(supabaseUrl).origin,
      organizationId: options.organizationId ?? null,
      entity: options.entity,
      allowProduction: options.allowProduction,
      ...report,
    };

    if (options.reportFile) writeJson(options.reportFile, output);
    if (options.stateFile) {
      writeJson(options.stateFile, {
        version: 1,
        entity: options.entity,
        organizationId: options.organizationId ?? null,
        resumeCursor: report.resumeCursor,
        updatedAt: new Date().toISOString(),
        summary: {
          scanned: report.scanned,
          skipped: report.skipped,
          wouldMigrate: report.wouldMigrate,
          migrated: report.migrated,
          failed: report.failed,
        },
      });
    }

    console.log(JSON.stringify(output, null, 2));
    if (report.failed > 0) process.exitCode = 2;
  } finally {
    await browserConverter.close();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
