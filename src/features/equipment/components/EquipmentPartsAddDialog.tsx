import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, PackagePlus, Link2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/i18n';
import { useInventoryItems } from '@/features/inventory/hooks/useInventory';
import { useLinkItemToEquipment } from '@/features/inventory/hooks/inventoryEquipmentLinkMutations';
import { InventoryItemThumbnail } from '@/features/inventory/components/InventoryItemThumbnail';
import { InventoryItemForm } from '@/features/inventory/components/InventoryItemForm';

type EquipmentPartsAddDialogProps = {
  equipmentId: string;
  organizationId: string;
  linkedItemIds: string[];
};

const EquipmentPartsAddDialog: React.FC<EquipmentPartsAddDialogProps> = ({
  equipmentId,
  organizationId,
  linkedItemIds,
}) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');

  const { data: inventoryItems = [], isLoading: inventoryLoading } = useInventoryItems(
    organizationId,
    {},
  );
  const linkMutation = useLinkItemToEquipment();

  useEffect(() => {
    if (!open) {
      setSearch('');
    }
  }, [open]);

  const availableItems = useMemo(() => {
    const linked = new Set(linkedItemIds);
    const query = search.trim().toLowerCase();

    return inventoryItems
      .filter((item) => !linked.has(item.id))
      .filter((item) => {
        if (!query) return true;
        return [item.name, item.sku, item.external_id]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));
      })
      .slice(0, 100);
  }, [inventoryItems, linkedItemIds, search]);

  const refreshCompatibleParts = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['compatible-inventory-items', organizationId],
    });
  };

  const handleLinkExisting = async (itemId: string) => {
    await linkMutation.mutateAsync({
      organizationId,
      itemId,
      equipmentId,
    });
    await refreshCompatibleParts();
    setOpen(false);
  };

  const openSharedCreateForm = () => {
    setOpen(false);
    setShowCreateForm(true);
  };

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t('equipmentParts.addPart')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="xl" className="max-h-[calc(100dvh-2rem)]">
          <DialogHeader>
            <DialogTitle>{t('equipmentParts.addPart')}</DialogTitle>
            <DialogDescription>
              {t('equipmentParts.addPartDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="default" className="justify-start" disabled={linkMutation.isPending}>
              <Link2 className="mr-2 h-4 w-4" />
              {t('equipmentParts.chooseExisting')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={openSharedCreateForm}
              disabled={linkMutation.isPending}
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              {t('equipmentParts.createNew')}
            </Button>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('equipmentParts.searchInventory')}
                className="pl-9"
              />
            </div>
            <div className="min-w-0 max-h-72 space-y-1 overflow-x-hidden overflow-y-auto rounded-md border p-2 md:h-[clamp(20rem,44dvh,32rem)] md:max-h-[calc(100dvh-19rem)]">
              {inventoryLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t('equipmentParts.loadingInventory')}
                </p>
              ) : availableItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t('equipmentParts.noAvailableParts')}
                </p>
              ) : (
                availableItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
                    onClick={() => handleLinkExisting(item.id)}
                    disabled={linkMutation.isPending}
                  >
                    <InventoryItemThumbnail item={item} enableHover size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.sku ? `SKU: ${item.sku} · ` : ''}
                        {t('equipmentParts.inStockCount', { count: item.quantity_on_hand })}
                      </span>
                    </span>
                    <Link2 className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={linkMutation.isPending}>
              {t('equipmentParts.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InventoryItemForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        initialCompatibleEquipmentIds={[equipmentId]}
        onCreated={async () => {
          await refreshCompatibleParts();
          setShowCreateForm(false);
        }}
      />
    </>
  );
};

export default EquipmentPartsAddDialog;
