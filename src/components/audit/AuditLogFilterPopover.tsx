import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { FilterPopoverShell } from '@/components/filters/FilterPopoverShell';
import { useI18n } from '@/i18n/I18nProvider';
import {
  AuditLogFilters,
  AuditEntityType,
  AuditAction,
  AUDIT_ENTITY_TYPES,
  AUDIT_ACTIONS,
} from '@/types/audit';

interface AuditLogFilterPopoverProps {
  filters: AuditLogFilters;
  activeFilterCount: number;
  onFilterChange: (filters: AuditLogFilters) => void;
  onClear: () => void;
}

const AuditLogFilterPopover: React.FC<AuditLogFilterPopoverProps> = ({
  filters,
  activeFilterCount,
  onFilterChange,
  onClear,
}) => {
  const { t } = useI18n();
  return (
    <FilterPopoverShell
      ariaSubject={t('auditLogControls.auditSubject')}
      activeFilterCount={activeFilterCount}
      triggerLabel={t('auditLogControls.filter')}
      headerLabel={t('auditLogControls.filters')}
      triggerAriaLabel={activeFilterCount > 0 ? t('auditLogControls.filterAuditActive', { count: activeFilterCount }) : t('auditLogControls.filterAudit')}
    >
      {({ close }) => (
        <>
          {/* Entity Type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">{t('auditLogControls.entityType')}</span>
            <Select
              value={filters.entityType ?? 'all'}
              onValueChange={(v) =>
                onFilterChange({
                  ...filters,
                  entityType: v === 'all' ? undefined : (v as AuditEntityType),
                })
              }
            >
              <SelectTrigger className="h-8 text-sm" aria-label={t('auditLogControls.filterEntity')}>
                <SelectValue placeholder={t('auditLogControls.allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('auditLogControls.allTypes')}</SelectItem>
                {Object.values(AUDIT_ENTITY_TYPES).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`auditLogControls.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">{t('auditLogControls.action')}</span>
            <Select
              value={filters.action ?? 'all'}
              onValueChange={(v) =>
                onFilterChange({
                  ...filters,
                  action: v === 'all' ? undefined : (v as AuditAction),
                })
              }
            >
              <SelectTrigger className="h-8 text-sm" aria-label={t('auditLogControls.filterAction')}>
                <SelectValue placeholder={t('auditLogControls.allActions')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('auditLogControls.allActions')}</SelectItem>
                {Object.values(AUDIT_ACTIONS).map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`auditLogControls.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeFilterCount > 0 && (
            <>
              <Separator />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onClear();
                  close();
                }}
              >
                <X className="h-3 w-3 mr-1.5" />
                {t('auditLogControls.clearFilters')}
              </Button>
            </>
          )}
        </>
      )}
    </FilterPopoverShell>
  );
};

export default AuditLogFilterPopover;
