import { describe, it, expect } from 'vitest';
import {
  getEquipmentStatusBackgroundTint,
  getEquipmentStatusBorderClass,
  getEquipmentStatusRailClass,
} from '@/lib/status-colors';

describe('equipment status rail classes', () => {
  it('returns an operational rail without a tint for active equipment', () => {
    expect(getEquipmentStatusBorderClass('active')).toContain('border-l-equipment-operational');
    expect(getEquipmentStatusRailClass('active')).toBe('bg-equipment-operational');
    expect(getEquipmentStatusBackgroundTint('active')).toBe('');
  });

  it('returns maintenance rail and tint for maintenance status', () => {
    expect(getEquipmentStatusBorderClass('maintenance')).toContain('border-l-equipment-maintenance');
    expect(getEquipmentStatusRailClass('maintenance')).toBe('bg-equipment-maintenance');
    expect(getEquipmentStatusBackgroundTint('maintenance')).toContain('equipment-maintenance');
  });

  it('returns the neutral inactive rail for inactive status', () => {
    expect(getEquipmentStatusBorderClass('inactive')).toContain('border-l-equipment-inactive');
    expect(getEquipmentStatusRailClass('inactive')).toBe('bg-equipment-inactive');
  });

  it('keeps retired equipment on the destructive red rail', () => {
    expect(getEquipmentStatusBorderClass('retired')).toContain('border-l-equipment-retired');
    expect(getEquipmentStatusRailClass('retired')).toBe('bg-equipment-retired');
  });
});
