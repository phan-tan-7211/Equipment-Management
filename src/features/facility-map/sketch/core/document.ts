import { createSketchId } from './id';
import { normalizeMmPerUnit } from './units';
import type {
  SketchDimension,
  SketchDocument,
  SketchEntity,
  SketchUnit,
} from './types';

export const SKETCH_SCHEMA_VERSION = 1 as const;

export type CreateSketchDocumentInput = {
  id?: string;
  name?: string;
  displayUnit?: SketchUnit;
  mmPerUnit?: number;
  entities?: SketchEntity[];
  dimensions?: SketchDimension[];
  createdAt?: number;
  updatedAt?: number;
};

export function createSketchDocument(input: CreateSketchDocumentInput = {}): SketchDocument {
  const now = Date.now();
  return {
    schemaVersion: SKETCH_SCHEMA_VERSION,
    id: input.id ?? createSketchId('document'),
    name: input.name,
    displayUnit: input.displayUnit ?? 'mm',
    mmPerUnit: normalizeMmPerUnit(input.mmPerUnit ?? 10),
    entities: input.entities ? structuredClone(input.entities) : [],
    dimensions: input.dimensions ? structuredClone(input.dimensions) : [],
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function cloneSketchDocument(document: SketchDocument): SketchDocument {
  return structuredClone(document);
}

export function touchSketchDocument(document: SketchDocument): SketchDocument {
  return {
    ...document,
    updatedAt: Date.now(),
  };
}
