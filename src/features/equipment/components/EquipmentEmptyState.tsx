import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Forklift, SearchX } from 'lucide-react';
import { useI18n } from '@/i18n';

export interface EquipmentEmptyStateProps {
  searchQuery: string;
  statusFilter: string;
  organizationName: string;
  canCreate: boolean;
  onAddEquipment: () => void;
  onClearFilters?: () => void;
}

const EquipmentEmptyState: React.FC<EquipmentEmptyStateProps> = ({ searchQuery, statusFilter, organizationName, canCreate, onAddEquipment, onClearFilters }) => {
  const { t } = useI18n();
  const hasFilters = !!(searchQuery || statusFilter !== 'all');

  return (
    <Card>
      <CardContent className="flex flex-col items-center text-center py-14 px-6">
        {hasFilters ? <SearchX className="h-12 w-12 text-muted-foreground/60 mb-4" /> : <Forklift className="h-12 w-12 text-muted-foreground/60 mb-4" />}
        <h3 className="text-base font-semibold mb-1">{hasFilters ? t('equipment.noMatches') : t('equipment.noEquipmentYet')}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          {hasFilters ? t('equipment.adjustFilters') : t('equipment.addFirstEquipment', { name: organizationName })}
        </p>
        {hasFilters && onClearFilters && <Button onClick={onClearFilters} className="min-h-11">{t('equipment.clearFilters')}</Button>}
        {!hasFilters && canCreate && <Button onClick={onAddEquipment} className="min-h-11"><Plus className="h-4 w-4 mr-2" />{t('equipment.addEquipment')}</Button>}
      </CardContent>
    </Card>
  );
};

export default EquipmentEmptyState;
