import { describe, expect, it } from 'vitest';

import {
  buildParameterGraph,
  canDeleteParameter,
  findParameterCycles,
  getParameterDependents,
  recalculateParameters,
  renameParameter,
} from '@/features/facility-map/sketch/parametric/parameterEngine';
import type { SketchParameter } from '@/features/facility-map/sketch/core/types';

const params = (
  values: Array<[string, string]>,
): SketchParameter[] =>
  values.map(([name, expression], index) => ({
    id: `p-${index}`,
    name,
    expression,
  }));

describe('parameter engine', () => {
  it('builds dependencies and recalculates in dependency order', () => {
    const parameters = params([
      ['width', '100 mm'],
      ['doubleWidth', 'width * 2'],
      ['total', 'doubleWidth + 50 mm'],
    ]);

    const graph = buildParameterGraph(parameters);
    expect([...graph.get('total') ?? []]).toEqual(['doubleWidth']);

    const calculated = recalculateParameters(parameters, 10);
    expect(calculated[0]).toMatchObject({
      value: 10,
      dimension: 'length',
      error: undefined,
    });
    expect(calculated[1]).toMatchObject({
      value: 20,
      dimension: 'length',
    });
    expect(calculated[2]).toMatchObject({
      value: 25,
      dimension: 'length',
    });
  });

  it('detects cyclic dependencies', () => {
    const parameters = params([
      ['a', 'b + 1'],
      ['b', 'a + 1'],
    ]);
    const cycles = findParameterCycles(buildParameterGraph(parameters));
    expect(cycles.length).toBeGreaterThan(0);

    const calculated = recalculateParameters(parameters, 10);
    expect(calculated.every((item) => item.error === 'Cyclic dependency')).toBe(true);
  });

  it('marks unknown references as errors', () => {
    const calculated = recalculateParameters(
      params([['a', 'missing + 1']]),
      10,
    );
    expect(calculated[0]).toMatchObject({
      error: 'Unknown parameter "missing"',
      value: undefined,
    });
  });

  it('renames parameter and rewrites dependent expressions', () => {
    const renamed = renameParameter(
      params([
        ['width', '100 mm'],
        ['doubleWidth', 'width * 2'],
      ]),
      'width',
      'w',
    );

    expect(renamed[0].name).toBe('w');
    expect(renamed[1].expression).toBe('w * 2');
  });

  it('protects deletion when direct dependents exist', () => {
    const parameters = params([
      ['width', '100 mm'],
      ['doubleWidth', 'width * 2'],
    ]);

    expect(getParameterDependents(parameters, 'width')).toEqual(['doubleWidth']);
    expect(canDeleteParameter(parameters, 'width')).toEqual({
      ok: false,
      dependents: ['doubleWidth'],
    });
    expect(canDeleteParameter(parameters, 'doubleWidth')).toEqual({ ok: true });
  });

  it('rejects duplicate names during recalculation', () => {
    const calculated = recalculateParameters(
      params([
        ['width', '1'],
        ['width', '2'],
      ]),
      10,
    );

    expect(calculated.every((item) => item.error === 'Duplicate parameter name')).toBe(true);
  });
});
