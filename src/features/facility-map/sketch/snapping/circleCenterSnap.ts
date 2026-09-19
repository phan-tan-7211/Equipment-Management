import { distance } from '../core/geometry';
import type {
  SketchEntity,
  SketchPoint,
} from '../core/types';

export type CircleCenterSnapResult = {
  point: SketchPoint;
  entityId: string;
  distance: number;
};

export const getCircleCenterSnapPoint = (
  entity: SketchEntity,
): SketchPoint | null =>
  entity.type === 'circle'
    ? { x: entity.cx, y: entity.cy }
    : null;

export const findCircleCenterSnap = (
  point: SketchPoint,
  entities: SketchEntity[],
  threshold: number,
): CircleCenterSnapResult | null => {
  let best: CircleCenterSnapResult | null = null;

  entities.forEach((entity) => {
    const candidate = getCircleCenterSnapPoint(entity);
    if (!candidate) return;

    const candidateDistance = distance(point, candidate);
    if (
      candidateDistance < threshold &&
      (!best || candidateDistance < best.distance)
    ) {
      best = {
        point: { ...candidate },
        entityId: entity.id,
        distance: candidateDistance,
      };
    }
  });

  return best;
};
