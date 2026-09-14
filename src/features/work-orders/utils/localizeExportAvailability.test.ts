import { describe, expect, it } from 'vitest';
import { workOrderExportUiResources } from '@/i18n/workOrderExportUiResources';
import { getGoogleDriveCreateAvailability, getGoogleDriveOpenAvailability } from '@/features/work-orders/components/googleDriveExportPresentation';
import { getQuickBooksExportAvailability } from './quickBooksExportPresentation';
import { localizeDriveTooltip, localizeQuickBooksTooltip } from './localizeExportAvailability';

function translate(language: 'vi' | 'ko') {
  const resources = workOrderExportUiResources[language].workOrderExportUi as Record<string, string>;
  return (key: string, params?: Record<string, string | number>) =>
    resources[key.replace('workOrderExportUi.', '')]?.replace(/{{(\w+)}}/g, (_match, token: string) => String(params?.[token] ?? '')) ?? key;
}

describe('work order export UI presentation', () => {
  it('localizes Drive availability while preserving disabled state and file format', () => {
    const availability = getGoogleDriveCreateAvailability({ canExport: false, isBusy: false, hasLinkedArtifact: false });
    expect(availability.disabled).toBe(true);
    expect(localizeDriveTooltip(availability.tooltip, 'PDF', translate('vi'))).toContain('Không thể xuất qua Google Workspace');
    const open = getGoogleDriveOpenAvailability(false, 'pdf');
    expect(localizeDriveTooltip(open.tooltip, 'PDF', translate('ko'))).toContain('PDF');
  });

  it('localizes QuickBooks copy without changing invoice ID or export eligibility', () => {
    const availability = getQuickBooksExportAvailability({
      isCompleted: true, isConnected: true, hasTeam: true, hasMapping: true,
      isExporting: false, alreadyExported: true, hasInvoiceIdentifiers: true,
      invoiceDisplay: 'INV-1024',
    });
    expect(availability.isDisabled).toBe(false);
    expect(localizeQuickBooksTooltip(availability.tooltipMessage, 'INV-1024', translate('vi')))
      .toBe('Đã xuất trước đó thành hóa đơn INV-1024. Nhấn để cập nhật.');
  });
});
