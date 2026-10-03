import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ImageUploadWithNote from '@/components/common/ImageUploadWithNote';

vi.mock('@/hooks/useLocalFilePreviewUrls', () => ({
  useLocalFilePreviewUrls: () => ({
    getPreviewUrl: () => 'blob:preview',
    revokePreviewUrl: vi.fn(),
    clearPreviewUrls: vi.fn(),
  }),
}));

vi.mock('@/i18n', () => ({
  useI18n: () => ({
    t: (key: string, values?: Record<string, unknown>) => {
      if (key === 'sharedUi.selectedImages') return `Selected ${String(values?.count ?? 0)}`;
      if (key === 'sharedUi.uploadImages') return `Upload ${String(values?.count ?? 0)} images`;
      if (key === 'sharedUi.imagesUploaded') return 'Images uploaded successfully!';
      return key;
    },
  }),
}));

describe('ImageUploadWithNote', () => {
  it('keeps only one copy when the same image is selected twice', () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<ImageUploadWithNote onUpload={onUpload} />);
    const input = container.querySelector('input[type="file"]');

    expect(input).toBeInstanceOf(HTMLInputElement);

    const first = new File(['same-image'], '1000085703.jpg', {
      type: 'image/jpeg',
      lastModified: 123,
    });
    const duplicate = new File(['same-image'], '1000085703.jpg', {
      type: 'image/jpeg',
      lastModified: 123,
    });

    fireEvent.change(input as HTMLInputElement, {
      target: { files: [first, duplicate] },
    });

    expect(screen.getByText('Selected 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Upload 1 images' }));

    expect(onUpload).toHaveBeenCalledTimes(1);
    expect(onUpload).toHaveBeenCalledWith([first]);
  });

  it('keeps files with the same name when their metadata differs', () => {
    const { container } = render(<ImageUploadWithNote onUpload={vi.fn()} />);
    const input = container.querySelector('input[type="file"]');

    expect(input).toBeInstanceOf(HTMLInputElement);

    const first = new File(['first'], 'photo.jpg', {
      type: 'image/jpeg',
      lastModified: 123,
    });
    const second = new File(['second'], 'photo.jpg', {
      type: 'image/jpeg',
      lastModified: 456,
    });

    fireEvent.change(input as HTMLInputElement, {
      target: { files: [first, second] },
    });

    expect(screen.getByText('Selected 2')).toBeInTheDocument();
  });
});
