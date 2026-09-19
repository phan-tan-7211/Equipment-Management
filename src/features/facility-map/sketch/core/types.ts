export type SketchId = string;

export type SketchUnit = 'mm' | 'm';

export type SketchPoint = {
  x: number;
  y: number;
};

export type SketchStyle = {
  color: string;
  lineWidth: number;
  construction?: boolean;
  visible?: boolean;
  locked?: boolean;
};

export type LineEntity = SketchStyle & {
  id: SketchId;
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type PolylineEntity = SketchStyle & {
  id: SketchId;
  type: 'polyline';
  points: SketchPoint[];
  closed?: boolean;
};

export type RectEntity = SketchStyle & {
  id: SketchId;
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
};

export type CircleEntity = SketchStyle & {
  id: SketchId;
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
};

export type ArcEntity = SketchStyle & {
  id: SketchId;
  type: 'arc';
  cx: number;
  cy: number;
  r: number;
  startAngleDeg: number;
  endAngleDeg: number;
  clockwise?: boolean;
};

export type SketchEntity =
  | LineEntity
  | PolylineEntity
  | RectEntity
  | CircleEntity
  | ArcEntity;

export type SketchDimensionKind =
  | 'length'
  | 'horizontal'
  | 'vertical'
  | 'radius'
  | 'diameter'
  | 'angle';

export type SketchDimension = {
  id: SketchId;
  kind: SketchDimensionKind;
  entityId: SketchId;
  driving?: boolean;
  reference?: boolean;
  value?: number;
  labelOffset?: SketchPoint;
  hidden?: boolean;
};

export type SketchConstraintKind =
  | 'coincident'
  | 'horizontal'
  | 'vertical'
  | 'parallel'
  | 'perpendicular'
  | 'equal'
  | 'fix'
  | 'midpoint'
  | 'concentric';

export type SketchConstraintPointRef = {
  entityId: SketchId;
  point: 'start' | 'end' | 'center' | 'midpoint' | `vertex:${number}`;
};

export type SketchConstraint = {
  id: SketchId;
  kind: SketchConstraintKind;
  entityIds: SketchId[];
  pointRefs?: SketchConstraintPointRef[];
  enabled?: boolean;
  conflict?: boolean;
};

export type SketchParameterDimension = 'scalar' | 'length';

export type SketchParameter = {
  id: SketchId;
  name: string;
  expression: string;
  value?: number;
  dimension?: SketchParameterDimension;
  error?: string;
};

export type SketchDocument = {
  schemaVersion: 1;
  id: SketchId;
  name?: string;
  displayUnit: SketchUnit;
  /**
   * Physical millimeters represented by one model-space coordinate.
   * Example: 10 means 1 drawing coordinate = 10 mm.
   */
  mmPerUnit: number;
  entities: SketchEntity[];
  dimensions: SketchDimension[];
  constraints: SketchConstraint[];
  parameters: SketchParameter[];
  createdAt: number;
  updatedAt: number;
};

export type SketchCreateTool = 'line' | 'polyline' | 'rect' | 'circle' | 'arc';
export type SketchModifyTool = 'trim' | 'extend' | 'break' | 'offset';
export type SketchTool = 'select' | SketchCreateTool | SketchModifyTool;
export type SketchInteraction = 'idle' | 'creating' | 'dragging' | 'modifying';

export type SketchCommandState = {
  tool: SketchTool;
  interaction: SketchInteraction;
};
