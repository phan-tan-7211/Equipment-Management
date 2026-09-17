import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@vitest-harness/utils/test-utils';
import { OperatorTemplateEquipmentAssignmentMenu } from './OperatorTemplateEquipmentAssignmentMenu';
import type { EquipmentSummary } from '@/features/equipment/services/EquipmentService';

vi.mock('@/features/inventory/components/InventoryEquipmentThumbnail', () => ({
  InventoryEquipmentThumbnail: ({
    equipment,
  }: {
    equipment: { id: string; image_url?: string | null };
  }) => (
    <div
      data-testid={`equipment-thumbnail-${equipment.id}`}
      data-image-url={equipment.image_url ?? ''}
    />
  ),
}));

function makeEquipment(overrides: Partial<EquipmentSummary> = {}): EquipmentSummary {
  return {
    id: overrides.id ?? 'eq-1',
    organization_id: 'org-1',
    name: overrides.name ?? 'Equipment',
    manufacturer: null,
    model: null,
    serial_number: overrides.serial_number ?? null,
    status: 'active',
    team_id: overrides.team_id ?? null,
    location: overrides.location ?? null,
    image_url: overrides.image_url ?? null,
    working_hours: null,
    last_maintenance: null,
    last_known_location: null,
    team: null,
    team_name: overrides.team_name,
    default_pm_template_id: null,
  };
}

describe('OperatorTemplateEquipmentAssignmentMenu equipment thumbnails', () => {
  it('renders the shared equipment thumbnail for each assignment row', async () => {
    render(
      <OperatorTemplateEquipmentAssignmentMenu
        templateId="template-1"
        templateName="Chain Conveyor Oven Daily Pre-Start"
        equipment={[
          makeEquipment({
            id: 'eq-1',
            name: 'băng chuyền sấy',
            serial_number: 'SN-1',
            team_name: 'BP - wpc, solder DY',
            image_url: 'https://example.com/equipment-1.jpg',
          }),
        ]}
        assignments={[]}
        isEquipmentLoading={false}
        isAssignmentsLoading={false}
        isAssigning={false}
        onAssignEquipmentIds={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Assign to equipment/i }));

    const thumbnail = await screen.findByTestId('equipment-thumbnail-eq-1');
    expect(thumbnail).toHaveAttribute('data-image-url', 'https://example.com/equipment-1.jpg');
  });
});
