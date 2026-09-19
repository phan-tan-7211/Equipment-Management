import { translateSketchEntity } from '../core/geometry';
import type {
  SketchEntity,
  SketchPoint,
} from '../core/types';

export const moveSelectedEntities = (
  entities: SketchEntity[],
  selectedIds: string[],
  dx: number,
  dy: number,
): SketchEntity[] => {
  const selected = new Set(selectedIds);
  return entities.map((entity) =>
    selected.has(entity.id)
      ? translateSketchEntity(entity, dx, dy)
      : structuredClone(entity),
  );
};

export const duplicateSelectedEntities = (
  entities: SketchEntity[],
  selectedIds: string[],
  offset: SketchPoint,
  createId: (entity: SketchEntity) => string,
): { entities: SketchEntity[]; ids: string[] } => {
  const selected = new Set(selectedIds);
  const copies = entities
    .filter((entity) => selected.has(entity.id))
    .map((entity) => {
      const translated = translateSketchEntity(
        entity,
        offset.x,
        offset.y,
      );
      return {
        ...translated,
        id: createId(entity),
      };
    });

  return {
    entities: copies,
    ids: copies.map((entity) => entity.id),
  };
};
