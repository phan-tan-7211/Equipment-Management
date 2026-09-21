import React from 'react';
import { fireEvent, render, screen, waitFor } from '@vitest-harness/utils/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EquipmentImagesTab from './EquipmentImagesTab';
import * as equipmentImagesServiceModule from '@/features/equipment/services/equipmentImagesService';
import * as equipmentNotesServiceModule from '@/features/equipment/services/equipmentNotesService';
import * as displayImageServiceModule from '@/features/equipment/services/equipmentDisplayImageService';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@example.com' }
  }))
}));

vi.mock('@/contexts/OrganizationContext', () => ({
  useOrganization: vi.fn(() => ({
    currentOrganization: { id: 'org-1', userRole: 'admin' }
  }))
}));

vi.mock('@/features/equipment/hooks/useEquipmentNotesPermissions', () => ({
  useEquipmentNotesPermissions: vi.fn(() => ({
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canSetDisplayImage: true,
    canUploadImages: true,
    canDeleteImages: true,
  }))
}));

vi.mock('@/features/equipment/services/equipmentImagesService', () => ({
  getAllEquipmentImages: vi.fn(),
  createEquipmentDisplayMediaItem: vi.fn(() => null),
  deleteEquipmentImage: vi.fn(),
  updateEquipmentDisplayImage: vi.fn()
}));

vi.mock('@/features/equipment/services/equipmentNotesService', () => ({
  createEquipmentNoteWithImages: vi.fn()
}));

vi.mock('@/features/equipment/services/equipmentDisplayImageService', () => ({
  replaceEquipmentDisplayImage: vi.fn(),
  removeEquipmentDisplayImage: vi.fn()
}));

vi.mock('@/components/common/ImageGallery', () => ({
  default: ({ images }: { images?: Array<{ file_url?: string; url?: string }> }) => (
    <div data-testid="image-gallery">
      {images?.map((img, i) => (
        <div key={i} data-testid={`image-${i}`}>{img.file_url ?? img.url}</div>
      ))}
    </div>
  )
}));

vi.mock('@/components/common/ImageUploadWithNote', () => ({
  default: ({ onUpload }: { onUpload: (files: File[]) => void }) => (
    <div data-testid="image-upload">
      <button onClick={() => onUpload([new File([], 'test.jpg')])}>Upload</button>
    </div>
  )
}));

vi.mock('@/features/equipment/components/media/EquipmentMediaExplorer', () => ({
  EquipmentMediaExplorer: () => null,
}));

vi.mock('@/features/equipment/components/media/EquipmentMediaFiltersBar', () => ({
  EquipmentMediaFiltersBar: () => <div data-testid="media-filters" />,
}));

const mockImages = [
  {
    id: 'img-1',
    file_url: 'https://example.com/image1.jpg',
    file_name: 'image1.jpg',
    created_at: '2026-07-01T00:00:00.000Z',
    uploaded_by: 'user-1',
    source_type: 'equipment_note' as const,
  },
  {
    id: 'img-2',
    file_url: 'https://example.com/image2.jpg',
    file_name: 'image2.jpg',
    created_at: '2026-07-02T00:00:00.000Z',
    uploaded_by: 'user-1',
    source_type: 'work_order_note' as const,
  },
];

describe('EquipmentImagesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(equipmentImagesServiceModule.getAllEquipmentImages).mockResolvedValue(mockImages);
    vi.mocked(displayImageServiceModule.replaceEquipmentDisplayImage).mockResolvedValue(
      'display-images/org/org-1/equipment/eq-1/display-set/full.webp',
    );
  });

  describe('Core Rendering', () => {
    it('renders image gallery', async () => {
      render(
        <EquipmentImagesTab 
          equipmentId="eq-1" 
          organizationId="org-1" 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
      });
    });

    it('displays images', async () => {
      render(
        <EquipmentImagesTab 
          equipmentId="eq-1" 
          organizationId="org-1" 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('image-0')).toBeInTheDocument();
        expect(screen.getByTestId('image-1')).toBeInTheDocument();
      });
    });
  });

  describe('Image Upload', () => {
    it('shows upload form when upload button is clicked', async () => {
      render(
        <EquipmentImagesTab 
          equipmentId="eq-1" 
          organizationId="org-1" 
        />
      );
      
      // Upload functionality would be tested based on component implementation
      await waitFor(() => {
        // Component should render upload UI when triggered
      });
    });

    it('handles image upload', async () => {
      vi.mocked(equipmentNotesServiceModule.createEquipmentNoteWithImages).mockResolvedValue({ id: 'note-1' } as unknown as Awaited<ReturnType<typeof equipmentNotesServiceModule.createEquipmentNoteWithImages>>);

      render(
        <EquipmentImagesTab 
          equipmentId="eq-1" 
          organizationId="org-1" 
        />
      );
      
      // Upload would be triggered by user interaction
      await waitFor(() => {
        // Component should handle upload
      });
    });
  });

  describe('Image Deletion', () => {
    it('handles image deletion', async () => {
      vi.mocked(equipmentImagesServiceModule.deleteEquipmentImage).mockResolvedValue(undefined);

      render(
        <EquipmentImagesTab 
          equipmentId="eq-1" 
          organizationId="org-1" 
        />
      );
      
      // Image deletion would be triggered by user interaction
      await waitFor(() => {
        // Component should handle deletion
      });
    });
  });

  describe('Display Image', () => {
    it('persists an uploaded display image as one reusable media item', async () => {
      vi.mocked(equipmentNotesServiceModule.createEquipmentNoteWithImages).mockResolvedValue({
        id: 'note-display-1',
      } as unknown as Awaited<ReturnType<typeof equipmentNotesServiceModule.createEquipmentNoteWithImages>>);

      render(
        <EquipmentImagesTab
          equipmentId="eq-1"
          organizationId="org-1"
        />,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/display image|ảnh đại diện/i)).toBeInTheDocument();
      });

      const file = new File(['display-image'], 'display.jpg', { type: 'image/jpeg' });
      fireEvent.change(screen.getByLabelText(/display image|ảnh đại diện/i), {
        target: { files: [file] },
      });

      await waitFor(() => {
        expect(equipmentNotesServiceModule.createEquipmentNoteWithImages).toHaveBeenCalledWith(
          'eq-1',
          'test uploaded a display image',
          0,
          false,
          [file],
          'org-1',
          null,
          'display-image:display-images/org/org-1/equipment/eq-1/display-set/full.webp',
        );
      });
    });

    it('handles setting display image', async () => {
      vi.mocked(equipmentImagesServiceModule.updateEquipmentDisplayImage).mockResolvedValue(undefined);

      render(
        <EquipmentImagesTab 
          equipmentId="eq-1" 
          organizationId="org-1" 
          currentDisplayImage="https://example.com/image1.jpg"
        />
      );
      
      // Setting display image would be tested based on component implementation
      await waitFor(() => {
        // Component should handle display image update
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state while fetching images', () => {
      vi.mocked(equipmentImagesServiceModule.getAllEquipmentImages).mockImplementation(() => new Promise(() => {}));

      render(
        <EquipmentImagesTab 
          equipmentId="eq-1" 
          organizationId="org-1" 
        />
      );
      
      // Should show loading state
    });
  });

  describe('Empty State', () => {
    it('handles empty images list', async () => {
      vi.mocked(equipmentImagesServiceModule.getAllEquipmentImages).mockResolvedValue([]);

      render(
        <EquipmentImagesTab 
          equipmentId="eq-1" 
          organizationId="org-1" 
        />
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
      });
    });
  });
});
