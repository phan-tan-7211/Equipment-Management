import { useI18n } from '@/i18n';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Forklift } from 'lucide-react';
import { InventoryCompatibleEquipmentPicker } from '@/features/inventory/components/InventoryCompatibleEquipmentPicker';

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
          <CardContent className="pt-0">
            <InventoryCompatibleEquipmentPicker
              allEquipment={allEquipment}
              searchValue={equipmentSearch}
              onSearchChange={setEquipmentSearch}
              selectedEquipmentIds={selectedEquipmentIds}
              onToggle={onEquipmentToggle}
              searchPlaceholder={t('itemForm.searchEquipment')}
              noEquipmentText={t('itemForm.noEquipment')}
              noMatchesText={t('itemForm.noEquipment')}
              selectedBadgeLabel={t('inventoryDetail.selected')}
            />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
