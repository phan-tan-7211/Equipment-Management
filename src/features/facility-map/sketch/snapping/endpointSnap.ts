import { arcPoint, distance } from '../core/geometry';
import type {
  SketchEntity,
  SketchPoint,
} from '../core/types';

export type EndpointSnapResult = {
  point: SketchPoint;
  entityId: string;
  distance: number;
};

export const getEntityEndpointSnapPoints = (
  entity: SketchEntity,
): SketchPoint[] => {
  switch (entity.type) {
    case 'line':
      return [
        { x: entity.x1, y: entity.y1 },
        { x: entity.x2, y: entity.y2 },
      ];
    case 'polyline':
      return entity.points.map((point) => ({ ...point }));
    case 'rect':
      return [
        { x: entity.x, y: entity.y },
        { x: entity.x + entity.w, y: entity.y },
        { x: entity.x + entity.w, y: entity.y + entity.h },
        { x: entity.x, y: entity.y + entity.h },
      ];
    case 'arc':
      return [
        arcPoint(entity, entity.startAngleDeg),
        arcPoint(entity, entity.endAngleDeg),
      ];
    case 'circle':
      return [];
  }
};

export const findEndpointSnap = (
  point: SketchPoint,
  entities: SketchEntity[],
  threshold: number,
): EndpointSnapResult | null => {
  let best: EndpointSnapResult | null = null;

  entities.forEach((entity) => {
    getEntityEndpointSnapPoints(entity).forEach((candidate) => {
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
  });

  return best;
};
