import React from 'react';
import { Globe, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PM_TEMPLATE_NONE_VALUE,
  useWorkOrderPMChecklistForOrganization,
  type WorkOrderPMChecklistEquipment,
  type WorkOrderPMChecklistSetValue,
  type WorkOrderPMChecklistValues,
} from '@/features/work-orders/hooks/useWorkOrderPMChecklist';
import { useI18n } from '@/i18n';

interface QRWorkOrderPMChecklistProps {
  organizationId: string;
  values: WorkOrderPMChecklistValues;
  setValue: WorkOrderPMChecklistSetValue;
  selectedEquipment: WorkOrderPMChecklistEquipment;
  autoDefaultFromEquipment?: boolean;
}

const QRWorkOrderPMChecklist: React.FC<QRWorkOrderPMChecklistProps> = ({
  organizationId,
  values,
  setValue,
  selectedEquipment,
  autoDefaultFromEquipment = true,
}) => {
  const { t } = useI18n();
  const {
    templates,
    assignedTemplate,
    isLoading,
    restrictions,
    handleTemplateChange,
    handleClearTemplate,
    selectValue,
  } = useWorkOrderPMChecklistForOrganization(organizationId, {
    values,
    setValue,
    selectedEquipment,
    autoDefaultFromEquipment,
  });

  const hasPmSelected = Boolean(values.pmTemplateId);

  return (
    <div className="space-y-2">
      <Label htmlFor="qr-pm-template-select">{t('workOrderForm.pmTemplate')}</Label>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {templates.length === 0 && !isLoading && !hasPmSelected ? (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-sm text-muted-foreground">{t('workOrderForm.noPmTemplates')}</p>
            </div>
          ) : (
            <Select
              value={selectValue}
              onValueChange={handleTemplateChange}
              disabled={isLoading}
            >
              <SelectTrigger id="qr-pm-template-select" aria-label={t('workOrderForm.pmTemplate')}>
                <SelectValue placeholder={t('workOrderForm.selectPmTemplate')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PM_TEMPLATE_NONE_VALUE}>{t('workOrderForm.none')}</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{template.name}</span>
                      {template.organization_id === null && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Globe className="h-3 w-3" />
                          {t('workOrderForm.global')}
                        </span>
                      )}
                      {assignedTemplate?.id === template.id && (
                        <span className="text-xs text-muted-foreground">
                          {t('workOrderForm.equipmentDefault')}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {!restrictions.canCreateCustomPMTemplates && templates.some(template => template.organization_id) && (
                  <div className="border-t px-2 py-1 text-xs text-muted-foreground">
                    {t('workOrderForm.customLicense')}
                  </div>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
        {hasPmSelected && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t('workOrderForm.removePmTemplate')}
            onClick={handleClearTemplate}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {assignedTemplate && hasPmSelected && values.pmTemplateId === assignedTemplate.id && (
        <p className="text-xs text-muted-foreground">
          {t('workOrderForm.pmEquipmentDefaultHint', { name: selectedEquipment.name })}
        </p>
      )}
    </div>
  );
};

export default QRWorkOrderPMChecklist;
