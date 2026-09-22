import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SKETCH_ID,
  EMPTY_PLAN,
  ensurePlanShape,
  planKey,
  type FloorPlanState,
} from '@/features/facility-map/pages/FacilityFloorPlan';
import { createSketchDocument } from '@/features/facility-map/sketch';

// A JSON round-trip is what actually happens on save/reload (localStorage
// only stores strings) — using it here instead of a plain object literal
// makes sure these tests catch anything that doesn't survive serialization,
// not just anything that happens to work as an in-memory object.
const roundTrip = (plan: FloorPlanState): Partial<FloorPlanState> =>
  JSON.parse(JSON.stringify(plan));

describe('default sketch lock persistence (P1-03)', () => {
  it('an old saved plan with no sketchLocked field still loads, defaulting to unlocked', () => {
    // Simulates a plan saved before FloorPlanState.sketchLocked existed.
    const legacyPlan: Record<string, unknown> = { ...EMPTY_PLAN };
    delete legacyPlan.sketchLocked;

    const loaded = ensurePlanShape(legacyPlan as Partial<FloorPlanState>);

    expect(loaded.sketchLocked).toBe(false);
    // Nothing else about the legacy plan should be disturbed.
    expect(loaded.name).toBe(EMPTY_PLAN.name);
  });

  it('locking the default sketch survives a save (serialize) + reload round trip', () => {
    const locked = ensurePlanShape({
      ...EMPTY_PLAN,
      sketchDocument: createSketchDocument(),
      sketchLocked: true,
    });

    const reloaded = ensurePlanShape(roundTrip(locked));

    expect(reloaded.sketchLocked).toBe(true);
  });

  it('leaves an explicitly unlocked default sketch unlocked through the same round trip', () => {
    const unlocked = ensurePlanShape({ ...EMPTY_PLAN, sketchLocked: false });
    const reloaded = ensurePlanShape(roundTrip(unlocked));

    expect(reloaded.sketchLocked).toBe(false);
  });

  it('additional-sketch locks keep working independently of the default sketch lock', () => {
    const plan = ensurePlanShape({
      ...EMPTY_PLAN,
      sketchLocked: false,
      sketches: [
        { id: 'sketch-a', name: 'Sketch 2', visible: true, locked: true, document: createSketchDocument() },
        { id: 'sketch-b', name: 'Sketch 3', visible: true, locked: false, document: createSketchDocument() },
      ],
    });

    const reloaded = ensurePlanShape(roundTrip(plan));

    expect(reloaded.sketchLocked).toBe(false);
    expect(reloaded.sketches[0]).toMatchObject({ id: 'sketch-a', locked: true });
    expect(reloaded.sketches[1]).toMatchObject({ id: 'sketch-b', locked: false });
  });

  it('switching plans and back does not lose a locked default sketch', () => {
    // Plan A: locked. Simulates FacilityFloorPlan's plan-switch flow, which
    // reads a cached/stored plan back through ensurePlanShape exactly like
    // initial load does.
    const planA = ensurePlanShape({
      ...EMPTY_PLAN,
      building: 'Main Building',
      floor: 'Floor 1',
      sketchLocked: true,
    });
    const cache: Record<string, Partial<FloorPlanState>> = {
      [planKey(planA.building, planA.floor)]: roundTrip(planA),
    };

    // Switch to a different (fresh) plan B...
    const planB = ensurePlanShape({ ...EMPTY_PLAN, building: 'Warehouse Building', floor: 'Floor 1' });
    expect(planB.sketchLocked).toBe(false);

    // ...then switch back to A via the same cache-lookup + ensurePlanShape
    // path the real plan switcher uses.
    const restoredA = ensurePlanShape(cache[planKey('Main Building', 'Floor 1')]);
    expect(restoredA.sketchLocked).toBe(true);
  });

  it('DEFAULT_SKETCH_ID stays a stable, non-empty identifier (sanity check for the sketch:<id> selection namespace)', () => {
    expect(DEFAULT_SKETCH_ID).toBe('default');
  });
});
