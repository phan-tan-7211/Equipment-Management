import { Button } from '@/components/ui/button';
import type { CalendarRange } from '@/features/work-orders/calendar/url';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

const RANGE_OPTIONS: CalendarRange[] = ['month', 'week', 'day'];

export type CalendarRangeToggleProps = {
  range: CalendarRange;
  onChange: (range: CalendarRange) => void;
  className?: string;
};

export function CalendarRangeToggle({
  range,
  onChange,
  className,
}: CalendarRangeToggleProps) {
  const { t } = useI18n();
  const labels: Record<CalendarRange, string> = {
    month: t('workOrders.list.month'),
    week: t('workOrders.list.week'),
    day: t('workOrders.list.day'),
  };

  return (
    <div
      className={cn('flex w-fit items-center rounded-md border', className)}
      role="radiogroup"
      aria-label={t('workOrders.list.calendarRange')}
    >
      {RANGE_OPTIONS.map((value, index) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 rounded-none px-3',
            index === 0 && 'rounded-l-md',
            index === RANGE_OPTIONS.length - 1 && 'rounded-r-md',
            range === value && 'bg-muted',
          )}
          onClick={() => onChange(value)}
          aria-label={labels[value]}
          aria-checked={range === value}
          role="radio"
        >
          {labels[value]}
        </Button>
      ))}
    </div>
  );
}
