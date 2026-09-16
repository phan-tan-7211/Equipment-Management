import React from 'react';
import { fireEvent, render, waitFor } from '@vitest-harness/utils/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InventoryItemThumbnail } from './InventoryItemThumbnail';
import { getPrimaryInventoryItemImageRefs } from '@/features/inventory/services/inventoryListThumbnailService';
import { batchResolveInventoryItemImageDisplayUrls } from '@/services/imageUploadService';

vi.mock('@/features/inventory/services/inventoryListThumbnailService', () => ({
  getPrimaryInventoryItemImageRefs: vi.fn(),
}));

vi.mock('@/services/imageUploadService', () => ({
  displayableImageSrc: vi.fn((url: string | null | undefined) =>
    url?.startsWith('https://') ? url : null,
  ),
  batchResolveInventoryItemImageDisplayUrls: vi.fn(),
}));

const makeItem = (id: string, imageUrl: string | null = null) => ({
  id,
  organization_id: 'org-1',
  image_url: imageUrl,
});

describe('InventoryItemThumbnail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(hover: hover) and (pointer: fine)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('prefers the first inventory_item_images reference over legacy image_url', async () => {
    vi.mocked(getPrimaryInventoryItemImageRefs).mockResolvedValue({
      'item-primary': 'org-1/item-primary/primary.jpg',
    });
    vi.mocked(batchResolveInventoryItemImageDisplayUrls).mockResolvedValue([
      'https://signed.example.com/primary.jpg',
    ]);

    const { container } = render(
      <InventoryItemThumbnail
        item={makeItem('item-primary', 'https://example.com/legacy.jpg')}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('img')).toHaveAttribute(
        'src',
        'https://signed.example.com/primary.jpg',
      );
    });

    expect(getPrimaryInventoryItemImageRefs).toHaveBeenCalledWith('org-1', ['item-primary']);
    expect(batchResolveInventoryItemImageDisplayUrls).toHaveBeenCalledWith([
      'org-1/item-primary/primary.jpg',
    ]);
  });

  it('falls back to legacy image_url when no uploaded image row exists', async () => {
    vi.mocked(getPrimaryInventoryItemImageRefs).mockResolvedValue({});
    vi.mocked(batchResolveInventoryItemImageDisplayUrls).mockResolvedValue([
      'https://example.com/legacy-fallback.jpg',
    ]);

    const { container } = render(
      <InventoryItemThumbnail
        item={makeItem('item-fallback', 'https://example.com/legacy-fallback.jpg')}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('img')).toHaveAttribute(
        'src',
        'https://example.com/legacy-fallback.jpg',
      );
    });

    expect(batchResolveInventoryItemImageDisplayUrls).toHaveBeenCalledWith([
      'https://example.com/legacy-fallback.jpg',
    ]);
  });

  it('batches thumbnails mounted in the same render wave', async () => {
    vi.mocked(getPrimaryInventoryItemImageRefs).mockResolvedValue({
      'item-batch-a': 'org-1/item-batch-a/a.jpg',
      'item-batch-b': 'org-1/item-batch-b/b.jpg',
    });
    vi.mocked(batchResolveInventoryItemImageDisplayUrls).mockResolvedValue([
      'https://signed.example.com/a.jpg',
      'https://signed.example.com/b.jpg',
    ]);

    const { container } = render(
      <>
        <InventoryItemThumbnail item={makeItem('item-batch-a')} />
        <InventoryItemThumbnail item={makeItem('item-batch-b')} />
      </>,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('img')).toHaveLength(2);
    });

    expect(getPrimaryInventoryItemImageRefs).toHaveBeenCalledTimes(1);
    expect(getPrimaryInventoryItemImageRefs).toHaveBeenCalledWith('org-1', [
      'item-batch-a',
      'item-batch-b',
    ]);
    expect(batchResolveInventoryItemImageDisplayUrls).toHaveBeenCalledTimes(1);
  });

  it('opens a large contained preview for fine-pointer hover', async () => {
    vi.mocked(getPrimaryInventoryItemImageRefs).mockResolvedValue({
      'item-hover': 'org-1/item-hover/photo.jpg',
    });
    vi.mocked(batchResolveInventoryItemImageDisplayUrls).mockResolvedValue([
      'https://signed.example.com/hover.jpg',
    ]);

    const { container } = render(
      <InventoryItemThumbnail item={makeItem('item-hover')} />,
    );

    await waitFor(() => {
      expect(container.querySelector('img')).toHaveAttribute(
        'src',
        'https://signed.example.com/hover.jpg',
      );
    });

    const thumbnail = container.querySelector('[data-inventory-item-thumbnail]');
    expect(thumbnail).toHaveClass('cursor-zoom-in');

    fireEvent.pointerMove(thumbnail as Element, { clientX: 220, clientY: 240 });

    const preview = document.body.querySelector('[data-inventory-item-image-hover-preview]');
    expect(preview).not.toBeNull();
    expect(preview).toHaveClass('fixed');
    expect(preview).toHaveClass('opacity-100');
    expect(preview?.querySelector('img')).toHaveClass('object-contain');
  });

  it('keeps mobile thumbnails non-hoverable', async () => {
    vi.mocked(getPrimaryInventoryItemImageRefs).mockResolvedValue({
      'item-mobile': 'org-1/item-mobile/photo.jpg',
    });
    vi.mocked(batchResolveInventoryItemImageDisplayUrls).mockResolvedValue([
      'https://signed.example.com/mobile.jpg',
    ]);

    const { container } = render(
      <InventoryItemThumbnail item={makeItem('item-mobile')} enableHover={false} size="md" />,
    );

    await waitFor(() => {
      expect(container.querySelector('img')).toHaveAttribute(
        'src',
        'https://signed.example.com/mobile.jpg',
      );
    });

    const thumbnail = container.querySelector('[data-inventory-item-thumbnail]');
    expect(thumbnail).toHaveClass('h-12');
    expect(thumbnail).not.toHaveClass('cursor-zoom-in');

    fireEvent.pointerMove(thumbnail as Element, { clientX: 220, clientY: 240 });
    expect(document.body.querySelector('[data-inventory-item-image-hover-preview]')).toBeNull();
  });
});
