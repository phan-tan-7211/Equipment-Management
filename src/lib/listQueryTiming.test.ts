import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LIST_QUERY_GC_TIME,
  resolveListQueryGcTime,
} from './listQueryTiming';

describe('resolveListQueryGcTime', () => {
  it('uses the default repeat-navigation retention window', () => {
    expect(resolveListQueryGcTime(5 * 60 * 1000)).toBe(
      DEFAULT_LIST_QUERY_GC_TIME,
    );
  });

  it('never lets retention end before the freshness window', () => {
    expect(resolveListQueryGcTime(45 * 60 * 1000)).toBe(45 * 60 * 1000);
    expect(resolveListQueryGcTime(45 * 60 * 1000, 10 * 60 * 1000)).toBe(
      45 * 60 * 1000,
    );
  });

  it('honors an explicit longer retention window', () => {
    expect(resolveListQueryGcTime(5 * 60 * 1000, 60 * 60 * 1000)).toBe(
      60 * 60 * 1000,
    );
  });
});
