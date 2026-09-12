import React from 'react';
import { Download, FileSpreadsheet, FileJson, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useI18n } from '@/i18n/I18nProvider';

interface AuditLogDownloadMenuProps {
  onExportCsv: () => void;
  onExportJson: () => void;
  isExporting: boolean;
  exportProgressLabel?: string;
  canExport: boolean;
}

const AuditLogDownloadMenu: React.FC<AuditLogDownloadMenuProps> = ({
  onExportCsv,
  onExportJson,
  isExporting,
  exportProgressLabel,
  canExport,
}) => {
  const { t } = useI18n();
  if (!canExport) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-sm font-normal opacity-50 cursor-not-allowed"
            disabled
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            {t('auditLogControls.download')}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {t('auditLogControls.exportRestricted')}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-sm font-normal"
            disabled={isExporting}
            aria-label={t('auditLogControls.downloadAudit')}
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {t('auditLogControls.download')}
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            {t('auditLogControls.exportFormat')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onExportCsv}
            disabled={isExporting}
            className="gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-success" />
            <div className="flex flex-col">
              <span className="text-sm">CSV</span>
              <span className="text-[10px] text-muted-foreground">{t('auditLogControls.csvDescription')}</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onExportJson}
            disabled={isExporting}
            className="gap-2 cursor-pointer"
          >
            <FileJson className="h-4 w-4 text-info" />
            <div className="flex flex-col">
              <span className="text-sm">JSON</span>
              <span className="text-[10px] text-muted-foreground">{t('auditLogControls.jsonDescription')}</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isExporting && exportProgressLabel && (
        <span className="text-xs text-muted-foreground">{exportProgressLabel}</span>
      )}
    </div>
  );
};

export default AuditLogDownloadMenu;
