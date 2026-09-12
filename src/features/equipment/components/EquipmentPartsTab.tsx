import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, MapPin, RefreshCw, SearchX } from 'lucide-react';
import { useCompatibleInventoryItems } from '@/features/inventory/hooks/useInventory';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePartsFiltering } from '@/features/equipment/hooks/usePartsFiltering';
import { DesktopPartsToolbar, MobilePartsToolbar } from './parts-tab';
import type { PartialInventoryItem } from '@/features/inventory/types/inventory';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';

interface EquipmentPartsTabProps {
  equipmentId: string;
  organizationId: string;
}

interface PartCardProps {
  part: PartialInventoryItem;
  onClick: () => void;
  isMobile: boolean;
}

const PartCard: React.FC<PartCardProps> = ({ part, onClick, isMobile }) => {
  const { t } = useI18n();
  const isLowStock = part.quantity_on_hand < part.low_stock_threshold;
  const isOutOfStock = part.quantity_on_hand <= 0;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-colors hover:bg-accent/50',
        isOutOfStock && 'border-destructive/50',
      )}
      onClick={onClick}
    >
      <CardContent className={cn('flex gap-4', isMobile ? 'p-3' : 'p-4')}>
        <div
          className={cn(
            'flex-shrink-0 rounded-md bg-muted flex items-center justify-center overflow-hidden relative',
            isMobile ? 'h-12 w-12' : 'h-16 w-16',
          )}
        >
          {part.image_url ? (
            <img
              src={part.image_url}
              alt={part.name}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Package className={cn('text-muted-foreground', isMobile ? 'h-6 w-6' : 'h-8 w-8')} />
          )}
          {part.hasAlternates && (
            <div
              className="absolute -top-1 -right-1 h-4 w-4 bg-info rounded-full flex items-center justify-center"
              title={t('equipmentParts.hasAlternates')}
            >
              <RefreshCw className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={cn('font-medium truncate', isMobile ? 'text-sm' : 'text-base')}>
                  {part.name}
                </h4>
                {part.hasAlternates && !isMobile && (
                  <Badge variant="outline" className="text-xs bg-info/10 text-info border-info/30 dark:bg-info/20 dark:text-info dark:border-info/40 shrink-0">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    {t('equipmentParts.alternates')}
                  </Badge>
                )}
              </div>
              {part.sku && (
                <p className="text-xs text-muted-foreground truncate">SKU: {part.sku}</p>
              )}
            </div>

            <div className="flex-shrink-0 flex flex-col items-end gap-1">
              {isOutOfStock ? (
                <Badge variant="destructive" className="text-xs">
                  {t('equipmentParts.outOfStock')}
                </Badge>
              ) : isLowStock ? (
                <Badge variant="secondary" className="text-xs bg-warning/20 text-warning dark:bg-warning/20 dark:text-warning">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {t('equipmentParts.lowStock')}
                </Badge>
              ) : null}
              <span
                className={cn(
                  'text-sm font-medium',
                  isOutOfStock
                    ? 'text-destructive'
                    : isLowStock
                      ? 'text-warning dark:text-warning'
                      : 'text-foreground',
                )}
              >
                {t('equipmentParts.inStockCount', { count: part.quantity_on_hand })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {part.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{part.location}</span>
              </div>
            )}
            {part.hasAlternates && isMobile && (
              <div className="flex items-center gap-1 text-xs text-info dark:text-info">
                <RefreshCw className="h-3 w-3" />
                <span>{t('equipmentParts.alternates')}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EquipmentPartsTab: React.FC<EquipmentPartsTabProps> = ({
  equipmentId,
  organizationId,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: compatibleParts = [], isLoading } = useCompatibleInventoryItems(
    organizationId,
    [equipmentId],
  );

  const {
    filters,
    filteredParts,
    activeFilterCount,
    hasActiveFilters,
    setSearch,
    setStockFilter,
    setHasAlternatesOnly,
    setSort,
    clearFilters,
  } = usePartsFiltering({ parts: compatibleParts });

  const handlePartClick = (itemId: string) => {
    navigate(`/dashboard/inventory/${itemId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index}>
            <CardContent className={isMobile ? 'p-3' : 'p-4'}>
              <div className="flex gap-4">
                <div className={cn('bg-muted animate-pulse rounded-md', isMobile ? 'h-12 w-12' : 'h-16 w-16')} />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (compatibleParts.length === 0) {
    return (
      <div className="space-y-6">
        <div className={isMobile ? 'text-center' : ''}>
          <h3 className={cn('font-semibold', isMobile ? 'text-base' : 'text-lg')}>
            {t('equipmentParts.compatibleParts')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('equipmentParts.compatibleCountPlural', { count: 0 })}
          </p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('equipmentParts.noCompatibleParts')}</h3>
            <p className="text-muted-foreground">{t('equipmentParts.noCompatiblePartsDescription')}</p>
            <p className="text-sm text-muted-foreground mt-2">{t('equipmentParts.compatibilityHint')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const compatibleCountKey =
    compatibleParts.length === 1
      ? 'equipmentParts.compatibleCount'
      : 'equipmentParts.compatibleCountPlural';

  return (
    <div className="space-y-6">
      <div className={isMobile ? 'text-center' : ''}>
        <h3 className={cn('font-semibold', isMobile ? 'text-base' : 'text-lg')}>
          {t('equipmentParts.compatibleParts')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {hasActiveFilters
            ? t('equipmentParts.showing', {
                filtered: filteredParts.length,
                total: compatibleParts.length,
              })
            : t(compatibleCountKey, { count: compatibleParts.length })}
        </p>
      </div>

      {isMobile ? (
        <MobilePartsToolbar
          filters={filters}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={setSearch}
          onStockFilterChange={setStockFilter}
          onHasAlternatesChange={setHasAlternatesOnly}
          onSortChange={setSort}
          onClearFilters={clearFilters}
        />
      ) : (
        <DesktopPartsToolbar
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={setSearch}
          onStockFilterChange={setStockFilter}
          onHasAlternatesChange={setHasAlternatesOnly}
          onSortChange={setSort}
          onClearFilters={clearFilters}
        />
      )}

      <div className="space-y-3">
        {filteredParts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <SearchX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('equipmentParts.noFilterMatches')}</h3>
              <p className="text-muted-foreground mb-4">{t('equipmentParts.adjustFilters')}</p>
              <Button variant="outline" onClick={clearFilters}>
                {t('equipmentParts.clearFilters')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredParts.map((part) => (
            <PartCard
              key={part.id}
              part={part}
              onClick={() => handlePartClick(part.id)}
              isMobile={isMobile}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default EquipmentPartsTab;
