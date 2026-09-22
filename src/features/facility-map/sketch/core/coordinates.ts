import type { SketchPoint } from './types';

export type SketchViewportBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function clientPointToSketchPoint(
  clientX: number,
  clientY: number,
  bounds: SketchViewportBounds,
  canvasWidth: number,
  canvasHeight: number,
): SketchPoint | null {
  if (!bounds.width || !bounds.height) return null;

  return {
    x: ((clientX - bounds.left) / bounds.width) * canvasWidth,
    y: ((clientY - bounds.top) / bounds.height) * canvasHeight,
  };
}

export function cssPixelsToSketchUnits(
  cssPixels: number,
  viewportWidth: number,
  canvasWidth: number,
): number {
  return (cssPixels / Math.max(viewportWidth, 1)) * canvasWidth;
}
