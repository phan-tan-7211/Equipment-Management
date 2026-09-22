import type { SnapCandidate } from '../snapping/snapPriority';

type Props = {
  candidate: SnapCandidate;
};

export const SnapIndicator = ({ candidate }: Props) => {
  const { point, kind } = candidate;
  const size = 6;

  return (
    <g
      aria-label={`snap-${kind}`}
      pointerEvents="none"
      vectorEffect="non-scaling-stroke"
    >
      <circle
        cx={point.x}
        cy={point.y}
        r={size}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      {(kind === 'endpoint' || kind === 'midpoint') && (
        <rect
          x={point.x - size / 2}
          y={point.y - size / 2}
          width={size}
          height={size}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {kind === 'intersection' && (
        <>
          <line
            x1={point.x - size}
            y1={point.y - size}
            x2={point.x + size}
            y2={point.y + size}
            stroke="#f59e0b"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={point.x + size}
            y1={point.y - size}
            x2={point.x - size}
            y2={point.y + size}
            stroke="#f59e0b"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
      {kind === 'center' && (
        <>
          <line
            x1={point.x - size}
            y1={point.y}
            x2={point.x + size}
            y2={point.y}
            stroke="#f59e0b"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={point.x}
            y1={point.y - size}
            x2={point.x}
            y2={point.y + size}
            stroke="#f59e0b"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </g>
  );
};
