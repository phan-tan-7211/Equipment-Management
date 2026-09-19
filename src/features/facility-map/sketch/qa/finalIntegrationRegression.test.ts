import { describe, expect, it } from 'vitest';

import {
  cloneSketchDocument,
  createSketchDocument,
  deserializeSketchDocument,
  serializeSketchDocument,
} from '@/features/facility-map/sketch';
import { calibrateMmPerUnitFromFloorWidth } from '@/features/facility-map/sketch/integration/calibration';
import { getSketchViewDimensions } from '@/features/facility-map/sketch/dimensions/viewDimensions';
import { bindDimensionToParameter } from '@/features/facility-map/sketch/parametric/parameterBinding';
import { solveSketchConstraints } from '@/features/facility-map/sketch/constraints/constraintSolver';

describe('final facility sketch integration regression', () => {
  it('preserves calibrated parametric sketch through a floor-plan history snapshot', () => {
    const calibrated = calibrateMmPerUnitFromFloorWidth(
      30000,
      1200,
      10,
    );
    const base = createSketchDocument({
      id: 'facility-final',
      mmPerUnit: calibrated,
      entities: [
        {
          id: 'line',
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 0,
          color: '#111111',
          lineWidth: 1,
        },
      ],
      parameters: [
        {
          id: 'p-width',
          name: 'width',
          expression: '5000 mm',
        },
      ],
      constraints: [
        {
          id: 'horizontal',
          kind: 'horizontal',
          entityIds: ['line'],
        },
      ],
    });
    const length = getSketchViewDimensions(base.entities).find(
      (dimension) => dimension.kind === 'length',
    )!;
    const bound = bindDimensionToParameter(
      base,
      length,
      'p-width',
    );
    const floorPlanSnapshot = JSON.parse(
      JSON.stringify({
        building: 'Main Building',
        floor: 'Floor 1',
        sketchDocument: cloneSketchDocument(bound),
      }),
    ) as {
      building: string;
      floor: string;
      sketchDocument: typeof bound;
    };

    const restored = deserializeSketchDocument(
      serializeSketchDocument(floorPlanSnapshot.sketchDocument),
      'facility-final',
    );
    const solved = solveSketchConstraints(
      restored.entities,
      restored.constraints,
    );

    expect(restored.mmPerUnit).toBe(25);
    expect(restored.parameters[0]).toMatchObject({
      name: 'width',
      value: 200,
      dimension: 'length',
    });
    expect(restored.dimensions[0]).toMatchObject({
      parameterId: 'p-width',
    });
    expect(restored.entities[0]).toMatchObject({
      x2: 200,
      y2: 0,
    });
    expect(solved.status).toBe('under-constrained');
    expect(floorPlanSnapshot.building).toBe('Main Building');
  });

  it('keeps cancel snapshot isolated from later edits', () => {
    const entry = createSketchDocument({
      id: 'cancel-final',
      entities: [],
    });
    const snapshot = cloneSketchDocument(entry);
    const edited = cloneSketchDocument(entry);
    edited.entities.push({
      id: 'circle',
      type: 'circle',
      cx: 10,
      cy: 10,
      r: 5,
      color: '#111111',
      lineWidth: 1,
    });

    expect(snapshot.entities).toHaveLength(0);
    expect(edited.entities).toHaveLength(1);
  });
});
