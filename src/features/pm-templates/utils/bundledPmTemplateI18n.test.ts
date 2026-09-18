import { describe, expect, it } from 'vitest';
import {
  localizeBundledPmSectionName,
  localizeBundledPmTemplateMeta,
} from '@/features/pm-templates/utils/bundledPmTemplateI18n';

describe('bundledPmTemplateI18n', () => {
  const compressor = {
    name: 'Compressor PM',
    description: 'English compressor description',
    organization_id: null,
    is_protected: true,
  };

  it('localizes bundled template metadata in Vietnamese', () => {
    const result = localizeBundledPmTemplateMeta(compressor, 'vi');
    expect(result.name).toBe('Bảo trì định kỳ máy nén khí');
    expect(result.description).toContain('máy nén khí');
  });

  it('localizes bundled section names without changing stored section keys', () => {
    expect(localizeBundledPmSectionName('Visual Inspection', 'vi')).toBe('Kiểm tra trực quan');
    expect(localizeBundledPmSectionName('Engine Compartment', 'ko')).toBe('엔진룸');
    expect(localizeBundledPmSectionName('Visual Inspection', 'en')).toBe('Visual Inspection');
  });

  it('does not translate organization-authored templates', () => {
    const custom = {
      ...compressor,
      organization_id: 'org-1',
      is_protected: false,
      name: 'Compressor PM nội bộ',
      description: 'Nội dung do tổ chức quản lý',
    };
    expect(localizeBundledPmTemplateMeta(custom, 'ko')).toEqual({
      name: custom.name,
      description: custom.description,
    });
  });
});
