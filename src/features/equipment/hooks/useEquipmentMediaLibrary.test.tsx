import { renderHook, waitFor } from '@vitest-harness/utils/test-utils';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createQueryClientWrapper } from '@vitest-harness/utils/query-client-wrapper';
import { useEquipmentMediaLibrary } from './useEquipmentMediaLibrary';
import * as equipmentImagesServiceModule from '@/features/equipment/services/equipmentImagesService';

vi.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: vi.fn(() => ({
    currentOrganization: { id: 'org-1', name: 'Test organization', userRole: 'admin' },
  })),
}));

vi.mock('@/features/equipment/services/equipmentImagesService', () => ({
  getAllEquipmentImages: vi.fn(),
  createEquipmentDisplayMediaItem: vi.fn(() => null),
}));

describe('useEquipmentMediaLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps a previous uploaded display image when another media item becomes representative', async () => {
    vi.mocked(equipmentImagesServiceModule.getAllEquipmentImages).mockResolvedValue([
      {
        id: 'previous-display-media',
        file_name: 'previous-display.jpg',
        file_url: 'https://example.com/signed-previous-display',
        description: 'display-image:display-images/org/org-1/equipment/eq-1/old-set/full.webp',
        created_at: '2026-07-04T10:00:00.000Z',
        uploaded_by: 'user-1',
        source_type: 'equipment_display',
      },
      {
        id: 'selected-media',
        file_name: 'selected-media.jpg',
        file_url: 'https://example.com/signed-selected-media',
        description: undefined,
        created_at: '2026-07-04T09:00:00.000Z',
        uploaded_by: 'user-1',
        source_type: 'equipment_note',
      },
    ]);

    const { result } = renderHook(
      () =>
        useEquipmentMediaLibrary({
          equipmentId: 'eq-1',
          organizationId: 'org-1',
          currentDisplayImage: 'https://example.com/signed-selected-media',
        }),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.images.map((image) => image.id)).toEqual([
      'previous-display-media',
      'selected-media',
    ]);
  });
});
