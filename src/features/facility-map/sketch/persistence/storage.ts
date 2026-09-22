import { createSketchDocument } from '../core/document';
import { normalizeMmPerUnit } from '../core/units';
import type {
  SketchConstraint,
  SketchDimension,
  SketchDocument,
  SketchEntity,
  SketchParameter,
  SketchUnit,
} from '../core/types';

export const SKETCH_STORAGE_PREFIX = 'znteqr:facility-sketch:v1:';

type LegacySketchStore = {
  mmPerUnit?: number;
  entities?: SketchEntity[];
  dimensions?: SketchDimension[];
  constraints?: SketchConstraint[];
  parameters?: SketchParameter[];
  displayUnit?: SketchUnit;
};

export function serializeSketchDocument(document: SketchDocument): string {
  return JSON.stringify(document);
}

export function deserializeSketchDocument(
  serialized: string,
  storageKey = 'sketch',
): SketchDocument {
  const parsed = JSON.parse(serialized) as Partial<SketchDocument> & LegacySketchStore;

  if (parsed.schemaVersion === 1 && typeof parsed.id === 'string') {
    return createSketchDocument({
      id: parsed.id,
      name: parsed.name,
      displayUnit: parsed.displayUnit === 'm' ? 'm' : 'mm',
      mmPerUnit: normalizeMmPerUnit(Number(parsed.mmPerUnit), 10),
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      dimensions: Array.isArray(parsed.dimensions) ? parsed.dimensions : [],
      constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
      parameters: Array.isArray(parsed.parameters) ? parsed.parameters : [],
      createdAt: Number(parsed.createdAt) || Date.now(),
      updatedAt: Number(parsed.updatedAt) || Date.now(),
    });
  }

  // Backward-compatible migration from the pre-Phase-1 local sketch store:
  // { mmPerUnit, entities }.
  return createSketchDocument({
    id: `document-${storageKey}`,
    displayUnit: parsed.displayUnit === 'm' ? 'm' : 'mm',
    mmPerUnit: normalizeMmPerUnit(Number(parsed.mmPerUnit), 10),
    entities: Array.isArray(parsed.entities) ? parsed.entities : [],
    dimensions: Array.isArray(parsed.dimensions) ? parsed.dimensions : [],
    constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
    parameters: Array.isArray(parsed.parameters) ? parsed.parameters : [],
  });
}

export function loadSketchDocument(storageKey: string): SketchDocument {
  if (typeof window === 'undefined') {
    return createSketchDocument({ id: `document-${storageKey}` });
  }

  try {
    const raw = window.localStorage.getItem(`${SKETCH_STORAGE_PREFIX}${storageKey}`);
    if (!raw) return createSketchDocument({ id: `document-${storageKey}` });
    return deserializeSketchDocument(raw, storageKey);
  } catch {
    return createSketchDocument({ id: `document-${storageKey}` });
  }
}

export function saveSketchDocument(storageKey: string, document: SketchDocument): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    `${SKETCH_STORAGE_PREFIX}${storageKey}`,
    serializeSketchDocument(document),
  );
}
