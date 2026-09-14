import { useI18n } from '@/i18n';
import React from 'react';
import { X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterPopoverShell } from '@/components/filters/FilterPopoverShell';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type GroupStatusFilter = 'all' | 'verified' | 'unverified' | 'deprecated';

const STATUS_OPTIONS: { value: GroupStatusFilter; labelKey: string; icon?: React.ReactNode }[] = [
  { value: 'all', labelKey: 'all' },
  {
    value: 'verified',
    labelKey: 'verified',
    icon: <CheckCircle2 className="h-3 w-3 text-success" />,
  },
  {
    value: 'unverified',
    labelKey: 'unverified',
  },
  {
    value: 'deprecated',
    labelKey: 'deprecated',
    icon: <AlertTriangle className="h-3 w-3 text-warning" />,
  },
];

interface AlternateGroupsFilterPopoverProps {
  statusFilter: GroupStatusFilter;
  onStatusChange: (status: GroupStatusFilter) => void;
  activeFilterCount: number;
}

const AlternateGroupsFilterPopover: React.FC<AlternateGroupsFilterPopoverProps> = ({
  statusFilter,
  onStatusChange,
  activeFilterCount,
}) => {
  const { t } = useI18n();
  return (
    <FilterPopoverShell
      ariaSubject={t('alternateGroups.group')}
      triggerLabel={t('alternateGroups.filter')}
      triggerAriaLabel={t('alternateGroups.filterAria', { count: activeFilterCount })}
      activeFilterCount={activeFilterCount}
      contentClassName="w-52 p-4"
      headerLabel={t('alternateGroups.status')}
    >
      {({ close }) => (
        <>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onStatusChange(option.value);
                  if (option.value !== 'all') close();
                }}
                className={cn(
                  'inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-colors',
                  statusFilter === option.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {option.icon}
                {t(`alternateGroups.${option.labelKey}`)}
              </button>
            ))}
          </div>

          {activeFilterCount > 0 && (
            <>
              <Separator />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  onStatusChange('all');
                  close();
                }}
              >
                <X className="h-3 w-3 mr-1.5" />
                {t('alternateGroups.clearFilter')}
              </Button>
            </>
          )}
        </>
      )}
    </FilterPopoverShell>
  );
};

export default AlternateGroupsFilterPopover;
