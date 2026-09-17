import { beforeEach, describe, expect, it, vi } from 'vitest';
import { persistCurrentEquipmentDisplayImageIfNeeded } from './equipmentDisplayMediaService';
import * as equipmentNotesServiceModule from './equipmentNotesService';
import type { EquipmentImageData } from './equipmentImagesService';

vi.mock('./equipmentNotesService', () => ({
  createEquipmentNoteWithImages: vi.fn(),
}));

function image(overrides: Partial<EquipmentImageData>): EquipmentImageData {
  return {
    id: 'image-1',
    file_name: 'image.jpg',
    file_url: 'https://example.com/image.jpg',
    created_at: '2026-07-04T10:00:00.000Z',
    uploaded_by: 'user-1',
    source_type: 'equipment_note',
    ...overrides,
  };
}

describe('equipmentDisplayMediaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('materializes an older synthetic display card before switching display images', async () => {
    const currentRef = 'display-images/org/org-1/equipment/eq-1/old-set/full.webp';
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      blob: vi.fn().mockResolvedValue(new Blob(['old display'], { type: 'image/webp' })),
    } as unknown as Response);

    await persistCurrentEquipmentDisplayImageIfNeeded({
      equipmentId: 'eq-1',
      organizationId: 'org-1',
      currentDisplayImage: currentRef,
      images: [
        image({
          id: `equipment-display:${currentRef}`,
          file_url: 'https://example.com/old-display.webp',
          source_type: 'equipment_display',
        }),
      ],
      userName: 'tester',
      equipmentName: 'Press 1',
    });

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/old-display.webp');
    expect(equipmentNotesServiceModule.createEquipmentNoteWithImages).toHaveBeenCalledWith(
      'eq-1',
      'tester preserved a previous display image',
      0,
      false,
      [expect.objectContaining({ name: 'Press-1-display.webp', type: 'image/webp' })],
      'org-1',
      null,
      `display-image:${currentRef}`,
    );
  });

  it('does not create a duplicate media record when the display marker already exists', async () => {
    const currentRef = 'display-images/org/org-1/equipment/eq-1/current-set/full.webp';

    await persistCurrentEquipmentDisplayImageIfNeeded({
      equipmentId: 'eq-1',
      organizationId: 'org-1',
      currentDisplayImage: currentRef,
      images: [
        image({
          description: `display-image:${currentRef}`,
        }),
      ],
      userName: 'tester',
    });

    expect(fetch).not.toHaveBeenCalled();
    expect(equipmentNotesServiceModule.createEquipmentNoteWithImages).not.toHaveBeenCalled();
  });
});
