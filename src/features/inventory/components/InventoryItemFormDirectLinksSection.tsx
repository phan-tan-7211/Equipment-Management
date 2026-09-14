import { useI18n } from '@/i18n';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Forklift, Search } from 'lucide-react';
import { InventoryEquipmentPickerRow } from '@/features/inventory/components/InventoryEquipmentPickerRow';
import { SelectedEquipmentBadgeList } from '@/components/common/SelectedEquipmentBadgeList';

type EquipmentSummary = {
  id: string;
  name: string;
  manufacturer?: string | null;
  model?: string | null;
};

type InventoryItemFormDirectLinksSectionProps = {
  allEquipment: EquipmentSummary[];
  selectedEquipmentIds: string[];
  onEquipmentToggle: (equipmentId: string, checked: boolean) => void;
};

export function InventoryItemFormDirectLinksSection({
  allEquipment,
  selectedEquipmentIds,
  onEquipmentToggle,
}: InventoryItemFormDirectLinksSectionProps) {
  const { t } = useI18n();
  const [directLinksOpen, setDirectLinksOpen] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');

  const filteredEquipment = allEquipment.filter(
    eq =>
      eq.name.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      eq.manufacturer?.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
      eq.model?.toLowerCase().includes(equipmentSearch.toLowerCase()),
  );

  return (
    <Collapsible open={directLinksOpen} onOpenChange={setDirectLinksOpen}>
      <Card>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center justify-between w-full text-left hover:bg-muted/50 -mx-2 px-2 py-1 rounded transition-colors"
            >
              <CardTitle className="text-base flex items-center gap-2">
                <Forklift className="h-4 w-4" />
                {t('itemForm.directLinks')}
                {selectedEquipmentIds.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {t('itemForm.selectedCount', { count: selectedEquipmentIds.length })}
                  </Badge>
                )}
              </CardTitle>
              {directLinksOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
          <p className="text-sm text-muted-foreground mt-1">
            {t('itemForm.directHelp')}{' '}
            <em className="text-primary">{t('itemForm.preferRules')}</em>
          </p>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('itemForm.searchEquipment')}
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-2">
              {filteredEquipment.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t('itemForm.noEquipment')}</p>
              ) : (
                filteredEquipment.map((equipment) => (
                  <InventoryEquipmentPickerRow
                    key={equipment.id}
                    equipment={equipment}
                    isSelected={selectedEquipmentIds.includes(equipment.id)}
                    onToggle={onEquipmentToggle}
                  />
                ))
              )}
            </div>
            <SelectedEquipmentBadgeList
              selectedEquipmentIds={selectedEquipmentIds}
              allEquipment={allEquipment}
              onRemove={(id) => onEquipmentToggle(id, false)}
            />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
