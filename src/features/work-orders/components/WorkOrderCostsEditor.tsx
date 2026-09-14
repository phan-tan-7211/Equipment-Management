import { useI18n } from '@/i18n';
// fallow-ignore-file code-duplication
// Duplication rationale: Editable costs parallel read-only list layout

import React, { useCallback } from 'react';
import {
  calculateWorkOrderCostsSubtotal,
  formatWorkOrderCostCurrency,
} from '@/features/work-orders/utils/workOrderCostFormatters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { WorkOrderCostItem } from '@/features/work-orders/hooks/useWorkOrderCostsState';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileCostItem from './MobileCostItem';
import DesktopCostItem from './DesktopCostItem';

interface WorkOrderCostsEditorProps {
  costs: WorkOrderCostItem[];
  onAddCost: () => void;
  onRemoveCost: (id: string) => void;
  onUpdateCost: (id: string, field: keyof WorkOrderCostItem, value: string | number) => void;
  hasError?: boolean;
  /**
   * When true on mobile, hides the duplicate “Cost Items” + inline Add strip — parent supplies CTAs.
   */
  suppressMobileChrome?: boolean;
}

const WorkOrderCostsEditor: React.FC<WorkOrderCostsEditorProps> = ({
  costs,
  onAddCost,
  onRemoveCost,
  onUpdateCost,
  hasError = false,
  suppressMobileChrome = false,
}) => {
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const showMobileHeaderStrip = !(isMobile && suppressMobileChrome);
  
  const formatCurrency = formatWorkOrderCostCurrency;

  const calculateSubtotal = useCallback(() => {
    return calculateWorkOrderCostsSubtotal(costs);
  }, [costs]);

  const canRemove = costs.length > 1;

  return (
    <div className="space-y-4 overflow-x-hidden">
      {showMobileHeaderStrip ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            {t('workOrderOperations.costItems')}
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={onAddCost}>
            <Plus className="h-4 w-4 mr-1" />
            {t('workOrderOperations.addCostItem')}
          </Button>
        </div>
      ) : null}

      {hasError ? (
        <p className="text-sm text-destructive" role="alert">
          {t('workOrderOperations.costError')}
        </p>
      ) : null}

      <div className="space-y-3">
        {/* Desktop Headers */}
        {!isMobile && (
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground px-3">
            <div>{t('workOrderOperations.description')}</div>
            <div>{t('workOrderOperations.quantity')}</div>
            <div>{t('workOrderOperations.unitPrice')}</div>
            <div className="text-right">{t('workOrderOperations.costTotal')}</div>
          </div>
        )}

        {/* Cost Items */}
        <div className="space-y-3">
          {costs.map((cost) => (
            <div key={cost.id}>
              {isMobile ? (
                <MobileCostItem 
                  cost={cost}
                  onRemoveCost={onRemoveCost}
                  onUpdateCost={onUpdateCost}
                  canRemove={canRemove}
                />
              ) : (
                <DesktopCostItem 
                  cost={cost}
                  onRemoveCost={onRemoveCost}
                  onUpdateCost={onUpdateCost}
                  canRemove={canRemove}
                />
              )}
            </div>
          ))}
        </div>

        {/* Subtotal */}
        {costs.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>{t('workOrderOperations.subtotal')}</span>
              <span>{formatCurrency(calculateSubtotal())}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkOrderCostsEditor;
