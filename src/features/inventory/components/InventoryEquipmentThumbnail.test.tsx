import React from 'react';
import { render, waitFor } from '@vitest-harness/utils/test-utils';
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
});
