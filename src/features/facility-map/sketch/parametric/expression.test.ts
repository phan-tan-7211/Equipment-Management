import { describe, expect, it } from 'vitest';

import { evaluateExpression } from '@/features/facility-map/sketch/parametric/expression';

describe('parametric expression parser', () => {
  it('evaluates scalar arithmetic with normal precedence', () => {
    expect(
      evaluateExpression('2 + 3 * 4', { mmPerUnit: 10 }),
    ).toMatchObject({
      ok: true,
      result: { value: 14, dimension: 'scalar' },
    });
  });

  it('parses mm and m literals into model-space length', () => {
    expect(
      evaluateExpression('100 mm + 0.2 m', { mmPerUnit: 10 }),
    ).toMatchObject({
      ok: true,
      result: { value: 30, dimension: 'length' },
    });
  });

  it('resolves named parameter references', () => {
    const result = evaluateExpression('width * 2', {
      mmPerUnit: 10,
      parameters: {
        width: { value: 12, dimension: 'length' },
      },
    });

    expect(result).toMatchObject({
      ok: true,
      result: { value: 24, dimension: 'length' },
      references: ['width'],
    });
  });

  it('supports parentheses and unary minus', () => {
    expect(
      evaluateExpression('-(2 + 3) * 4', { mmPerUnit: 10 }),
    ).toMatchObject({
      ok: true,
      result: { value: -20, dimension: 'scalar' },
    });
  });

  it('rejects incompatible dimensional addition', () => {
    expect(
      evaluateExpression('10 mm + 2', { mmPerUnit: 10 }),
    ).toMatchObject({
      ok: false,
      error: 'Cannot add or subtract values with different dimensions',
    });
  });

  it('returns scalar for length divided by length', () => {
    expect(
      evaluateExpression('100 mm / 20 mm', { mmPerUnit: 10 }),
    ).toMatchObject({
      ok: true,
      result: { value: 5, dimension: 'scalar' },
    });
  });

  it('rejects missing parameters and division by zero', () => {
    expect(
      evaluateExpression('missing + 1', { mmPerUnit: 10 }),
    ).toMatchObject({
      ok: false,
      error: 'Unknown parameter "missing"',
    });
    expect(
      evaluateExpression('10 / 0', { mmPerUnit: 10 }),
    ).toMatchObject({
      ok: false,
      error: 'Division by zero',
    });
  });
});
