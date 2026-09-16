import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, PackagePlus, Link2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/i18n';
import {
  useCreateInventoryItem,
  useInventoryItems,
} from '@/features/inventory/hooks/useInventory';
import { useLinkItemToEquipment } from '@/features/inventory/hooks/inventoryEquipmentLinkMutations';
import type { InventoryItemFormData } from '@/features/inventory/schemas/inventorySchema';

type AddMode = 'existing' | 'new';

type EquipmentPartsAddDialogProps = {
  equipmentId: string;
  organizationId: string;
  linkedItemIds: string[];
};

type NewPartDraft = {
  name: string;
  sku: string;
  quantity: string;
  lowStockThreshold: string;
  location: string;
  unitCost: string;
};

const EMPTY_DRAFT: NewPartDraft = {
  name: '',
  sku: '',
  quantity: '0',
  lowStockThreshold: '5',
  location: '',
  unitCost: '',
};

const EquipmentPartsAddDialog: React.FC<EquipmentPartsAddDialogProps> = ({
  equipmentId,
  organizationId,
  linkedItemIds,
}) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AddMode>('existing');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<NewPartDraft>(EMPTY_DRAFT);
  const [validationError, setValidationError] = useState('');

  const { data: inventoryItems = [], isLoading: inventoryLoading } = useInventoryItems(
    organizationId,
    {},
  );
  const createMutation = useCreateInventoryItem();
  const linkMutation = useLinkItemToEquipment();

  useEffect(() => {
    if (!open) {
      setMode('existing');
      setSearch('');
      setDraft(EMPTY_DRAFT);
      setValidationError('');
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

  const updateDraft = (field: keyof NewPartDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setValidationError('');
  };

  const handleLinkExisting = async (itemId: string) => {
    await linkMutation.mutateAsync({
      organizationId,
      itemId,
      equipmentId,
    });
    await queryClient.invalidateQueries({
      queryKey: ['compatible-inventory-items', organizationId],
    });
    setOpen(false);
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = draft.name.trim();
    const quantity = Number(draft.quantity);
    const lowStockThreshold = Number(draft.lowStockThreshold);
    const unitCost = draft.unitCost.trim() === '' ? null : Number(draft.unitCost);

    if (!name) {
      setValidationError(t('equipmentParts.nameRequired'));
      return;
    }
    if (!Number.isInteger(quantity) || quantity < -10000) {
      setValidationError(t('equipmentParts.quantityInvalid'));
      return;
    }
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 1) {
      setValidationError(t('equipmentParts.thresholdInvalid'));
      return;
    }
    if (unitCost !== null && (!Number.isFinite(unitCost) || unitCost < 0)) {
      setValidationError(t('equipmentParts.unitCostInvalid'));
      return;
    }

    const formData: InventoryItemFormData = {
      name,
      description: null,
      sku: draft.sku.trim() || null,
      external_id: null,
      quantity_on_hand: quantity,
      low_stock_threshold: lowStockThreshold,
      location: draft.location.trim() || null,
      location_address: null,
      location_city: null,
      location_state: null,
      location_country: null,
      location_lat: null,
      location_lng: null,
      default_unit_cost: unitCost,
      compatibleEquipmentIds: [equipmentId],
      compatibilityRules: [],
      alternateGroupMode: 'none',
      alternateGroupId: null,
      newAlternateGroupName: null,
    };

    await createMutation.mutateAsync({ organizationId, formData });
    await queryClient.invalidateQueries({
      queryKey: ['compatible-inventory-items', organizationId],
    });
    setOpen(false);
  };

  const isMutating = createMutation.isPending || linkMutation.isPending;

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t('equipmentParts.addPart')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{t('equipmentParts.addPart')}</DialogTitle>
            <DialogDescription>
              {t('equipmentParts.addPartDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={mode === 'existing' ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => {
                setMode('existing');
                setValidationError('');
              }}
              disabled={isMutating}
            >
              <Link2 className="mr-2 h-4 w-4" />
              {t('equipmentParts.chooseExisting')}
            </Button>
            <Button
              type="button"
              variant={mode === 'new' ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => {
                setMode('new');
                setValidationError('');
              }}
              disabled={isMutating}
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              {t('equipmentParts.createNew')}
            </Button>
          </div>

          {mode === 'existing' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('equipmentParts.searchInventory')}
                  className="pl-9"
                  autoFocus
                />
              </div>
              <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-2">
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
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
                      onClick={() => handleLinkExisting(item.id)}
                      disabled={isMutating}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.sku ? `SKU: ${item.sku} · ` : ''}
                          {t('equipmentParts.inStockCount', { count: item.quantity_on_hand })}
                        </span>
                      </span>
                      <Link2 className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="equipment-part-name">{t('equipmentParts.partName')}</Label>
                  <Input
                    id="equipment-part-name"
                    value={draft.name}
                    onChange={(event) => updateDraft('name', event.target.value)}
                    placeholder={t('equipmentParts.partNamePlaceholder')}
                    disabled={isMutating}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment-part-sku">{t('equipmentParts.sku')}</Label>
                  <Input
                    id="equipment-part-sku"
                    value={draft.sku}
                    onChange={(event) => updateDraft('sku', event.target.value)}
                    placeholder="HEATER-001"
                    disabled={isMutating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment-part-location">{t('equipmentParts.location')}</Label>
                  <Input
                    id="equipment-part-location"
                    value={draft.location}
                    onChange={(event) => updateDraft('location', event.target.value)}
                    placeholder={t('equipmentParts.locationPlaceholder')}
                    disabled={isMutating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment-part-quantity">{t('equipmentParts.quantity')}</Label>
                  <Input
                    id="equipment-part-quantity"
                    type="number"
                    min="-10000"
                    step="1"
                    value={draft.quantity}
                    onChange={(event) => updateDraft('quantity', event.target.value)}
                    disabled={isMutating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment-part-threshold">{t('equipmentParts.lowStockThreshold')}</Label>
                  <Input
                    id="equipment-part-threshold"
                    type="number"
                    min="1"
                    step="1"
                    value={draft.lowStockThreshold}
                    onChange={(event) => updateDraft('lowStockThreshold', event.target.value)}
                    disabled={isMutating}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="equipment-part-cost">{t('equipmentParts.unitCost')}</Label>
                  <Input
                    id="equipment-part-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.unitCost}
                    onChange={(event) => updateDraft('unitCost', event.target.value)}
                    placeholder="0.00"
                    disabled={isMutating}
                  />
                </div>
              </div>

              {validationError && (
                <p className="text-sm text-destructive" role="alert">
                  {validationError}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isMutating}>
                  {t('equipmentParts.cancel')}
                </Button>
                <Button type="submit" disabled={isMutating}>
                  {isMutating ? t('equipmentParts.saving') : t('equipmentParts.createAndLink')}
                </Button>
              </DialogFooter>
            </form>
          )}

          {mode === 'existing' && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isMutating}>
                {t('equipmentParts.cancel')}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EquipmentPartsAddDialog;
