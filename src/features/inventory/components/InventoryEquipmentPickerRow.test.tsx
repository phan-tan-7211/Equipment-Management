import React from 'react';
import { render, screen } from '@vitest-harness/utils/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { InventoryEquipmentPickerRow } from './InventoryEquipmentPickerRow';

describe('InventoryEquipmentPickerRow', () => {
  it('renders a compact equipment thumbnail when an image is available', () => {
    const { container } = render(
      <InventoryEquipmentPickerRow
        equipment={{
          id: 'equipment-1',
          name: 'Forklift 17',
          manufacturer: 'Toyota',
          model: '8FBN',
          image_url: 'https://example.com/forklift.jpg',
        }}
        isSelected={false}
        onToggle={vi.fn()}
      />,
    );

    const image = container.querySelector('img');
    expect(image).not.toBeNull();
    expect(image).toHaveAttribute('src', 'https://example.com/forklift.jpg');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveClass('object-cover');
    expect(screen.getByText('Forklift 17')).toBeInTheDocument();
  });

  it('keeps the picker row usable when equipment has no image', () => {
    const { container } = render(
      <InventoryEquipmentPickerRow
        equipment={{
          id: 'equipment-2',
          name: 'Vernier Calipers',
          manufacturer: 'Mitutoyo',
          model: '500-196-30',
          image_url: null,
        }}
        isSelected={false}
        onToggle={vi.fn()}
      />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('Vernier Calipers')).toBeInTheDocument();
  });
});
