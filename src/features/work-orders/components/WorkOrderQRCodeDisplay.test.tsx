import { fireEvent, render, screen } from '@vitest-harness/utils/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkOrderQRCodeDisplay from './WorkOrderQRCodeDisplay';

const locale = vi.hoisted(() => ({ value: 'vi' as 'vi' | 'en' | 'ko' }));

vi.mock('@/i18n', async () => {
  const { workOrderQRResources } = await import('@/i18n/workOrderQRResources');
  return {
    useI18n: () => ({
      t: (key: string, params?: { name?: string }) => {
        const name = key.split('.')[1] as keyof typeof workOrderQRResources.en.workOrderQR;
        return workOrderQRResources[locale.value].workOrderQR[name].replace('{{name}}', params?.name ?? '{{name}}');
      },
    }),
  };
});
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/components/common/AssetQRCodePanel', () => ({
  default: ({ instructionBullets, qrImageAlt }: { instructionBullets: string[]; qrImageAlt: string }) => (
    <div aria-label={qrImageAlt}>{instructionBullets.map((instruction) => <p key={instruction}>{instruction}</p>)}</div>
  ),
}));

describe('WorkOrderQRCodeDisplay translations', () => {
  beforeEach(() => { locale.value = 'vi'; });

  it('explains the QR-only flow without exposing the internal worksheet', () => {
    render(<WorkOrderQRCodeDisplay open onClose={vi.fn()} workOrderId="wo-1" workOrderTitle="Máy bơm" onPrintFieldWorksheet={vi.fn()} />);
    expect(screen.getByText('Mã QR và in lệnh công việc')).toBeInTheDocument();
    expect(screen.getByText(/Máy bơm/)).toBeInTheDocument();
    expect(screen.getByLabelText('Mã QR của lệnh công việc')).toBeInTheDocument();
    expect(screen.getByText(/Tải mã QR này/)).toBeInTheDocument();
    expect(screen.queryByText('In phiếu công việc hiện trường (PDF)')).not.toBeInTheDocument();
  });

  it('renders the internal worksheet and retains the print action in Korean', () => {
    locale.value = 'ko';
    const onPrintFieldWorksheet = vi.fn();
    render(<WorkOrderQRCodeDisplay open onClose={vi.fn()} workOrderId="wo-2" onPrintFieldWorksheet={onPrintFieldWorksheet} showFieldWorksheet />);
    expect(screen.getByText(/작업 지시 wo-2/)).toBeInTheDocument();
    expect(screen.getByText('인쇄용 현장 작업표')).toBeInTheDocument();
    expect(screen.getByText(/작업표 하단의 QR 코드/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '현장 작업표 인쇄 (PDF)' }));
    expect(onPrintFieldWorksheet).toHaveBeenCalledOnce();
  });
});
