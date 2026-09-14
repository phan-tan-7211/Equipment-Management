import { useI18n } from '@/i18n';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlternateGroupResponsiveDialog } from '@/features/inventory/components/AlternateGroupResponsiveDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IDENTIFIER_TYPES } from '@/features/inventory/constants/partIdentifierTypes';
import type { PartIdentifierType } from '@/features/inventory/types/inventory';

type AlternateGroupAddIdentifierDialogProps = {
  isMobile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  identifierType: PartIdentifierType;
  onIdentifierTypeChange: (value: PartIdentifierType) => void;
  identifierValue: string;
  onIdentifierValueChange: (value: string) => void;
  identifierManufacturer: string;
  onIdentifierManufacturerChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isPending: boolean;
};

function AddIdentifierDialogBody({
  identifierType,
  onIdentifierTypeChange,
  identifierValue,
  onIdentifierValueChange,
  identifierManufacturer,
  onIdentifierManufacturerChange,
  onCancel,
  onSubmit,
  isPending,
}: Omit<AlternateGroupAddIdentifierDialogProps, 'isMobile' | 'open' | 'onOpenChange'>) {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="identifier-type">{t('alternateGroupDetail.identifierType')}</Label>
        <Select
          value={identifierType}
          onValueChange={(value) => onIdentifierTypeChange(value as PartIdentifierType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IDENTIFIER_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {t(`alternateGroupDetail.${type.value === 'sku' ? 'skuType' : type.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="identifier-value">
          {t('alternateGroupDetail.partNumbers')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="identifier-value"
          placeholder={t('alternateGroupDetail.partNumberExample')}
          value={identifierValue}
          onChange={(e) => onIdentifierValueChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="identifier-manufacturer">{t('alternateGroupDetail.manufacturer')}</Label>
        <Input
          id="identifier-manufacturer"
          placeholder={t('alternateGroupDetail.manufacturerExample')}
          value={identifierManufacturer}
          onChange={(e) => onIdentifierManufacturerChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t('alternateGroupDetail.manufacturerHelp')}
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          {t('alternateGroups.cancel')}
        </Button>
        <Button onClick={onSubmit} disabled={!identifierValue.trim() || isPending}>
          {isPending ? t('alternateGroupDetail.adding') : t('alternateGroupDetail.addPartNumber')}
        </Button>
      </div>
    </div>
  );
}

export function AlternateGroupAddIdentifierDialog(props: AlternateGroupAddIdentifierDialogProps) {
  const { t } = useI18n();
  const { isMobile, open, onOpenChange } = props;

  return (
    <AlternateGroupResponsiveDialog
      isMobile={isMobile}
      open={open}
      onOpenChange={onOpenChange}
      title={t('alternateGroupDetail.addPartNumber')}
      description={t('alternateGroupDetail.addIdentifierDescription')}
    >
      <AddIdentifierDialogBody {...props} />
    </AlternateGroupResponsiveDialog>
  );
}
