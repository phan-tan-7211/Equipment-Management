import { millimetersToModelUnits } from '../core/units';
import type {
  SketchParameterDimension,
} from '../core/types';

export type ExpressionValue = {
  value: number;
  dimension: SketchParameterDimension;
};

export type ExpressionContext = {
  mmPerUnit: number;
  parameters?: Record<string, ExpressionValue>;
};

export type ExpressionResult =
  | { ok: true; result: ExpressionValue; references: string[] }
  | { ok: false; error: string; references: string[] };

type Token =
  | { type: 'number'; value: number; unit?: 'mm' | 'm' }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' }
  | { type: 'lparen' }
  | { type: 'rparen' };

const tokenize = (expression: string): Token[] => {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      const match = expression.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (!match) throw new Error('Invalid number');
      const value = Number(match[0]);
      if (!Number.isFinite(value)) throw new Error('Invalid number');
      index += match[0].length;

      while (/\s/.test(expression[index] ?? '')) index += 1;
      const unitMatch = expression.slice(index).match(/^(mm|m)\b/i);
      const unit = unitMatch?.[1].toLowerCase() as 'mm' | 'm' | undefined;
      if (unitMatch) index += unitMatch[0].length;
      tokens.push({ type: 'number', value, unit });
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      const match = expression.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (!match) throw new Error('Invalid identifier');
      tokens.push({ type: 'identifier', value: match[0] });
      index += match[0].length;
      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push({ type: 'operator', value: char });
      index += 1;
      continue;
    }
    if (char === '(') {
      tokens.push({ type: 'lparen' });
      index += 1;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'rparen' });
      index += 1;
      continue;
    }

    throw new Error(`Unexpected token "${char}"`);
  }

  return tokens;
};

const addOrSubtract = (
  left: ExpressionValue,
  right: ExpressionValue,
  operator: '+' | '-',
): ExpressionValue => {
  if (left.dimension !== right.dimension) {
    throw new Error('Cannot add or subtract values with different dimensions');
  }
  return {
    value: operator === '+' ? left.value + right.value : left.value - right.value,
    dimension: left.dimension,
  };
};

const multiply = (
  left: ExpressionValue,
  right: ExpressionValue,
): ExpressionValue => {
  if (left.dimension === 'length' && right.dimension === 'length') {
    throw new Error('Length × length is not supported');
  }
  return {
    value: left.value * right.value,
    dimension:
      left.dimension === 'length' || right.dimension === 'length'
        ? 'length'
        : 'scalar',
  };
};

const divide = (
  left: ExpressionValue,
  right: ExpressionValue,
): ExpressionValue => {
  if (Math.abs(right.value) <= 1e-12) throw new Error('Division by zero');
  if (left.dimension === 'scalar' && right.dimension === 'length') {
    throw new Error('Scalar ÷ length is not supported');
  }
  return {
    value: left.value / right.value,
    dimension:
      left.dimension === 'length' && right.dimension === 'length'
        ? 'scalar'
        : left.dimension,
  };
};

export const evaluateExpression = (
  expression: string,
  context: ExpressionContext,
): ExpressionResult => {
  const references = new Set<string>();

  try {
    const tokens = tokenize(expression);
    let index = 0;

    const parsePrimary = (): ExpressionValue => {
      const token = tokens[index];
      if (!token) throw new Error('Unexpected end of expression');

      if (token.type === 'operator' && (token.value === '+' || token.value === '-')) {
        index += 1;
        const value = parsePrimary();
        return token.value === '-'
          ? { ...value, value: -value.value }
          : value;
      }

      if (token.type === 'number') {
        index += 1;
        if (!token.unit) {
          return { value: token.value, dimension: 'scalar' };
        }
        const millimeters = token.unit === 'm'
          ? token.value * 1000
          : token.value;
        return {
          value: millimetersToModelUnits(millimeters, context.mmPerUnit),
          dimension: 'length',
        };
      }

      if (token.type === 'identifier') {
        index += 1;
        references.add(token.value);
        const parameter = context.parameters?.[token.value];
        if (!parameter) {
          throw new Error(`Unknown parameter "${token.value}"`);
        }
        return parameter;
      }

      if (token.type === 'lparen') {
        index += 1;
        const value = parseAdditive();
        if (tokens[index]?.type !== 'rparen') {
          throw new Error('Missing closing parenthesis');
        }
        index += 1;
        return value;
      }

      throw new Error('Expected a number, parameter, or parenthesis');
    };

    const parseMultiplicative = (): ExpressionValue => {
      let left = parsePrimary();
      let current = tokens[index];
      while (
        current?.type === 'operator' &&
        (current.value === '*' || current.value === '/')
      ) {
        const operator = current.value;
        index += 1;
        const right = parsePrimary();
        left = operator === '*'
          ? multiply(left, right)
          : divide(left, right);
        current = tokens[index];
      }
      return left;
    };

    const parseAdditive = (): ExpressionValue => {
      let left = parseMultiplicative();
      let current = tokens[index];
      while (
        current?.type === 'operator' &&
        (current.value === '+' || current.value === '-')
      ) {
        const operator = current.value;
        index += 1;
        left = addOrSubtract(left, parseMultiplicative(), operator);
        current = tokens[index];
      }
      return left;
    };

    if (!tokens.length) throw new Error('Expression is empty');
    const result = parseAdditive();
    if (index !== tokens.length) throw new Error('Unexpected trailing token');

    return {
      ok: true,
      result,
      references: [...references],
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid expression',
      references: [...references],
    };
  }
};
