import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@vitest-harness/utils/test-utils';
import Page from './Page';

describe('Page', () => {
  it('uses the shared full-width workspace frame', () => {
    const { container } = render(
      <Page maxWidth="7xl" padding="workspace">
        <div>content</div>
      </Page>,
    );

    const root = screen.getByText('content').parentElement;
    expect(root).toHaveClass('w-full', 'mx-auto', 'max-w-full', 'flex', 'h-full', 'min-h-0', 'flex-col', 'p-px');
    expect(root).not.toHaveClass('max-w-7xl');
  });
});
