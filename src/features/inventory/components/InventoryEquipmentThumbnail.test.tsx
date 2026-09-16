import React from 'react';
import { fireEvent, render, waitFor } from '@vitest-harness/utils/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InventoryEquipmentThumbnail } from './InventoryEquipmentThumbnail';
import {
  batchResolveEquipmentDisplayImageUrls,
  displayableImageSrc,
} from '@/services/imageUploadService';

vi.mock('@/services/imageUploadService', () => ({
  displayableImageSrc: vi.fn((url: string | null | undefined) =>
    url?.startsWith('https://') ? url : null,
  ),
  batchResolveEquipmentDisplayImageUrls: vi.fn(),
}));

describe('InventoryEquipmentThumbnail', () => {
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

  it('batch-resolves a stored equipment image path before rendering it', async () => {
    vi.mocked(batchResolveEquipmentDisplayImageUrls).mockResolvedValue([
      'https://signed.example.com/equipment-1.jpg',
    ]);

    const { container } = render(
      <InventoryEquipmentThumbnail
        equipment={{
          id: 'equipment-1',
          image_url: 'user-1/equipment-1/photo.jpg',
        }}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector('img')).toHaveAttribute(
        'src',
        'https://signed.example.com/equipment-1.jpg',
      );
    });

    expect(batchResolveEquipmentDisplayImageUrls).toHaveBeenCalledWith(
      ['user-1/equipment-1/photo.jpg'],
      { equipmentIds: ['equipment-1'] },
    );
  });

  it('uses an already displayable image without signing it again', () => {
    const { container } = render(
      <InventoryEquipmentThumbnail
        equipment={{
          id: 'equipment-2',
          image_url: 'https://example.com/equipment-2.jpg',
        }}
      />,
    );

    expect(displayableImageSrc).toHaveBeenCalledWith('https://example.com/equipment-2.jpg');
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/equipment-2.jpg',
    );
    expect(batchResolveEquipmentDisplayImageUrls).not.toHaveBeenCalled();
  });

  it('shows the same large hover preview pattern used by the equipment list', () => {
    const { container } = render(
      <InventoryEquipmentThumbnail
        equipment={{
          id: 'equipment-3',
          image_url: 'https://example.com/equipment-3.jpg',
        }}
      />,
    );

    const thumbnail = container.querySelector('[data-inventory-equipment-thumbnail]');
    expect(thumbnail).not.toBeNull();
    expect(thumbnail).toHaveClass('cursor-zoom-in');

    fireEvent.pointerMove(thumbnail as Element, { clientX: 220, clientY: 240 });

    const preview = document.body.querySelector('[data-equipment-image-hover-preview]');
    expect(preview).not.toBeNull();
    expect(preview).toHaveClass('fixed');
    expect(preview).toHaveClass('opacity-100');
    expect(preview?.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/equipment-3.jpg',
    );
    expect(preview?.querySelector('img')).toHaveClass('object-contain');
  });

  it('does not open a hover preview on non-hover pointers', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      media: '(hover: hover) and (pointer: fine)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { container } = render(
      <InventoryEquipmentThumbnail
        equipment={{
          id: 'equipment-4',
          image_url: 'https://example.com/equipment-4.jpg',
        }}
      />,
    );

    const thumbnail = container.querySelector('[data-inventory-equipment-thumbnail]');
    fireEvent.pointerMove(thumbnail as Element, { clientX: 220, clientY: 240 });

    expect(document.body.querySelector('[data-equipment-image-hover-preview]')).toBeNull();
  });
});
