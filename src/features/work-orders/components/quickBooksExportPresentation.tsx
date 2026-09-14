import { useI18n } from '@/i18n';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileSpreadsheet, RefreshCw, CheckCircle, Info, Copy } from 'lucide-react';
import { getQuickBooksInvoiceUrl } from '@/services/quickbooks/types';
import type { QuickBooksExportLog } from '@/services/quickbooks/quickbooksService';
import {
  getQuickBooksExportStatusBadgeClass,
} from '@/features/work-orders/utils/quickBooksExportPresentation';

export interface QuickBooksExportButtonContentProps {
  isLoading: boolean;
  showAsUpdate: boolean;
  isDisabled: boolean;
  showSetupState: boolean;
  invoiceDisplay: string | null | undefined;
}

export function QuickBooksExportButtonContent({
  isLoading,
  showAsUpdate,
  isDisabled,
  showSetupState,
  invoiceDisplay,
}: QuickBooksExportButtonContentProps) {
  const { t } = useI18n();
  return (
    <>
      {isLoading ? (
        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
      ) : showAsUpdate ? (
        <CheckCircle className="h-4 w-4 mr-2" />
      ) : isDisabled ? (
        <Info className="h-4 w-4 mr-2" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 mr-2" />
      )}
      {showAsUpdate
        ? t('workOrderExportUi.updateInvoiceNumber', { number: invoiceDisplay ?? '' })
        : showSetupState
          ? t('workOrderExportUi.qbSetupRequired')
          : t('workOrderExportUi.exportToQuickBooks')}
    </>
  );
}

export interface QuickBooksExportStatusDetailsProps {
  showStatusDetails: boolean;
  asMenuItem: boolean;
  latestLog: QuickBooksExportLog | null;
  exportLogs: QuickBooksExportLog[];
  isDisabled: boolean;
  isLoading: boolean;
  onRetryExport: () => void;
  onCopy: (label: string, value?: string | null) => void;
  formatTimestamp: (log: QuickBooksExportLog) => string;
}

export function QuickBooksExportStatusDetails({
  showStatusDetails,
  asMenuItem,
  latestLog,
  exportLogs,
  isDisabled,
  isLoading,
  onRetryExport,
  onCopy,
  formatTimestamp,
}: QuickBooksExportStatusDetailsProps) {
  const { t } = useI18n();
  if (!showStatusDetails || asMenuItem) {
    return null;
  }

  const statusLabel = t(`workOrderExportUi.${({ success: 'qbSuccess', error: 'qbError', pending: 'qbPending' } as Record<string, string>)[latestLog?.status ?? ''] || 'qbNotExported'}`);
  const invoiceIdentifier = latestLog?.quickbooks_invoice_number || latestLog?.quickbooks_invoice_id;
  const hasInvoiceLink = latestLog?.quickbooks_invoice_id && latestLog?.quickbooks_environment;
  const historyLogs = exportLogs.slice(0, 3);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" aria-label={t('workOrderExportUi.qbStatus')}>
          <Info className="h-4 w-4" />
          <span>{t('workOrderExportUi.qbStatus')}</span>
          <Badge variant="outline" className={getQuickBooksExportStatusBadgeClass(latestLog?.status)}>
            {statusLabel}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96">
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">{t('workOrderExportUi.lastExport')}</div>
            {latestLog ? (
              <div className="text-sm text-muted-foreground">
                {statusLabel} • {formatTimestamp(latestLog)}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{t('workOrderExportUi.notExportedYet')}</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t('workOrderExportUi.invoice')}</div>
            {invoiceIdentifier ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">{invoiceIdentifier}</span>
                {hasInvoiceLink ? (
                  <Button variant="link" size="sm" asChild>
                    <a
                      href={getQuickBooksInvoiceUrl(
                        latestLog!.quickbooks_invoice_id!,
                        latestLog!.quickbooks_environment!
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('workOrderExportUi.openInQuickBooksAria')}
                    >
                      {t('workOrderExportUi.openInQuickBooks')}
                    </a>
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{t('workOrderExportUi.noInvoiceYet')}</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t('workOrderExportUi.troubleshooting')}</div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <span>Intuit trace ID</span>
                {latestLog?.intuit_tid ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCopy('Intuit trace ID', latestLog.intuit_tid)}
                  >
                    <Copy className="h-4 w-4" />
                    {t('workOrderExportUi.copy')}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">{t('workOrderExportUi.notAvailable')}</span>
                )}
              </div>
            </div>
          </div>

          {historyLogs.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">{t('workOrderExportUi.recentExports')}</div>
              <div className="space-y-2">
                {historyLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getQuickBooksExportStatusBadgeClass(log.status)}>
                        {t(`workOrderExportUi.${({ success: 'qbSuccess', error: 'qbError', pending: 'qbPending' } as Record<string, string>)[log.status] || 'qbNotExported'}`)}
                      </Badge>
                      <span className="text-muted-foreground">
                        {log.quickbooks_invoice_number || log.quickbooks_invoice_id || t('workOrderExportUi.draft')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(log)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onRetryExport} disabled={isDisabled || isLoading}>
              {isDisabled ? t('workOrderExportUi.unavailable') : t('workOrderExportUi.retryExport')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
