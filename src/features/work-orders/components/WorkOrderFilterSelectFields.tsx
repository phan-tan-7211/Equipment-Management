// fallow-ignore-file code-duplication
// Duplication rationale: Filter selects share historical field wiring
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/i18n';

type WorkOrderFilterSelectFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  triggerId?: string;
  ariaLabel: string;
  placeholder: string;
  allLabel: string;
  children: React.ReactNode;
  triggerClassName?: string;
};

function WorkOrderFilterSelectField({
  value,
  onValueChange,
  triggerId,
  ariaLabel,
  placeholder,
  allLabel,
  children,
  triggerClassName,
}: WorkOrderFilterSelectFieldProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={triggerId} className={triggerClassName} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {children}
      </SelectContent>
    </Select>
  );
}

type FilterSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  triggerId?: string;
  ariaLabel?: string;
  placeholder?: string;
  allLabel?: string;
};

export function WorkOrderStatusFilterSelect({
  value,
  onValueChange,
  triggerId,
  ariaLabel,
  placeholder,
  allLabel,
}: FilterSelectProps) {
  const { t } = useI18n();
  return (
    <WorkOrderFilterSelectField
      value={value}
      onValueChange={onValueChange}
      triggerId={triggerId}
      ariaLabel={ariaLabel ?? t('workOrders.list.filterByStatusAria')}
      placeholder={placeholder ?? t('workOrders.list.allStatuses')}
      allLabel={allLabel ?? t('workOrders.list.allStatuses')}
    >
      <SelectItem value="submitted">{t('workOrders.list.submitted')}</SelectItem>
      <SelectItem value="accepted">{t('workOrders.list.accepted')}</SelectItem>
      <SelectItem value="assigned">{t('workOrders.list.assigned')}</SelectItem>
      <SelectItem value="in_progress">{t('workOrders.list.inProgress')}</SelectItem>
      <SelectItem value="on_hold">{t('workOrders.list.onHold')}</SelectItem>
      <SelectItem value="completed">{t('workOrders.list.completed')}</SelectItem>
      <SelectItem value="cancelled">{t('workOrders.list.cancelled')}</SelectItem>
    </WorkOrderFilterSelectField>
  );
}

export function WorkOrderPriorityFilterSelect({
  value,
  onValueChange,
  triggerId,
  ariaLabel,
  placeholder,
  allLabel,
}: FilterSelectProps) {
  const { t } = useI18n();
  return (
    <WorkOrderFilterSelectField
      value={value}
      onValueChange={onValueChange}
      triggerId={triggerId}
      ariaLabel={ariaLabel ?? t('workOrders.list.filterByPriorityAria')}
      placeholder={placeholder ?? t('workOrders.list.allPriorities')}
      allLabel={allLabel ?? t('workOrders.list.allPriorities')}
    >
      <SelectItem value="high">{t('workOrders.list.high')}</SelectItem>
      <SelectItem value="medium">{t('workOrders.list.medium')}</SelectItem>
      <SelectItem value="low">{t('workOrders.list.low')}</SelectItem>
    </WorkOrderFilterSelectField>
  );
}

export function WorkOrderDueDateFilterSelect({
  value,
  onValueChange,
  triggerId,
  ariaLabel,
  placeholder,
  allLabel,
}: FilterSelectProps) {
  const { t } = useI18n();
  return (
    <WorkOrderFilterSelectField
      value={value}
      onValueChange={onValueChange}
      triggerId={triggerId}
      ariaLabel={ariaLabel ?? t('workOrders.list.filterByDueDateAria')}
      placeholder={placeholder ?? t('workOrders.list.allDates')}
      allLabel={allLabel ?? t('workOrders.list.allDates')}
    >
      <SelectItem value="overdue">{t('workOrders.list.overdue')}</SelectItem>
      <SelectItem value="today">{t('workOrders.list.dueToday')}</SelectItem>
      <SelectItem value="this_week">{t('workOrders.list.thisWeek')}</SelectItem>
    </WorkOrderFilterSelectField>
  );
}

export function WorkOrderInvoiceFilterSelect({
  value,
  onValueChange,
  triggerId,
  ariaLabel,
  placeholder,
  allLabel,
}: FilterSelectProps) {
  const { t } = useI18n();
  return (
    <WorkOrderFilterSelectField
      value={value}
      onValueChange={onValueChange}
      triggerId={triggerId}
      ariaLabel={ariaLabel ?? t('workOrders.list.filterByInvoiceAria')}
      placeholder={placeholder ?? t('workOrders.list.allInvoices')}
      allLabel={allLabel ?? t('workOrders.list.allInvoices')}
    >
      <SelectItem value="paid">{t('workOrders.list.paid')}</SelectItem>
      <SelectItem value="unpaid">{t('workOrders.list.unpaid')}</SelectItem>
      <SelectItem value="overdue">{t('workOrders.list.overdue')}</SelectItem>
      <SelectItem value="not_exported">{t('workOrders.list.notExported')}</SelectItem>
    </WorkOrderFilterSelectField>
  );
}
