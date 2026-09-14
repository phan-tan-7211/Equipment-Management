import { useI18n } from '@/i18n';
import React from 'react';
import { FileText, Image as ImageIcon, Package2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import InlineEditField from '@/features/equipment/components/InlineEditField';
import ImageUploadWithNote from '@/components/common/ImageUploadWithNote';
import { getStockHealthPresentation } from '@/features/inventory/utils/stockHealth';
import { resolveStockHealthTier } from '@/features/inventory/utils/stockHealthLevels';
import { InventoryItemEffectiveLocationBlock } from '@/features/inventory/pages/components/InventoryItemEffectiveLocationBlock';
import type { InventoryStructuredLocationFields } from '@/features/inventory/utils/inventoryLocationUtils';
import type { SessionOrganization } from '@/types/session';
import { cn } from '@/lib/utils';
import type { InventoryItem, InventoryItemImage } from '@/features/inventory/types/inventory';

interface InventoryItemOverviewTabProps {
  item: InventoryItem;
  organization: SessionOrganization | null;
  canEdit: boolean;
  itemImages: InventoryItemImage[];
  onFieldUpdate: (
    field: 'name' | 'description' | 'sku' | 'external_id' | 'location',
    value: string
  ) => Promise<void>;
  onNumericFieldUpdate: (
    field: 'low_stock_threshold' | 'default_unit_cost',
    value: string
  ) => Promise<void>;
  onSaveStructuredLocation: (location: InventoryStructuredLocationFields) => Promise<void>;
  onDeleteImage: (image: InventoryItemImage) => Promise<void>;
  onUploadImages: (files: File[]) => Promise<void>;
  onDeleteItemRequest: () => void;
}

const InventoryItemOverviewTab: React.FC<InventoryItemOverviewTabProps> = ({
  item,
  organization,
  canEdit,
  itemImages,
  onFieldUpdate,
  onNumericFieldUpdate,
  onSaveStructuredLocation,
  onDeleteImage,
  onUploadImages,
  onDeleteItemRequest,
}) => {
  const { t } = useI18n();
  const stockHealth = getStockHealthPresentation(item);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <FileText className="h-5 w-5" />
              {t('inventoryDetail.basicInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">{t('inventoryDetail.name')}</Label>
              <div className="mt-0.5">
                <InlineEditField
                  value={item.name || ''}
                  onSave={(value) => onFieldUpdate('name', value)}
                  canEdit={canEdit}
                  placeholder={t('inventoryDetail.enterItemName')}
                  className="text-base"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">{t('inventoryDetail.description')}</Label>
              <div className="mt-0.5">
                <InlineEditField
                  value={item.description || ''}
                  onSave={(value) => onFieldUpdate('description', value)}
                  canEdit={canEdit}
                  type="textarea"
                  placeholder={t('inventoryDetail.enterDescription')}
                  className="text-base"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">{t('inventoryDetail.sku')}</Label>
              <div className="mt-0.5">
                <InlineEditField
                  value={item.sku || ''}
                  onSave={(value) => onFieldUpdate('sku', value)}
                  canEdit={canEdit}
                  placeholder={t('inventoryDetail.enterSku')}
                  className="text-base font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">{t('inventoryDetail.externalId')}</Label>
              <div className="mt-0.5">
                <InlineEditField
                  value={item.external_id || ''}
                  onSave={(value) => onFieldUpdate('external_id', value)}
                  canEdit={canEdit}
                  placeholder={t('inventoryDetail.enterExternalId')}
                  className="text-base font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">{t('inventoryDetail.locationName')}</Label>
              <div className="mt-0.5">
                <InlineEditField
                  value={item.location || ''}
                  onSave={(value) => onFieldUpdate('location', value)}
                  canEdit={canEdit}
                  placeholder={t('inventoryDetail.enterLocationName')}
                  className="text-base"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('inventoryDetail.locationHint')}
              </p>
            </div>

            <InventoryItemEffectiveLocationBlock
              item={item}
              organization={organization}
              canEdit={canEdit}
              onSaveStructuredLocation={onSaveStructuredLocation}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Package2 className="h-5 w-5" />
              {t('inventoryDetail.stockInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('inventoryDetail.quantityOnHand')}</Label>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <p className="text-2xl font-bold">{item.quantity_on_hand}</p>
                <Badge variant="outline" className={cn('rounded-full px-2 py-0.5 text-xs font-medium', stockHealth.className)}>
                  {t(`inventoryList.stockHealth.${resolveStockHealthTier(item)}`)}
                </Badge>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('inventoryDetail.lowStockThreshold')}</Label>
              <div className="mt-0.5">
                <InlineEditField
                  value={String(item.low_stock_threshold)}
                  onSave={(value) => onNumericFieldUpdate('low_stock_threshold', value)}
                  canEdit={canEdit}
                  type="number"
                  placeholder={t('inventoryDetail.enterThreshold')}
                  className="text-base font-medium"
                  editAriaLabel={t('inventoryDetail.editThreshold')}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">{t('inventoryDetail.defaultUnitCost')}</Label>
              <div className="mt-0.5">
                <InlineEditField
                  value={item.default_unit_cost != null ? String(item.default_unit_cost) : ''}
                  onSave={(value) => onNumericFieldUpdate('default_unit_cost', value)}
                  canEdit={canEdit}
                  type="number"
                  placeholder={t('inventoryDetail.enterUnitCost')}
                  className="text-base font-medium"
                  displayNode={
                    item.default_unit_cost != null
                      ? `$${Number(item.default_unit_cost).toFixed(2)}`
                      : undefined
                  }
                  editAriaLabel={t('inventoryDetail.editUnitCost')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <ImageIcon className="h-5 w-5" />
            {t('inventoryDetail.images')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {itemImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {itemImages.map((img) => (
                <div key={img.id} className="relative group">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={img.file_url}
                      alt={img.file_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      aria-label={t('inventoryDetail.removeImage', { name: img.file_name })}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onDeleteImage(img)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 truncate">{img.file_name}</p>
                </div>
              ))}
            </div>
          )}

          {item.image_url && itemImages.length === 0 && (
            <div>
              <img
                src={item.image_url}
                alt={item.name}
                className="max-w-full h-auto rounded-md"
                loading="lazy"
                decoding="async"
              />
              <p className="text-xs text-muted-foreground mt-2">{t('inventoryDetail.legacyImage')}</p>
            </div>
          )}

          {canEdit && itemImages.length < 5 && (
            <ImageUploadWithNote
              onUpload={onUploadImages}
              maxFiles={5 - itemImages.length}
              disabled={false}
            />
          )}

          {!canEdit && itemImages.length === 0 && !item.image_url && (
            <p className="text-sm text-muted-foreground">{t('inventoryDetail.noImages')}</p>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <div className="mt-8 space-y-4">
          <Separator />
          <Card className="border-destructive/80 bg-destructive/[0.06] dark:bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold tracking-tight text-destructive">
                {t('inventoryDetail.deleteItem')}
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('inventoryDetail.deleteWarning')}
            </p>
            <Button
              variant="destructive"
              onClick={onDeleteItemRequest}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('inventoryDetail.deleteInventoryItem')}
            </Button>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
};

export default InventoryItemOverviewTab;
