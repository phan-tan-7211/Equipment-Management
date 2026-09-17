import React from 'react';
import { render, screen } from '@vitest-harness/utils/test-utils';
import { describe, expect, it } from 'vitest';
import PageSkeleton from './PageSkeleton';

describe('PageSkeleton', () => {
  it('starts with the shared workspace frame', () => {
    render(<PageSkeleton />);

    const status = screen.getByRole('status');
    const root = status.parentElement;

    expect(root).toHaveClass(
      'w-full',
      'mx-auto',
      'max-w-full',
      'flex',
      'h-full',
      'min-h-0',
      'flex-col',
      'p-px',
    );
    expect(root).toHaveClass('space-y-4');
  });
});
