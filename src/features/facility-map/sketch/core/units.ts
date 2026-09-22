import type { SketchDocument, SketchUnit } from './types';

const MM_PER_METER = 1000;

export function normalizeMmPerUnit(value: number, fallback = 10): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function modelUnitsToMillimeters(modelUnits: number, mmPerUnit: number): number {
  return modelUnits * normalizeMmPerUnit(mmPerUnit);
}

export function millimetersToModelUnits(millimeters: number, mmPerUnit: number): number {
  return millimeters / normalizeMmPerUnit(mmPerUnit);
}

export function millimetersToDisplay(valueMm: number, unit: SketchUnit): number {
  return unit === 'm' ? valueMm / MM_PER_METER : valueMm;
}

export function displayToMillimeters(value: number, unit: SketchUnit): number {
  return unit === 'm' ? value * MM_PER_METER : value;
}

export function modelUnitsToDisplay(modelUnits: number, document: Pick<SketchDocument, 'mmPerUnit' | 'displayUnit'>): number {
  return millimetersToDisplay(
    modelUnitsToMillimeters(modelUnits, document.mmPerUnit),
    document.displayUnit,
  );
}

export function displayToModelUnits(displayValue: number, document: Pick<SketchDocument, 'mmPerUnit' | 'displayUnit'>): number {
  return millimetersToModelUnits(
    displayToMillimeters(displayValue, document.displayUnit),
    document.mmPerUnit,
  );
}

export function unitPrecision(unit: SketchUnit): number {
  return unit === 'm' ? 3 : 0;
}

export function formatSketchDistance(
  modelUnits: number,
  document: Pick<SketchDocument, 'mmPerUnit' | 'displayUnit'>,
  options: { withUnit?: boolean; precision?: number } = {},
): string {
  const value = modelUnitsToDisplay(modelUnits, document);
  const precision = options.precision ?? unitPrecision(document.displayUnit);
  const formatted = value.toFixed(precision);
  return options.withUnit === false ? formatted : `${formatted} ${document.displayUnit}`;
}
