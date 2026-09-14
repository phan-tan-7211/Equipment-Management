// fallow-ignore-file code-duplication
// Duplication rationale: Read-only costs mirror editable cost editor structure
import React from 'react';
import { cn } from '@/lib/utils';
import type { WorkOrderCost } from '@/features/work-orders/services/workOrderCostsService';
import { useI18n } from '@/i18n';

export type WorkOrderCostReadOnlyListProps = {
  costs: WorkOrderCost[];
  isMobile: boolean;
  formatCurrency: (cents: number) => string;
  calculateSubtotal: () => number;
  renderMobileCost: (cost: WorkOrderCost) => React.ReactNode;
  renderDesktopCost: (cost: WorkOrderCost) => React.ReactNode;
  className?: string;
};

export function WorkOrderCostReadOnlyList({
  costs,
  isMobile,
  formatCurrency,
  calculateSubtotal,
  renderMobileCost,
  renderDesktopCost,
  className,
}: WorkOrderCostReadOnlyListProps) {
  const { t } = useI18n();
  return (
    <div className={cn(className)}>
      {!isMobile && (
        <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground px-3">
          <div>{t('workOrderOperations.description')}</div>
          <div>{t('workOrderOperations.quantity')}</div>
          <div>{t('workOrderOperations.unitPrice')}</div>
          <div className="text-right">{t('workOrderOperations.costTotal')}</div>
        </div>
      )}

      <div className="space-y-3">
        {costs.map((cost) => (
          <div key={cost.id}>
            {isMobile ? renderMobileCost(cost) : renderDesktopCost(cost)}
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>{t('workOrderOperations.subtotal')}</span>
          <span>{formatCurrency(calculateSubtotal())}</span>
        </div>
      </div>
    </div>
  );
}
