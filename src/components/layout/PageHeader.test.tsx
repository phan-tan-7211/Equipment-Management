import React from 'react';
import { render, screen } from '@vitest-harness/utils/test-utils';
import { describe, it, expect } from 'vitest';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  describe('density prop', () => {
    it('uses the compact spacing standard by default', () => {
      const { container } = render(<PageHeader title="Test Page" />);

      const root = container.querySelector('.space-y-1');
      expect(root).toBeInTheDocument();
      expect(root?.className).not.toContain('space-y-2');
      expect(root).toHaveClass('px-4');
    });

    it('renders compact density with stable tighter spacing', () => {
      const { container } = render(
        <PageHeader
          title="Detail Page"
          density="compact"
          breadcrumbs={[
            { label: 'List', href: '/list' },
            { label: 'Current' },
          ]}
        />,
      );

      const root = container.querySelector('.space-y-1');
      expect(root).toBeInTheDocument();
      expect(root?.className).not.toContain('lg:space-y-2');

      expect(screen.getByText('List')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Detail Page' })).toBeInTheDocument();
    });

    it('applies className alongside density classes', () => {
      const { container } = render(
        <PageHeader title="Custom" className="mt-8" density="compact" />,
      );

      const root = container.querySelector('.space-y-1');
      expect(root).toBeInTheDocument();
      expect(root?.className).toContain('mt-8');
    });

    it('renders an optional leading icon without changing the title scale', () => {
      const { container } = render(
        <PageHeader title="Equipment" icon={<span data-testid="header-icon" />} />,
      );

      expect(container.querySelector('[data-testid="header-icon"]')).toBeInTheDocument();
      expect(container.querySelector('h1')?.className).toContain('text-xl');
      expect(container.querySelector('h1')?.className).toContain('sm:text-2xl');
    });

    it('keeps inline mobile metadata to one rendered instance', () => {
      render(
        <PageHeader
          title="Notifications"
          meta={<span>1 unread</span>}
          inlineMetaOnMobile
        />,
      );

      expect(screen.getAllByText('1 unread')).toHaveLength(1);
    });
  });

  it('exposes route heading focus target for RouteAnnouncer', () => {
    render(<PageHeader title="Equipment" />);
    const heading = screen.getByRole('heading', { level: 1, name: 'Equipment' });
    expect(heading).toHaveAttribute('data-route-heading', 'true');
    expect(heading).toHaveAttribute('tabindex', '-1');
  });
});
