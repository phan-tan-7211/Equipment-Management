import type {
  SketchDocument,
  SketchEntity,
} from '../core/types';

type Props = {
  document?: SketchDocument;
};

const renderEntity = (entity: SketchEntity) => {
  const common = {
    stroke: entity.color,
    strokeWidth: Math.max(entity.lineWidth, 1),
    fill: 'none',
    vectorEffect: 'non-scaling-stroke' as const,
  };

  if (entity.type === 'line') {
    return (
      <line
        key={entity.id}
        x1={entity.x1}
        y1={entity.y1}
        x2={entity.x2}
        y2={entity.y2}
        {...common}
      />
    );
  }

  if (entity.type === 'rect') {
    return (
      <rect
        key={entity.id}
        x={entity.x}
        y={entity.y}
        width={entity.w}
        height={entity.h}
        {...common}
      />
    );
  }

  if (entity.type === 'circle') {
    return (
      <circle
        key={entity.id}
        cx={entity.cx}
        cy={entity.cy}
        r={entity.r}
        {...common}
      />
    );
  }

  if (entity.type === 'polyline') {
    const points = entity.points
      .map((point) => `${point.x},${point.y}`)
      .join(' ');
    return entity.closed ? (
      <polygon key={entity.id} points={points} {...common} />
    ) : (
      <polyline key={entity.id} points={points} {...common} />
    );
  }

  const start = (entity.startAngleDeg * Math.PI) / 180;
  const end = (entity.endAngleDeg * Math.PI) / 180;
  const startPoint = {
    x: entity.cx + Math.cos(start) * entity.r,
    y: entity.cy + Math.sin(start) * entity.r,
  };
  const endPoint = {
    x: entity.cx + Math.cos(end) * entity.r,
    y: entity.cy + Math.sin(end) * entity.r,
  };
  const rawSweep = entity.clockwise
    ? entity.startAngleDeg - entity.endAngleDeg
    : entity.endAngleDeg - entity.startAngleDeg;
  const sweep = ((rawSweep % 360) + 360) % 360;
  const largeArc = sweep > 180 ? 1 : 0;
  const sweepFlag = entity.clockwise ? 0 : 1;

  return (
    <path
      key={entity.id}
      d={`M ${startPoint.x} ${startPoint.y} A ${entity.r} ${entity.r} 0 ${largeArc} ${sweepFlag} ${endPoint.x} ${endPoint.y}`}
      {...common}
    />
  );
};

export const SketchPrintLayer = ({ document }: Props) => {
  if (!document?.entities.length) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 760"
      preserveAspectRatio="none"
      aria-label="facility-sketch-print-layer"
    >
      {document.entities
        .filter((entity) => entity.visible !== false)
        .map(renderEntity)}
    </svg>
  );
};
