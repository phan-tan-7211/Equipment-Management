import { useQuery } from '@tanstack/react-query';
import { useAppToast } from '@/hooks/useAppToast';
import { 
  exportReport, 
  downloadBlob, 
  generateExportFilename,
  getReportRecordCount 
} from '@/features/reports/services/reportExportService';
import type { ReportType, ExportFilters } from '@/features/reports/types/reports';
import {
  downloadExportJobResult,
  showExportLoadingToast,
  waitForExportJob,
} from '@/features/reports/utils/exportJobClient';
import type { ReportTranslator } from '@/features/reports/utils/exportJobClient';
import { useI18n } from '@/i18n';

async function runReportExportWithLoadingToast(options: {
  reportType: ReportType;
  organizationId: string;
  organizationName: string;
  filters: ExportFilters;
  columns: string[];
  t: ReportTranslator;
}): Promise<void> {
  const { reportType, organizationId, organizationName, filters, columns, t } = options;
  const label = t(`reports.cards.${reportType}.title`);
  const loading = showExportLoadingToast(t('reports.preparingReport', { label }), t);

  try {
    const result = await exportReport(reportType, organizationId, filters, columns, { t });
    if (result instanceof Blob) {
      const filename = generateExportFilename(reportType, organizationName);
      downloadBlob(result, filename);
      loading.updateSuccess(t('reports.downloaded', { label }));
      return;
    }

    const status = await waitForExportJob(result.jobId, { t });
    if (status.status === 'failed') {
      throw new Error(status.errorMessage || t('reports.jobFailed'));
    }
    const filename = generateExportFilename(reportType, organizationName);
    await downloadExportJobResult(status, filename, t);
    loading.updateSuccess(
      t('reports.ready', { label, count: status.rowCount ?? 0 }),
      status.resultUrl ?? undefined,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : t('reports.exportError');
    loading.updateError(message);
    throw error;
  }
}

/**
 * Hook to get the record count for a report type
 * Used to show a preview count before export
 */
export function useReportRecordCount(
  reportType: ReportType,
  organizationId: string | undefined,
  filters: ExportFilters,
  accessibleTeamIds?: string[],
  options?: { scopeReady?: boolean },
) {
  const scopeReady = options?.scopeReady ?? true;

  return useQuery({
    queryKey: ['report-count', reportType, organizationId, filters, accessibleTeamIds],
    queryFn: () => {
      if (!organizationId) return 0;
      return getReportRecordCount(reportType, organizationId, filters, accessibleTeamIds);
    },
    enabled: !!organizationId && scopeReady,
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
  });
}

/**
 * Combined hook for managing report export dialog state and actions
 */
export function useReportExportDialog(
  organizationId: string | undefined,
  organizationName: string
) {
  const { t } = useI18n();
  const { toast } = useAppToast();

  const handleExport = async (
    reportType: ReportType,
    filters: ExportFilters,
    columns: string[]
  ) => {
    if (!organizationId) {
      toast({
        title: t('reports.exportFailed'),
        description: t('reports.organizationNotSelected'),
        variant: 'error',
      });
      return;
    }

    try {
      await runReportExportWithLoadingToast({
        reportType,
        organizationId,
        organizationName,
        filters,
        columns,
        t,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('reports.exportFailed');
      if (errorMessage.includes('Rate limit') || errorMessage === t('reports.rateExceeded')) {
        toast({
          title: t('reports.rateLimitExceeded'),
          description: t('reports.rateLimitHelp'),
          variant: 'warning',
        });
      }
      throw error;
    }
  };

  return { handleExport };
}
