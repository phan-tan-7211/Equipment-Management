import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { supabase } from '@/integrations/supabase/client';
import { downloadBlob } from '@/utils/exportUtils';
import { logger } from '@/utils/logger';
import { reportsResources } from '@/i18n/reportsResources';

export type ReportTranslator = (key: string, params?: Record<string, string | number>) => string;

const fallbackReportTranslation: ReportTranslator = (key, params) => {
  const value = key.split('.').reduce<unknown>((current, segment) =>
    current && typeof current === 'object' ? (current as Record<string, unknown>)[segment] : undefined,
  { reports: reportsResources.en.reports });
  return typeof value === 'string'
    ? value.replace(/{{\s*([^}\s]+)\s*}}/g, (_match, token: string) => String(params?.[token] ?? `{{${token}}}`))
    : key;
};

export type ExportJobStatus = {
  success: boolean;
  jobId?: string;
  status?: string;
  reportType?: string;
  rowCount?: number;
  resultUrl?: string | null;
  resultStoragePath?: string | null;
  errorMessage?: string | null;
  code?: string;
};

const TERMINAL = new Set(['completed', 'failed', 'rate_limited']);

/**
 * Show a persistent loading toast while an export (sync or async) is in flight.
 * Returns update/dismiss helpers so callers can flip to success/error.
 */
export function showExportLoadingToast(label: string, t: ReportTranslator = fallbackReportTranslation) {
  const handle = toast({
    title: t('reports.exportInProgress'),
    description: t('reports.loadingExportDescription', { label }),
    duration: Infinity,
  });

  return {
    id: handle.id,
    updateSuccess: (description: string, downloadUrl?: string) => {
      handle.update({
        id: handle.id,
        title: t('reports.exportComplete'),
        description,
        duration: 8000,
        action: downloadUrl
          ? (
              <ToastAction
                altText={t('reports.downloadExport')}
                onClick={() => window.open(downloadUrl, '_blank', 'noopener,noreferrer')}
              >
                {t('reports.download')}
              </ToastAction>
            )
          : undefined,
      });
    },
    updateError: (description: string) => {
      handle.update({
        id: handle.id,
        title: t('reports.exportFailed'),
        description,
        variant: 'destructive',
        duration: 8000,
      });
    },
    dismiss: () => handle.dismiss(),
  };
}

export async function getExportJobStatus(jobId: string): Promise<ExportJobStatus> {
  const { data, error } = await supabase.rpc('get_export_job_status', {
    p_job_id: jobId,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? { success: false }) as ExportJobStatus;
}

/**
 * Poll get_export_job_status until terminal, then download via signed URL when present.
 */
export async function waitForExportJob(
  jobId: string,
  options?: {
    intervalMs?: number;
    timeoutMs?: number;
    onStatus?: (status: ExportJobStatus) => void;
    t?: ReportTranslator;
  },
): Promise<ExportJobStatus> {
  const intervalMs = options?.intervalMs ?? 1500;
  const timeoutMs = options?.timeoutMs ?? 5 * 60 * 1000;
  const t = options?.t ?? fallbackReportTranslation;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const status = await getExportJobStatus(jobId);
    options?.onStatus?.(status);

    if (status.success === false) {
      if (status.code === 'not_found') {
        throw new Error(t('reports.jobNotFound'));
      }
      if (status.code === 'rate_limited' || status.status === 'rate_limited') {
        throw new Error(
          status.errorMessage ||
            t('reports.rateExceeded'),
        );
      }
      throw new Error(
        status.errorMessage ||
          (status.code ? t('reports.jobError', { code: status.code }) : t('reports.jobFailed')),
      );
    }

    if (status.status && TERMINAL.has(status.status)) {
      return status;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(t('reports.timedOut'));
}

export async function downloadExportJobResult(
  status: ExportJobStatus,
  filename: string,
  t: ReportTranslator = fallbackReportTranslation,
): Promise<void> {
  if (!status.resultUrl && !status.resultStoragePath) {
    throw new Error(t('reports.noDownloadUrl'));
  }

  if (status.resultStoragePath) {
    const { data, error } = await supabase.storage
      .from('export-results')
      .download(status.resultStoragePath);
    if (error || !data) {
      logger.error('Failed to download export from storage', {
        error: error?.message,
        path: status.resultStoragePath,
      });
      throw new Error(error?.message ?? t('reports.downloadFailed'));
    }
    downloadBlob(data, filename);
    return;
  }

  const response = await fetch(status.resultUrl!);
  if (!response.ok) {
    throw new Error(t('reports.downloadFailedStatus', { status: response.status }));
  }
  downloadBlob(await response.blob(), filename);
}
