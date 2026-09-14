import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { InventoryItem } from '@/features/inventory/types/inventory';
import { getQuantityClassName } from '@/features/inventory/utils/inventoryListPresentation';
import { resolveStockHealthTier } from '@/features/inventory/utils/stockHealthLevels';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';

type InventoryQuantityValueProps = {
  item: InventoryItem;
  className?: string;
};

export function InventoryQuantityValue({ item, className }: InventoryQuantityValueProps) {
  const { t } = useI18n();
  const tier = resolveStockHealthTier(item);
  const stockHealthLabel = t(`inventoryList.stockHealth.${tier}`);
  const isColored = tier !== 'healthy';
  const quantityClassName = getQuantityClassName(item);

  if (!isColored) {
    return (
      <span className={cn('tabular-nums', quantityClassName, className)}>
        {item.quantity_on_hand}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn('tabular-nums cursor-default', quantityClassName, className)}
          aria-label={t('inventoryList.stockQuantityAria', {
            status: stockHealthLabel,
            quantity: item.quantity_on_hand,
          })}
        >
          {item.quantity_on_hand}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{stockHealthLabel}</TooltipContent>
    </Tooltip>
  );
}
