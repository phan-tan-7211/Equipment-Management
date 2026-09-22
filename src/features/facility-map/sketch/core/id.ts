import type { SketchId } from './types';

let fallbackCounter = 0;

export function createSketchId(prefix = 'sketch'): SketchId {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  fallbackCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${fallbackCounter.toString(36)}`;
}
