import type {
  LineEntity,
  SketchConstraint,
  SketchEntity,
  SketchPoint,
} from '../core/types';

type Props = {
  constraints: SketchConstraint[];
  entities: SketchEntity[];
};

const lineMidpoint = (line: LineEntity): SketchPoint => ({
  x: (line.x1 + line.x2) / 2,
  y: (line.y1 + line.y2) / 2,
});

const linePoint = (
  line: LineEntity,
  point: string,
): SketchPoint =>
  point === 'start'
    ? { x: line.x1, y: line.y1 }
    : { x: line.x2, y: line.y2 };

export const ConstraintGlyphRenderer = ({
  constraints,
  entities,
}: Props) => {
  const byId = new Map(entities.map((entity) => [entity.id, entity]));

  return (
    <g aria-label="sketch-constraints" pointerEvents="none">
      {constraints.flatMap((constraint) => {
        if (constraint.enabled === false) return [];

        if (
          constraint.kind === 'horizontal' ||
          constraint.kind === 'vertical'
        ) {
          const entity = byId.get(constraint.entityIds[0]);
          if (!entity || entity.type !== 'line') return [];
          const anchor = lineMidpoint(entity);
          return [
            <text
              key={constraint.id}
              x={anchor.x + 8}
              y={anchor.y + 8}
              fill={constraint.conflict ? '#ef4444' : '#8b5cf6'}
              fontSize="11"
              fontWeight="700"
              vectorEffect="non-scaling-stroke"
            >
              {constraint.kind === 'horizontal' ? 'H' : 'V'}
            </text>,
          ];
        }

        if (constraint.kind === 'coincident') {
          const ref = constraint.pointRefs?.[0];
          if (!ref) return [];
          const entity = byId.get(ref.entityId);
          if (!entity || entity.type !== 'line') return [];
          const anchor = linePoint(entity, ref.point);
          return [
            <circle
              key={constraint.id}
              cx={anchor.x}
              cy={anchor.y}
              r={3}
              fill={constraint.conflict ? '#ef4444' : '#8b5cf6'}
              vectorEffect="non-scaling-stroke"
            />,
          ];
        }

        return [];
      })}
    </g>
  );
};
