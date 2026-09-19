import {
  angleDeg,
  distance,
} from '../core/geometry';
import type {
  SketchDimensionKind,
  SketchEntity,
  SketchPoint,
} from '../core/types';

export type ViewDimension = {
  id: string;
  entityId: string;
  kind: SketchDimensionKind;
  value: number;
  anchor: SketchPoint;
  prefix?: string;
  suffix?: string;
};

const lineDimensions = (entity: Extract<SketchEntity, { type: 'line' }>): ViewDimension[] => {
  const start = { x: entity.x1, y: entity.y1 };
  const end = { x: entity.x2, y: entity.y2 };
  const mid = {
    x: (entity.x1 + entity.x2) / 2,
    y: (entity.y1 + entity.y2) / 2,
  };

  return [
    {
      id: `auto:${entity.id}:length`,
      entityId: entity.id,
      kind: 'length',
      value: distance(start, end),
      anchor: { x: mid.x, y: mid.y - 8 },
    },
    {
      id: `auto:${entity.id}:angle`,
      entityId: entity.id,
      kind: 'angle',
      value: angleDeg(start, end),
      anchor: { x: entity.x1 + 12, y: entity.y1 - 10 },
      prefix: '∠ ',
      suffix: '°',
    },
  ];
};

const rectDimensions = (entity: Extract<SketchEntity, { type: 'rect' }>): ViewDimension[] => [
  {
    id: `auto:${entity.id}:horizontal`,
    entityId: entity.id,
    kind: 'horizontal',
    value: Math.abs(entity.w),
    anchor: {
      x: entity.x + entity.w / 2,
      y: entity.y - 8,
    },
  },
  {
    id: `auto:${entity.id}:vertical`,
    entityId: entity.id,
    kind: 'vertical',
    value: Math.abs(entity.h),
    anchor: {
      x: entity.x + entity.w + 8,
      y: entity.y + entity.h / 2,
    },
  },
];

const circleDimensions = (entity: Extract<SketchEntity, { type: 'circle' }>): ViewDimension[] => [
  {
    id: `auto:${entity.id}:radius`,
    entityId: entity.id,
    kind: 'radius',
    value: entity.r,
    anchor: {
      x: entity.cx + entity.r + 8,
      y: entity.cy - 8,
    },
    prefix: 'R ',
  },
  {
    id: `auto:${entity.id}:diameter`,
    entityId: entity.id,
    kind: 'diameter',
    value: entity.r * 2,
    anchor: {
      x: entity.cx - entity.r - 8,
      y: entity.cy + 12,
    },
    prefix: 'Ø ',
  },
];

const arcDimensions = (entity: Extract<SketchEntity, { type: 'arc' }>): ViewDimension[] => {
  const rawSweep = entity.clockwise
    ? entity.startAngleDeg - entity.endAngleDeg
    : entity.endAngleDeg - entity.startAngleDeg;
  const sweep = ((rawSweep % 360) + 360) % 360;

  return [
    {
      id: `auto:${entity.id}:radius`,
      entityId: entity.id,
      kind: 'radius',
      value: entity.r,
      anchor: {
        x: entity.cx + entity.r + 8,
        y: entity.cy - 8,
      },
      prefix: 'R ',
    },
    {
      id: `auto:${entity.id}:angle`,
      entityId: entity.id,
      kind: 'angle',
      value: sweep,
      anchor: {
        x: entity.cx + 12,
        y: entity.cy - 12,
      },
      prefix: '∠ ',
      suffix: '°',
    },
  ];
};

export const getEntityViewDimensions = (
  entity: SketchEntity,
): ViewDimension[] => {
  if (entity.type === 'line') return lineDimensions(entity);
  if (entity.type === 'rect') return rectDimensions(entity);
  if (entity.type === 'circle') return circleDimensions(entity);
  if (entity.type === 'arc') return arcDimensions(entity);
  return [];
};

export const getSketchViewDimensions = (
  entities: SketchEntity[],
): ViewDimension[] =>
  entities.flatMap(getEntityViewDimensions);
