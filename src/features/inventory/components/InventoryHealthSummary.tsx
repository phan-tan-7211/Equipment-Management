import type { InventoryListMetadata } from '@/features/inventory/types/inventory';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';

type InventoryHealthSummaryProps = {
  metadata: InventoryListMetadata;
  className?: string;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function InventoryHealthSummary({
  metadata,
  className,
}: InventoryHealthSummaryProps) {
  const { t } = useI18n();
  const stats = [
    { label: t('inventoryList.total'), value: metadata.totalCount, tone: 'text-foreground' },
    { label: t('inventoryList.lowStock'), value: metadata.lowStockCount, tone: 'text-warning' },
    { label: t('inventoryList.outOfStock'), value: metadata.outOfStockCount, tone: 'text-destructive' },
    { label: t('inventoryList.negative'), value: metadata.negativeStockCount, tone: 'text-destructive' },
    {
      label: t('inventoryList.missingData'),
      value:
        metadata.missingLocationCount +
        metadata.missingUnitCostCount +
        metadata.missingSkuCount,
      tone: 'text-muted-foreground',
    },
    {
      label: t('inventoryList.estimatedValue'),
      value: formatCurrency(metadata.estimatedInventoryValue),
      tone: 'text-foreground',
      isText: true,
    },
  ];

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6',
        className,
      )}
      aria-label={t('inventoryList.healthSummary')}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-md border bg-card px-3 py-2"
        >
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p className={cn('text-sm font-semibold tabular-nums', stat.tone)}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
