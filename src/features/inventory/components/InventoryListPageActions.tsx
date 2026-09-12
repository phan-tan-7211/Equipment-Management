import { Plus, Table2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/i18n';

type InventoryListPageActionsProps = {
  canCreate: boolean;
  canManage: boolean;
  onOpenManagersSheet: () => void;
  onAddItem: () => void;
  onNavigateBulk: () => void;
};

export function InventoryListPageActions({
  canCreate,
  canManage,
  onOpenManagersSheet,
  onAddItem,
  onNavigateBulk,
}: InventoryListPageActionsProps) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2">
      {canManage && (
        <Button
          variant="outline"
          onClick={onOpenManagersSheet}
          className="hidden sm:inline-flex"
        >
          <Users className="mr-2 h-4 w-4" />
          {t('inventoryList.partsAccess')}
        </Button>
      )}

      {canCreate && (
        <div className="hidden sm:inline-flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('inventoryList.addItem')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                {t('inventoryList.addSingleItem')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNavigateBulk}>
                <Table2 className="mr-2 h-4 w-4" />
                {t('inventoryList.bulkAddEdit')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
