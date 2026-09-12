import { useI18n } from '@/i18n';
import React from 'react';
import { handleKeyboardActivation } from '@/components/a11y/keyboard';
import { Search, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlternateGroupResponsiveDialog } from '@/features/inventory/components/AlternateGroupResponsiveDialog';
import type { InventoryItem } from '@/features/inventory/types/inventory';

type AlternateGroupAddItemDialogProps = {
  isMobile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemSearch: string;
  onItemSearchChange: (value: string) => void;
  filteredItems: InventoryItem[];
  availableItemsCount: number;
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
  isPrimaryItem: boolean;
  onPrimaryItemChange: (checked: boolean) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isPending: boolean;
};

function AddItemDialogBody({
  itemSearch,
  onItemSearchChange,
  filteredItems,
  availableItemsCount,
  selectedItemId,
  onSelectItem,
  isPrimaryItem,
  onPrimaryItemChange,
  onCancel,
  onSubmit,
  isPending,
}: Omit<AlternateGroupAddItemDialogProps, 'isMobile' | 'open' | 'onOpenChange'>) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={t('alternateGroupDetail.searchItems')}
          value={itemSearch}
          onChange={(e) => onItemSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-1">
        {filteredItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {!itemSearch.trim() && availableItemsCount > 0
              ? t('alternateGroupDetail.searchItemsHint')
              : availableItemsCount === 0
                ? t('alternateGroupDetail.allItemsAdded')
                : t('alternateGroupDetail.noItemsSearch')}
          </p>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              className={`p-2 rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                selectedItemId === item.id
                  ? 'bg-primary/15 border-2 border-primary ring-2 ring-primary/20'
                  : 'border border-transparent'
              }`}
              onClick={() => onSelectItem(item.id)}
              onKeyDown={(e) => handleKeyboardActivation(e, () => onSelectItem(item.id))}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.sku && `SKU: ${item.sku} • `}
                    {t('alternateGroupDetail.qty', { count: item.quantity_on_hand })}
                  </p>
                </div>
                {selectedItemId === item.id && (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-primary"
          checked={isPrimaryItem}
          onCheckedChange={(checked) => onPrimaryItemChange(checked as boolean)}
        />
        <Label htmlFor="is-primary" className="text-sm">
          {t('alternateGroupDetail.primaryPart')}
        </Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          {t('alternateGroups.cancel')}
        </Button>
        <Button onClick={onSubmit} disabled={!selectedItemId || isPending}>
          {isPending ? t('alternateGroupDetail.adding') : t('alternateGroupDetail.addItem')}
        </Button>
      </div>
    </div>
  );
}

export function AlternateGroupAddItemDialog(props: AlternateGroupAddItemDialogProps) {
  const { t } = useI18n();
  const { isMobile, open, onOpenChange } = props;

  return (
    <AlternateGroupResponsiveDialog
      isMobile={isMobile}
      open={open}
      onOpenChange={onOpenChange}
      title={t('alternateGroupDetail.addItemTitle')}
      description={t('alternateGroupDetail.addItemDescription')}
    >
      <AddItemDialogBody {...props} />
    </AlternateGroupResponsiveDialog>
  );
}
