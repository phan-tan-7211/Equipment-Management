import { distance } from '../core/geometry';
import type {
  SketchEntity,
  SketchPoint,
} from '../core/types';

export type ArcCenterSnapResult = {
  point: SketchPoint;
  entityId: string;
  distance: number;
};

export const getArcCenterSnapPoint = (
  entity: SketchEntity,
): SketchPoint | null =>
  entity.type === 'arc'
    ? { x: entity.cx, y: entity.cy }
    : null;

export const findArcCenterSnap = (
  point: SketchPoint,
  entities: SketchEntity[],
  threshold: number,
): ArcCenterSnapResult | null => {
  let best: ArcCenterSnapResult | null = null;

  entities.forEach((entity) => {
    const candidate = getArcCenterSnapPoint(entity);
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
