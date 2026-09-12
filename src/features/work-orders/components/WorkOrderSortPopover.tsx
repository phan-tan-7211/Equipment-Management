import React from 'react';
import { ListSortPopover } from '@/components/common/ListSortPopover';
import type { SortField, SortDirection } from '@/features/work-orders/hooks/useWorkOrderFilters';
import { WORK_ORDER_SORT_OPTIONS } from '@/features/work-orders/constants/workOrderSortOptions';
import { useI18n } from '@/i18n';

interface WorkOrderSortPopoverProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const WorkOrderSortPopover: React.FC<WorkOrderSortPopoverProps> = ({
  sortField,
  sortDirection,
  onSortChange,
}) => {
  const { t } = useI18n();
  const compositeValue = `${sortField}:${sortDirection}`;
  const labelKeys: Record<string, string> = {
    'created:desc': 'workOrders.list.sortCreatedNewest',
    'created:asc': 'workOrders.list.sortCreatedOldest',
    'due_date:asc': 'workOrders.list.sortDueSoonest',
    'due_date:desc': 'workOrders.list.sortDueLatest',
    'priority:desc': 'workOrders.list.sortPriorityHigh',
    'priority:asc': 'workOrders.list.sortPriorityLow',
    'status:asc': 'workOrders.list.sortStatusEarliest',
    'status:desc': 'workOrders.list.sortStatusLatest',
  };
  const sortOptions = WORK_ORDER_SORT_OPTIONS.map((option) => ({
    ...option,
    label: t(labelKeys[option.value] ?? 'workOrders.list.sortAria'),
  }));
  const currentLabel = sortOptions.find((option) => option.value === compositeValue)?.label ?? compositeValue;

  return (
    <ListSortPopover
      sortOptions={sortOptions}
      compositeValue={compositeValue}
      currentLabel={currentLabel}
      onSelect={(value) => {
        const [field, direction] = value.split(':') as [SortField, SortDirection];
        onSortChange(field, direction);
      }}
      ariaLabel={t('workOrders.list.sortAria')}
      labelMaxWidthClass="max-w-[150px]"
    />
  );
};

export default WorkOrderSortPopover;
