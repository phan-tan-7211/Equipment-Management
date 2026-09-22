import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { __operatorCheckinReportExportTestables } from '@/features/operator-check-ins/services/operatorCheckinReportExportHelpers';
import { downloadOperatorCheckinDailyPdf } from './operatorCheckinReportPdfService';
import type { OperatorCheckinSubmission } from './operatorCheckinSubmissionsService';

const { downloadBlob } = vi.hoisted(() => ({ downloadBlob: vi.fn() }));
vi.mock('@/utils/exportUtils', () => ({ downloadBlob }));

describe('operatorCheckinReportPdfService', () => {
  it('sanitizes filename parts', () => {
    expect(__operatorCheckinReportExportTestables.sanitizeFilenamePart('Truck #101')).toBe('Truck-101');
  });

  it.each(['vi', 'ko'] as const)('embeds the Unicode font in a real %s PDF', async (language) => {
    const font = readFileSync(fileURLToPath(new URL('../assets/ZNTEQR-Report-KR-VI.ttf', import.meta.url)));
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength),
    } as Response);

    const submission = {
      id: 'pdf-test', organization_id: 'org', equipment_id: 'eq', template_id: 'tpl', settings_id: 'settings',
      submitted_at: '2026-07-04T14:30:00.000Z', template_snapshot: {
        name: language === 'vi' ? 'Kiểm tra thiết bị' : '장비 점검', checklistItems: [
          { id: 'safety', title: language === 'vi' ? 'Phanh an toàn' : '안전 브레이크', required: true, section: language === 'vi' ? 'An toàn' : '안전' },
        ], dataFields: [],
      },
      operator_field_values: [], client_field_values: [], equipment_field_values: [],
      checklist_answers: [{ item_id: 'safety', passed: false, notes: language === 'vi' ? 'Cần sửa chữa' : '수리 필요' }],
      is_complete: true, required_item_count: 1, answered_required_count: 1,
      equipment: { id: 'eq', name: language === 'vi' ? 'Máy xúc số 1' : '굴착기 1', serial_number: 'SN-1' },
    } as OperatorCheckinSubmission;
    await downloadOperatorCheckinDailyPdf([submission], { startDate: '2026-07-04', endDate: '2026-07-04' },
      submission.template_snapshot.name as string, submission.equipment!.name, undefined, language);
    const blob = downloadBlob.mock.lastCall?.[0] as Blob;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(new TextDecoder().decode(bytes.slice(0, 8))).toContain('%PDF');
    expect(bytes.byteLength).toBeGreaterThan(10_000);
    if (process.env.PDF_VERIFY_OUTPUT) writeFileSync(`${process.env.PDF_VERIFY_OUTPUT}-${language}.pdf`, bytes);
    vi.restoreAllMocks();
  });
});
