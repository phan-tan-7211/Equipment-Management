import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  dueDateTimeInputWrite,
  dueDayInputValue,
  dueDayInputWrite,
  formatDueDisplay,
  parseDue,
  type DueWrite,
} from '@/features/work-orders/calendar/dueDate';
import type { CalendarEditability } from '@/features/work-orders/calendar/editability';
import { useFormatTimestamp } from '@/hooks/useFormatTimestamp';
import { useI18n } from '@/i18n';
import type { MergedWorkOrder } from '@/features/work-orders/types/offlineMergedWorkOrder';
import { localizeWorkOrderPriority, localizeWorkOrderStatus } from '@/features/work-orders/utils/workOrderI18nLabels';
import {
  getPriorityColor,
  getStatusColor,
} from '@/features/work-orders/utils/workOrderHelpers';

export type WorkOrderCalendarPanelProps = {
  workOrder: MergedWorkOrder;
  editability: CalendarEditability;
  onClose: () => void;
  onDueWrite: (write: DueWrite) => void;
};

export function WorkOrderCalendarPanel({
  workOrder,
  editability,
  onClose,
  onDueWrite,
}: WorkOrderCalendarPanelProps) {
  const { formatDate, formatDateTime } = useFormatTimestamp();
  const { t } = useI18n();
  const due = parseDue(workOrder);
  const editable = editability.kind === 'editable';
  const [showTime, setShowTime] = useState(due.kind === 'timed');
  const teamName = workOrder.teamName ?? workOrder.team?.name ?? '—';
  const equipmentName = workOrder.equipmentName ?? workOrder.equipment?.name ?? '—';
  const assigneeName = workOrder.assigneeName ?? workOrder.assignee_name ?? t('workOrderCalendar.unassigned');

  return (
    <Sheet key={workOrder.id} open onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent
          side="right"
          className="flex flex-col gap-6 overflow-y-auto"
          data-testid="work-order-calendar-panel"
        >
        <SheetHeader>
          <SheetTitle>{workOrder.title}</SheetTitle>
          <SheetDescription>{t('workOrderCalendar.overview')}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-wrap gap-2">
          <Badge className={getStatusColor(workOrder.status)}>{localizeWorkOrderStatus(workOrder.status, t)}</Badge>
          <Badge className={getPriorityColor(workOrder.priority)}>{localizeWorkOrderPriority(workOrder.priority, t)}</Badge>
        </div>

        <div className="space-y-2">
          <Label htmlFor="calendar-panel-due-date">{t('workOrderCalendar.dueDate')}</Label>
          {editable ? (
            <>
              <Input
                id="calendar-panel-due-date"
                type="date"
                value={dueDayInputValue(due)}
                onChange={(event) => onDueWrite(dueDayInputWrite(due, event.target.value))}
              />
              {due.kind === 'timed' || showTime ? (
                <DateTimePicker
                  date={due.kind === 'timed' ? new Date(due.at.epochMs) : undefined}
                  onDateChange={(date) => onDueWrite(dueDateTimeInputWrite(
                    date ? { epochMs: date.getTime() } : null,
                  ))}
                />
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setShowTime(true)}>
                  {t('workOrderCalendar.addTime')}
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {due.kind === 'none'
                ? t('workOrderCalendar.unscheduled')
                : formatDueDisplay(due, { formatDay: formatDate, formatTimed: formatDateTime })}
            </p>
          )}
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">{t('workOrderCalendar.equipment')}</dt>
            <dd>{equipmentName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('workOrderCalendar.team')}</dt>
            <dd>{teamName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('workOrderCalendar.assignee')}</dt>
            <dd>{assigneeName}</dd>
          </div>
        </dl>

        <Button asChild>
          <Link to={`/dashboard/work-orders/${workOrder.id}`}>{t('workOrderCalendar.openDetails')}</Link>
        </Button>
      </SheetContent>
    </Sheet>
  );
}
