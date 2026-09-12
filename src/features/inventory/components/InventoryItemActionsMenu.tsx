import { Eye, Layers, Minus, Pencil, Plus, QrCode } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { InventoryItem } from '@/features/inventory/types/inventory';
import { useI18n } from '@/i18n';

export type InventoryItemActionHandlers = {
  canCreate: boolean;
  adjustPending: boolean;
  onViewDetails: (itemId: string) => void;
  onQuickAdjust: (itemId: string, delta: 1 | -1) => void;
  onShowQR: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onManageAlternateGroups?: (itemId: string) => void;
};

type InventoryItemActionsMenuProps = InventoryItemActionHandlers & {
  item: InventoryItem;
};

export function InventoryItemActionsMenu({
  item,
  canCreate,
  adjustPending,
  onViewDetails,
  onQuickAdjust,
  onShowQR,
  onEdit,
  onManageAlternateGroups,
}: InventoryItemActionsMenuProps) {
  const { t } = useI18n();

  return (
    <>
      <DropdownMenuItem onClick={() => onViewDetails(item.id)}>
        <Eye className="mr-2 h-4 w-4" />
        {t('inventoryList.viewDetails')}
      </DropdownMenuItem>
      {canCreate && (
        <DropdownMenuItem
          onClick={() => {
            void onQuickAdjust(item.id, 1);
          }}
          disabled={adjustPending}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('inventoryList.addOne')}
        </DropdownMenuItem>
      )}
      {canCreate && (
        <DropdownMenuItem
          onClick={() => {
            void onQuickAdjust(item.id, -1);
          }}
          disabled={adjustPending}
        >
          <Minus className="mr-2 h-4 w-4" />
          {t('inventoryList.takeOne')}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => onShowQR(item)}>
        <QrCode className="mr-2 h-4 w-4" />
        {t('inventoryList.qrCode')}
      </DropdownMenuItem>
      {canCreate && (
        <DropdownMenuItem onClick={() => onEdit(item)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t('inventoryList.edit')}
        </DropdownMenuItem>
      )}
      {canCreate && onManageAlternateGroups && (
        <DropdownMenuItem onClick={() => onManageAlternateGroups(item.id)}>
          <Layers className="mr-2 h-4 w-4" />
          {t('inventoryList.manageAlternateGroups')}
        </DropdownMenuItem>
      )}
    </>
  );
}
