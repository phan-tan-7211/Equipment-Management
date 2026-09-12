import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@vitest-harness/utils/test-utils';
import { OperatorCheckinReportExportDialog } from '@/features/operator-check-ins/components/OperatorCheckinReportExportDialog';
import type { OperatorCheckinSubmission } from '@/features/operator-check-ins/services/operatorCheckinSubmissionsService';
import { I18nProvider } from '@/i18n/I18nProvider';

function makeSubmission(): OperatorCheckinSubmission {
  return {
    id: 'sub-1',
    organization_id: 'org-1',
    equipment_id: 'eq-1',
    template_id: 'template-1',
    settings_id: 'settings-1',
    submitted_at: '2026-07-04T14:30:00.000Z',
    template_snapshot: { name: 'Odometer Log', checklistItems: [], dataFields: [] },
    operator_field_values: [],
    client_field_values: [],
    equipment_field_values: [],
    checklist_answers: [],
    is_complete: true,
    required_item_count: 0,
    answered_required_count: 0,
    equipment: { id: 'eq-1', name: 'Truck 101', serial_number: 'SN-1' },
  };
}

describe('OperatorCheckinReportExportDialog', () => {
  it.each([
    ['vi', 'Xuất báo cáo hằng ngày', 'Bảng tính Excel'],
    ['ko', '일일 보고서 내보내기', 'Excel 통합 문서'],
  ])('renders localized export controls in %s', (language, heading, excelLabel) => {
    window.localStorage.setItem('znteqr-language', language);
    try {
      render(
        <I18nProvider>
          <OperatorCheckinReportExportDialog
            open
            onOpenChange={vi.fn()}
            reportDateRangeLabel="2026-07-04"
            templateName="Odometer Log"
            equipmentLabel="Truck 101"
            submissions={[makeSubmission()]}
            onExport={vi.fn()}
          />
        </I18nProvider>,
      );
      expect(screen.getByRole('dialog', { name: heading })).toBeInTheDocument();
      expect(screen.getByLabelText(excelLabel)).toBeInTheDocument();
    } finally {
      window.localStorage.removeItem('znteqr-language');
    }
  });

  it('defaults to compact PDF and calls export handler with selected format', async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);

    render(
      <OperatorCheckinReportExportDialog
        open
        onOpenChange={vi.fn()}
        reportDateRangeLabel="2026-07-04"
        templateName="Odometer Log"
        equipmentLabel="All equipment"
        submissions={[makeSubmission()]}
        onExport={onExport}
      />,
    );

    expect(screen.getByText('Compact review')).toBeInTheDocument();
    expect(screen.getByLabelText(/PDF/i)).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /Download report/i }));

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'pdf',
          detailLevel: 'compact',
        }),
      );
    });
  });

  it('passes xlsx format when Excel is selected', async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);

    render(
      <OperatorCheckinReportExportDialog
        open
        onOpenChange={vi.fn()}
        reportDateRangeLabel="2026-07-04"
        templateName="Odometer Log"
        equipmentLabel="All equipment"
        submissions={[makeSubmission()]}
        onExport={onExport}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Excel workbook/i));
    fireEvent.click(screen.getByRole('button', { name: /Download report/i }));

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'xlsx' }),
      );
    });
  });
});
