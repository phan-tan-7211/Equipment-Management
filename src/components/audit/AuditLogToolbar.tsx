import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AuditLogFilterPopover from './AuditLogFilterPopover';
import AuditLogDownloadMenu from './AuditLogDownloadMenu';
import { AuditLogTimeRangePicker } from './explorer/AuditLogTimeRangePicker';
import { useI18n } from '@/i18n/I18nProvider';
import {
  AuditLogFilters,
  AuditLogTimePreset,
  DEFAULT_AUDIT_TIME_PRESET,
} from '@/types/audit';

interface AuditLogToolbarProps {
  filters: AuditLogFilters;
  onFilterChange: (filters: AuditLogFilters) => void;
  onClear: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  isExporting: boolean;
  exportProgressLabel?: string;
  canExport: boolean;
  resultCount: number;
  /** Active time-range preset; rendered by the embedded AuditLogTimeRangePicker. */
  timePreset: AuditLogTimePreset;
  /** ISO timestamp of the active range start (only used when preset === 'custom'). */
  timeFromIso?: string;
  /** ISO timestamp of the active range end (only used when preset === 'custom'). */
  timeToIso?: string;
  onTimeRangeChange: (
    preset: AuditLogTimePreset,
    isoFrom?: string,
    isoTo?: string
  ) => void;
}

const PRESET_KEYS: Record<AuditLogTimePreset, string> = {
  last_15m: 'last15m',
  last_1h: 'last1h',
  last_24h: 'last24h',
  last_7d: 'last7d',
  last_30d: 'last30d',
  all: 'allTime',
  custom: 'custom',
};

const AuditLogToolbar: React.FC<AuditLogToolbarProps> = ({
  filters,
  onFilterChange,
  onClear,
  onExportCsv,
  onExportJson,
  isExporting,
  exportProgressLabel,
  canExport,
  resultCount,
  timePreset,
  timeFromIso,
  timeToIso,
  onTimeRangeChange,
}) => {
  const { t, language } = useI18n();
  const activeFilterCount = [
    !!filters.entityType && filters.entityType !== 'all',
    !!filters.action && filters.action !== 'all',
  ].filter(Boolean).length;

  const hasActiveFilters =
    activeFilterCount > 0 || !!filters.search || timePreset !== DEFAULT_AUDIT_TIME_PRESET;

  return (
    <div className="flex flex-col gap-2">
      {/* Single toolbar row */}
      <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-70 min-w-50">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            id="audit-log-search"
            placeholder={t('auditLogControls.searchHint')}
            value={filters.search ?? ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value || undefined })}
            className="h-8 pl-8 text-sm bg-transparent"
            aria-label={t('auditLogControls.searchLabel')}
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: undefined })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={t('auditLogControls.clearSearch')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Time range picker */}
        <AuditLogTimeRangePicker
          preset={timePreset}
          isoFrom={timeFromIso}
          isoTo={timeToIso}
          onChange={onTimeRangeChange}
        />

        <Separator orientation="vertical" className="h-5" />

        {/* Filter popover */}
        <AuditLogFilterPopover
          filters={filters}
          activeFilterCount={activeFilterCount}
          onFilterChange={onFilterChange}
          onClear={onClear}
        />

        <Separator orientation="vertical" className="h-5" />

        {/* Download menu */}
        <AuditLogDownloadMenu
          onExportCsv={onExportCsv}
          onExportJson={onExportJson}
          isExporting={isExporting}
          exportProgressLabel={exportProgressLabel}
          canExport={canExport}
        />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Result count */}
        <span
          className="text-xs text-muted-foreground whitespace-nowrap hidden lg:block"
          aria-live="polite"
          aria-atomic="true"
        >
          {t('auditLogControls.entries', { count: resultCount.toLocaleString(language === 'vi' ? 'vi-VN' : language === 'ko' ? 'ko-KR' : 'en-US') })}
        </span>
      </div>

      {/* Active filter badges row */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-xs text-muted-foreground">{t('auditLogControls.active')}</span>

          {timePreset !== DEFAULT_AUDIT_TIME_PRESET && (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs h-5 px-2">
              {t('auditLogControls.activeTime', { preset: t(`auditLogControls.${PRESET_KEYS[timePreset]}`) })}
              <button
                onClick={() => onTimeRangeChange(DEFAULT_AUDIT_TIME_PRESET)}
                className="ml-0.5 hover:text-foreground"
                aria-label={t('auditLogControls.resetTime')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.entityType && filters.entityType !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs h-5 px-2">
              {t(`auditLogControls.${filters.entityType}`)}
              <button
                onClick={() => onFilterChange({ ...filters, entityType: undefined })}
                className="ml-0.5 hover:text-foreground"
                aria-label={t('auditLogControls.clearEntity')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.action && filters.action !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1 text-xs h-5 px-2">
              {t(`auditLogControls.${filters.action}`)}
              <button
                onClick={() => onFilterChange({ ...filters, action: undefined })}
                className="ml-0.5 hover:text-foreground"
                aria-label={t('auditLogControls.clearAction')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={onClear}
          >
            {t('auditLogControls.clearAll')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AuditLogToolbar;
