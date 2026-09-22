import type { SketchDocument } from '@/features/facility-map/sketch';

// Mirrors FacilityFloorPlan.tsx's local SketchLayer/FloorPlanState shape
// just enough to make the whole-sketch delete decision testable in
// isolation, without importing the page component (avoids a circular
// import and pulling in its large dependency surface for a pure function).
export type SketchLayerLike = {
  id: string;
  locked?: boolean;
  document: SketchDocument;
};

export type SketchDeletionState<T extends SketchLayerLike> = {
  defaultSketchId: string;
  defaultSketchDocument: SketchDocument | undefined;
  defaultSketchLocked: boolean;
  sketches: T[];
};

export type SketchDeletionResult<T extends SketchLayerLike> = {
  sketchDocument: SketchDocument | undefined;
  sketches: T[];
  /** True if the default sketch's content was cleared by this call. */
  deletedDefault: boolean;
};

/**
 * Pure decision logic for FacilityFloorPlan's generic Delete/Backspace
 * handling of `sketch:<id>` selections (see deleteObjectsByIds).
 *
 * - The default sketch has no removable list slot (it's a plain field on
 *   the plan) — "deleting" it clears its content back to the same
 *   undrawn state a brand-new plan starts in, which is why old saved
 *   plans (sketchDocument === undefined) already load fine.
 * - Additional sketches are removed from the list outright.
 * - A locked layer (default or additional) is never touched, even if its
 *   id is present in `selectedIds` — defense in depth alongside lock
 *   already keeping it out of click/marquee-select in the first place.
 *
 * Generic over the caller's exact sketch-layer type (e.g. FacilityFloorPlan's
 * own SketchLayer, which also carries `name`) so filtering never narrows
 * away fields this module doesn't itself need to know about.
 */
export function deleteSelectedSketchLayers<T extends SketchLayerLike>(
  state: SketchDeletionState<T>,
  selectedIds: Set<string>,
): SketchDeletionResult<T> {
  const deletesDefault =
    selectedIds.has(`sketch:${state.defaultSketchId}`) && !state.defaultSketchLocked;

  return {
    sketchDocument: deletesDefault ? undefined : state.defaultSketchDocument,
    sketches: state.sketches.filter(
      (layer) => !(selectedIds.has(`sketch:${layer.id}`) && !layer.locked),
    ),
    deletedDefault: deletesDefault,
  };
}
