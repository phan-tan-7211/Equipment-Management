// fallow-ignore-file code-duplication
// Duplication rationale: Mobile toolbar mirrors desktop filter field wiring
import React from 'react';
import { Search, Filter, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MobileListPersonalizationSheet } from '@/components/common/MobileListPersonalizationSheet';
import { MobileToolbarSheetContent } from '@/components/common/MobileToolbarSheetContent';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ListSortFieldControls } from '@/components/common/ListSortFieldControls';
import type { SortField, SortDirection } from '@/features/work-orders/hooks/useWorkOrderFilters';
import type { WorkOrderFiltersToolbarProps } from '@/features/work-orders/types/workOrderFiltersToolbarTypes';
import {
  WORK_ORDER_QUICK_FILTER_PRESETS,
  WORK_ORDER_SORT_FIELD_OPTIONS,
  getWorkOrderSortFieldDefaultOrder,
} from '@/features/work-orders/constants/workOrderSortOptions';
import {
  WorkOrderStatusFilterSelect,
  WorkOrderPriorityFilterSelect,
  WorkOrderDueDateFilterSelect,
  WorkOrderInvoiceFilterSelect,
} from '@/features/work-orders/components/WorkOrderFilterSelectFields';
import { useI18n } from '@/i18n';

const DEFAULT_SORT_FIELD: SortField = 'created';
const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';

