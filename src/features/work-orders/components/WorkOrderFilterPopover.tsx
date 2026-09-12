import React from 'react';
import { Check } from 'lucide-react';
import { FilterPopoverClearAllFooter } from '@/components/filters/FilterPopoverClearAllFooter';
import { FilterPopoverShell } from '@/components/filters/FilterPopoverShell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkOrderStatusFilterSelect, WorkOrderPriorityFilterSelect, WorkOrderDueDateFilterSelect, WorkOrderInvoiceFilterSelect } from './WorkOrderFilterSelectFields';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { WorkOrderFilters } from '@/features/work-orders/types/workOrder';
import type { QuickFilterPreset } from '@/features/work-orders/hooks/useWorkOrderFilters';
import { useI18n } from '@/i18n';

interface Props { filters: WorkOrderFilters; activeFilterCount: number; activePresets: Set<QuickFilterPreset>; onFilterChange: (key: keyof WorkOrderFilters, value: string) => void; onClearFilters: () => void; onQuickFilter: (preset: QuickFilterPreset) => void; hideDueDateFilter?: boolean; }
const WorkOrderFilterPopover: React.FC<Props> = ({ filters,activeFilterCount,activePresets,onFilterChange,onClearFilters,onQuickFilter,hideDueDateFilter=false }) => {
  const { t } = useI18n();
  const quickFilters: { label:string; value:QuickFilterPreset; tooltip:string }[] = [
    { label:t('workOrders.list.myWork'), value:'my-work', tooltip:t('workOrders.list.myWorkTooltip') }, { label:t('workOrders.list.urgent'), value:'urgent', tooltip:t('workOrders.list.urgentTooltip') }, { label:t('workOrders.list.overdue'), value:'overdue', tooltip:t('workOrders.list.overdueTooltip') }, { label:t('workOrders.list.unassigned'), value:'unassigned', tooltip:t('workOrders.list.unassignedTooltip') },
  ];
  return <FilterPopoverShell ariaSubject={t('workOrders.list.filterAriaSubject')} activeFilterCount={activeFilterCount}>{({close}) => <>
    <div className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">{t('workOrders.list.status')}</span><WorkOrderStatusFilterSelect value={filters.statusFilter} onValueChange={(v)=>onFilterChange('statusFilter',v)}/></div>
    <div className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">{t('workOrders.list.assignee')}</span><Select value={filters.assigneeFilter} onValueChange={(v)=>onFilterChange('assigneeFilter',v)}><SelectTrigger className="h-8 text-sm"><SelectValue placeholder={t('workOrders.list.allAssignees')}/></SelectTrigger><SelectContent><SelectItem value="all">{t('workOrders.list.allAssignees')}</SelectItem><SelectItem value="mine">{t('workOrders.list.myWorkOrders')}</SelectItem><SelectItem value="unassigned">{t('workOrders.list.unassigned')}</SelectItem></SelectContent></Select></div>
    <div className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">{t('workOrders.list.priority')}</span><WorkOrderPriorityFilterSelect value={filters.priorityFilter} onValueChange={(v)=>onFilterChange('priorityFilter',v)}/></div>
    {!hideDueDateFilter && <div className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">{t('workOrders.list.dueDate')}</span><WorkOrderDueDateFilterSelect value={filters.dueDateFilter} onValueChange={(v)=>onFilterChange('dueDateFilter',v)}/></div>}
    <div className="flex flex-col gap-1.5"><span className="text-xs text-muted-foreground">{t('workOrders.list.invoice')}</span><WorkOrderInvoiceFilterSelect value={filters.invoiceFilter} onValueChange={(v)=>onFilterChange('invoiceFilter',v)}/></div>
    <Separator/><div className="flex flex-col gap-1.5"><p className="text-xs text-muted-foreground">{t('workOrders.list.quickFilters')}</p><div className="flex flex-wrap gap-1.5">{quickFilters.filter((p)=>!hideDueDateFilter||p.value!=='overdue').map((p)=>{const active=activePresets.has(p.value);return <Tooltip key={p.value}><TooltipTrigger asChild><button onClick={()=>onQuickFilter(p.value)} className={cn('inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-colors',active?'border-primary bg-primary text-primary-foreground':'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground')}>{active&&<Check className="h-3 w-3"/>}{p.label}</button></TooltipTrigger><TooltipContent>{p.tooltip}</TooltipContent></Tooltip>})}</div></div>
    <FilterPopoverClearAllFooter activeFilterCount={activeFilterCount} onClearFilters={onClearFilters} onClose={close}/>
  </>}</FilterPopoverShell>;
};
export default WorkOrderFilterPopover;
