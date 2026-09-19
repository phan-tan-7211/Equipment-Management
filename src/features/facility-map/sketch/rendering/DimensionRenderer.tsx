import { formatSketchDistance } from '../core/units';
import type { SketchDocument } from '../core/types';
import type { ViewDimension } from '../dimensions/viewDimensions';

type Props = {
  dimensions: ViewDimension[];
  document: SketchDocument;
  enabled: boolean;
  selectedId: string;
  onSelect: (dimensionId: string) => void;
  onEdit: (dimension: ViewDimension) => void;
};

const formatValue = (
  dimension: ViewDimension,
  document: SketchDocument,
): string => {
  const body = dimension.kind === 'angle'
    ? dimension.value.toFixed(1)
    : formatSketchDistance(dimension.value, document);

  return `${dimension.prefix ?? ''}${body}${dimension.suffix ?? ''}`;
};

export const DimensionRenderer = ({
  dimensions,
  document,
  enabled,
  selectedId,
  onSelect,
  onEdit,
}: Props) => (
  <g aria-label="sketch-dimensions">
    {dimensions.map((dimension) => {
      const selected = selectedId === dimension.id;
      return (
        <text
          key={dimension.id}
          x={dimension.anchor.x}
          y={dimension.anchor.y}
          textAnchor="middle"
          fill={selected ? '#f59e0b' : '#0ea5e9'}
          fontSize={dimension.kind === 'angle' ? 12 : 14}
          fontWeight="600"
          pointerEvents={enabled ? 'auto' : 'none'}
          style={{
            cursor: enabled ? 'pointer' : 'default',
            paintOrder: 'stroke',
            stroke: 'white',
            strokeWidth: 3,
          }}
          onMouseDown={(event) => {
            if (!enabled) return;
            event.preventDefault();
            event.stopPropagation();
            onSelect(dimension.id);
          }}
          onDoubleClick={(event) => {
            if (!enabled) return;
            event.preventDefault();
            event.stopPropagation();
            onEdit(dimension);
          }}
        >
          {formatValue(dimension, document)}
        </text>
      );
    })}
  </g>
);
