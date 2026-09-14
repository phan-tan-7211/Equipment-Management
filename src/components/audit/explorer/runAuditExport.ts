export type AuditExportProgress = { current: number; total: number };

export type AuditExportRunner = (
  onProgress: (progress: AuditExportProgress) => void,
) => Promise<void>;

export async function runAuditExport(
  exportFn: AuditExportRunner,
  setExportProgressLabel: (label: string | undefined) => void,
  setIsExporting: (exporting: boolean) => void,
  options?: {
    t: (key: string, params?: Record<string, string | number>) => string;
    locale: string;
  },
): Promise<void> {
  setIsExporting(true);
  setExportProgressLabel(options?.t('auditExplorer.preparingExport') ?? 'Preparing export...');
  try {
    await exportFn(({ current, total }) => {
      setExportProgressLabel(
        total === 0
          ? options?.t('auditExplorer.noExportRecords') ?? 'No matching records found.'
          : options?.t('auditExplorer.exportingRecords', {
              current: current.toLocaleString(options.locale),
              total: total.toLocaleString(options.locale),
            }) ?? `Exporting ${current.toLocaleString()} of ${total.toLocaleString()} records...`,
      );
    });
  } finally {
    setIsExporting(false);
    setExportProgressLabel(undefined);
  }
}
