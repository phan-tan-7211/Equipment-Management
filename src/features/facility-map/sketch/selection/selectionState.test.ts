import { describe, expect, it } from 'vitest';

import { toggleSelection } from '@/features/facility-map/sketch/selection/selectionState';

describe('selection state', () => {
  it('adds an entity that is not selected', () => {
    expect(toggleSelection(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('removes an entity that is already selected', () => {
    expect(toggleSelection(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('does not mutate the source selection', () => {
    const source = ['a'];
    const next = toggleSelection(source, 'b');

    expect(source).toEqual(['a']);
    expect(next).not.toBe(source);
  });
});