const MobileWorkOrderToolbar: React.FC<WorkOrderFiltersToolbarProps> = ({
  filters,
  activeFilterCount,
  activePresets,
  showMobileFilters,
  onShowMobileFiltersChange,
  onFilterChange,
  onClearFilters,
  onQuickFilter,
  sortField,
  sortDirection,
  onSortChange,
  hideDueDateFilter = false,
}) => {
  const { t } = useI18n();
  const statusLabels: Record<string, string> = {
    submitted: t('workOrders.list.submitted'), accepted: t('workOrders.list.accepted'),
    assigned: t('workOrders.list.assigned'), in_progress: t('workOrders.list.inProgress'),
    on_hold: t('workOrders.list.onHold'), completed: t('workOrders.list.completed'),
    cancelled: t('workOrders.list.cancelled'),
  };
  const priorityLabels: Record<string, string> = {
    high: t('workOrders.list.high'), medium: t('workOrders.list.medium'), low: t('workOrders.list.low'),
  };
  const dueDateLabels: Record<string, string> = {
    overdue: t('workOrders.list.overdue'), today: t('workOrders.list.dueToday'),
    this_week: t('workOrders.list.thisWeek'),
  };
  const invoiceLabels: Record<string, string> = {
    paid: t('workOrders.list.paid'), unpaid: t('workOrders.list.unpaid'),
    overdue: t('workOrders.list.overdue'), not_exported: t('workOrders.list.notExported'),
  };
  const sortOptions = WORK_ORDER_SORT_FIELD_OPTIONS.map((option) => ({
    ...option,
    label: option.value === 'created' ? t('workOrderMobile.created') :
      option.value === 'due_date' ? t('workOrders.list.dueDate') :
      option.value === 'priority' ? t('workOrders.list.priority') : t('workOrders.list.status'),
  }));
  const mobileSearchInputId = 'work-order-search-mobile';
  const mobileStatusFilterId = 'work-order-status-filter-mobile';
  const mobileAssigneeFilterId = 'work-order-assignee-filter-mobile';
  const mobilePriorityFilterId = 'work-order-priority-filter-mobile';
  const mobileDueDateFilterId = 'work-order-due-date-filter-mobile';
  const mobileInvoiceFilterId = 'work-order-invoice-filter-mobile';

  const [isPersonalizationOpen, setIsPersonalizationOpen] = React.useState(false);

  const hasNonDefaultSort =
    sortField !== DEFAULT_SORT_FIELD || sortDirection !== DEFAULT_SORT_DIRECTION;

  const handleFilterSheetOpenChange = (open: boolean) => {
    onShowMobileFiltersChange(open);
  };

  const handleSortFieldChange = (field: string) => {
    if (sortField === field) {
      onSortChange(field as SortField, sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }
    onSortChange(field as SortField, getWorkOrderSortFieldDefaultOrder(field));
  };

  const toggleSortOrder = () => {
    onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-2.5">
      {/* Search + Personalization + Filters */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={mobileSearchInputId}
            placeholder={t('workOrders.list.searchPlaceholder')}
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            className="h-11 pl-9"
            aria-label={t('workOrders.list.searchAria')}
          />
        </div>

        <MobileListPersonalizationSheet
          open={isPersonalizationOpen}
          onOpenChange={setIsPersonalizationOpen}
          hasNonDefaultSort={hasNonDefaultSort}
          description={t('workOrderMobile.sortDescription')}
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('workOrderMobile.sortBy')}
            </p>
            <ListSortFieldControls
              sortField={sortField}
              sortOrder={sortDirection}
              options={sortOptions}
              onFieldChange={handleSortFieldChange}
              onOrderToggle={toggleSortOrder}
              fieldSelectAriaLabel={t('workOrderMobile.sortFieldAria')}
            />
          </div>
        </MobileListPersonalizationSheet>

        <Sheet open={showMobileFilters} onOpenChange={handleFilterSheetOpenChange}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative h-11 w-11 shrink-0"
              aria-label={
                activeFilterCount > 0
                  ? t('workOrderMobile.openFiltersActive', { count: activeFilterCount })
                  : t('workOrderMobile.openFilters')
              }
            >
              <Filter className="h-4 w-4" aria-hidden />
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px]"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <MobileToolbarSheetContent>
            <SheetHeader className="pb-2 text-left">
              <SheetTitle>{t('workOrderMobile.filterTitle')}</SheetTitle>
              <SheetDescription>
                {t('workOrderMobile.filterDescription')}
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6 pb-8 pt-2">
              <div className="space-y-3">
                <h3 className="text-sm font-medium">{t('workOrders.list.quickFilters')}</h3>
                <div className="flex flex-wrap gap-2">
                  {WORK_ORDER_QUICK_FILTER_PRESETS.map((preset) => {
                    const isActive = activePresets.has(preset.value);
                    return (
                      <Button
                        key={preset.value}
                        size="sm"
                        variant={isActive ? 'default' : 'outline'}
                        className="min-h-11 whitespace-nowrap"
                        onClick={() => onQuickFilter(preset.value)}
                      >
                        {isActive && <Check className="mr-1 h-3 w-3" aria-hidden />}
                        {t(preset.value === 'my-work' ? 'workOrders.list.myWork' : `workOrders.list.${preset.value}`)}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('workOrderMobile.filters')}
                </p>

                <div>
                  <label htmlFor={mobileStatusFilterId} className="mb-2 block text-sm font-medium">
                    {t('workOrders.list.status')}
                  </label>
                  <WorkOrderStatusFilterSelect
                    value={filters.statusFilter}
                    onValueChange={(value) => onFilterChange('statusFilter', value)}
                    triggerId={mobileStatusFilterId}
                    placeholder={t('workOrders.list.allStatuses')}
                    allLabel={t('workOrders.list.allStatuses')}
                  />
                </div>

                <div>
                  <label htmlFor={mobileAssigneeFilterId} className="mb-2 block text-sm font-medium">
                    {t('workOrders.list.assignee')}
                  </label>
                  <Select
                    value={filters.assigneeFilter}
                    onValueChange={(value) => onFilterChange('assigneeFilter', value)}
                  >
                    <SelectTrigger id={mobileAssigneeFilterId} className="h-11">
                      <SelectValue placeholder={t('workOrders.list.allAssignees')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('workOrders.list.allAssignees')}</SelectItem>
                      <SelectItem value="mine">{t('workOrders.list.myWorkOrders')}</SelectItem>
                      <SelectItem value="unassigned">{t('workOrders.list.unassigned')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor={mobilePriorityFilterId} className="mb-2 block text-sm font-medium">
                    {t('workOrders.list.priority')}
                  </label>
                  <WorkOrderPriorityFilterSelect
                    value={filters.priorityFilter}
                    onValueChange={(value) => onFilterChange('priorityFilter', value)}
                    triggerId={mobilePriorityFilterId}
                  />
                </div>

                {!hideDueDateFilter && (
                  <div>
                    <label htmlFor={mobileDueDateFilterId} className="mb-2 block text-sm font-medium">
                      {t('workOrders.list.dueDate')}
                    </label>
                    <WorkOrderDueDateFilterSelect
                      value={filters.dueDateFilter}
                      onValueChange={(value) => onFilterChange('dueDateFilter', value)}
                      triggerId={mobileDueDateFilterId}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor={mobileInvoiceFilterId} className="mb-2 block text-sm font-medium">
                    {t('workOrders.list.invoice')}
                  </label>
                  <WorkOrderInvoiceFilterSelect
                    value={filters.invoiceFilter}
                    onValueChange={(value) => onFilterChange('invoiceFilter', value)}
                    triggerId={mobileInvoiceFilterId}
                  />
                </div>
              </div>

              <Button
                variant="outline"
                className="h-12 w-full touch-manipulation"
                disabled={activeFilterCount === 0}
                onClick={onClearFilters}
              >
                {t('workOrderMobile.clearAllFilters')}
              </Button>
            </div>
          </MobileToolbarSheetContent>
        </Sheet>
      </div>

      {/* Active sheet-filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('workOrders.list.active')}</span>
          {filters.statusFilter !== 'all' && (
            <Badge variant="secondary" className="flex max-w-full items-center gap-1">
              <span className="truncate" title={`${t('workOrders.list.status')}: ${statusLabels[filters.statusFilter] ?? filters.statusFilter}`}>
                {t('workOrders.list.status')}: {statusLabels[filters.statusFilter] ?? filters.statusFilter}
              </span>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onFilterChange('statusFilter', 'all')}
                aria-label={t('workOrders.list.clearStatusFilterAria')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.assigneeFilter !== 'all' && (
            <Badge variant="secondary" className="flex max-w-full items-center gap-1">
              <span className="truncate" title={`${t('workOrders.list.assignee')}: ${filters.assigneeFilter === 'mine' ? t('workOrders.list.mine') : filters.assigneeFilter === 'unassigned' ? t('workOrders.list.unassigned') : filters.assigneeFilter}`}>
                {t('workOrders.list.assignee')}: {filters.assigneeFilter === 'mine' ? t('workOrders.list.mine') : filters.assigneeFilter === 'unassigned' ? t('workOrders.list.unassigned') : filters.assigneeFilter}
              </span>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onFilterChange('assigneeFilter', 'all')}
                aria-label={t('workOrders.list.clearAssigneeFilterAria')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.priorityFilter !== 'all' && (
            <Badge variant="secondary" className="flex max-w-full items-center gap-1">
              <span className="truncate" title={`${t('workOrders.list.priority')}: ${priorityLabels[filters.priorityFilter] ?? filters.priorityFilter}`}>
                {t('workOrders.list.priority')}: {priorityLabels[filters.priorityFilter] ?? filters.priorityFilter}
              </span>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onFilterChange('priorityFilter', 'all')}
                aria-label={t('workOrders.list.clearPriorityFilterAria')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {!hideDueDateFilter && filters.dueDateFilter !== 'all' && (
            <Badge variant="secondary" className="flex max-w-full items-center gap-1">
              <span className="truncate" title={`${t('workOrders.list.due')}: ${dueDateLabels[filters.dueDateFilter] ?? filters.dueDateFilter}`}>
                {t('workOrders.list.due')}: {dueDateLabels[filters.dueDateFilter] ?? filters.dueDateFilter}
              </span>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onFilterChange('dueDateFilter', 'all')}
                aria-label={t('workOrders.list.clearDueDateFilterAria')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.invoiceFilter !== 'all' && (
            <Badge variant="secondary" className="flex max-w-full items-center gap-1">
              <span
                className="truncate"
                title={`${t('workOrders.list.invoice')}: ${invoiceLabels[filters.invoiceFilter] ?? filters.invoiceFilter}`}
              >
                {t('workOrders.list.invoice')}: {invoiceLabels[filters.invoiceFilter] ?? filters.invoiceFilter}
              </span>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onFilterChange('invoiceFilter', 'all')}
                aria-label={t('workOrders.list.clearInvoiceFilterAria')}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onClearFilters}>
            {t('workOrders.list.clearAll')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MobileWorkOrderToolbar;
