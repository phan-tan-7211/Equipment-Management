import React from 'react';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type EquipmentPMStatus, getPMComplianceLevel, type PMComplianceLevel } from '@/features/equipment/hooks/useEquipmentPMStatus';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';

interface PMStatusIndicatorProps { status: EquipmentPMStatus | undefined; size?: 'sm' | 'md'; className?: string; }

const ICON_CONFIG: Record<PMComplianceLevel, { icon: typeof AlertTriangle; dotClass: string; iconClass: string }> = {
  overdue: { icon: AlertTriangle, dotClass: 'bg-destructive', iconClass: 'text-destructive' },
  due_soon: { icon: Clock, dotClass: 'bg-warning', iconClass: 'text-warning' },
  current: { icon: CheckCircle, dotClass: 'bg-success', iconClass: 'text-success' },
  no_interval: { icon: CheckCircle, dotClass: '', iconClass: '' },
};

const PMStatusIndicator: React.FC<PMStatusIndicatorProps> = ({ status, size = 'sm', className }) => {
  const { t } = useI18n();
  if (!status) return null;
  const level = getPMComplianceLevel(status);
  if (level === 'no_interval') return null;
  const config = ICON_CONFIG[level];
  const Icon = config.icon;
  const label = level === 'overdue' ? t('equipment.pmOverdue') : level === 'due_soon' ? t('equipment.pmDueSoon') : t('equipment.pmCurrent');
  const detail = level === 'overdue'
    ? status.days_overdue != null
      ? t('equipment.daysOverdue', { count: status.days_overdue })
      : status.hours_overdue != null
        ? t('equipment.hoursOverdue', { count: Math.round(status.hours_overdue) })
        : t('equipment.overdue')
    : level === 'due_soon'
      ? status.interval_type === 'days'
        ? t('equipment.approachingDays', { count: status.interval_value })
        : t('equipment.approachingHours', { count: status.interval_value })
      : t('equipment.withinInterval');

  if (size === 'sm') {
    return <Tooltip><TooltipTrigger asChild><span className={cn('inline-flex items-center gap-1 flex-shrink-0', className)} aria-label={label}><span className="text-[9px] font-medium uppercase text-muted-foreground leading-none">PM</span><span className={cn('inline-block h-2.5 w-2.5 rounded-full', config.dotClass)} /></span></TooltipTrigger><TooltipContent><p className="font-medium">{label}</p><p className="text-xs">{detail}</p></TooltipContent></Tooltip>;
  }
  return <Tooltip><TooltipTrigger asChild><span className={cn('inline-flex items-center gap-1', className)}><Icon className={cn('h-3.5 w-3.5', config.iconClass)} /><span className="text-xs font-medium">{label}</span></span></TooltipTrigger><TooltipContent><p>{detail}</p></TooltipContent></Tooltip>;
};

export default PMStatusIndicator;
