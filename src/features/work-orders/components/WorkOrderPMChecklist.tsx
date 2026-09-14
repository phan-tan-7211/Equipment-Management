import { useI18n } from '@/i18n';
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Globe, Info, X } from 'lucide-react';
import {
  PM_TEMPLATE_NONE_VALUE,
  useWorkOrderPMChecklist,
  type WorkOrderPMChecklistEquipment,
  type WorkOrderPMChecklistSetValue,
  type WorkOrderPMChecklistValues,
} from '@/features/work-orders/hooks/useWorkOrderPMChecklist';
import type { PMTemplateSummary } from '@/features/pm-templates/services/pmChecklistTemplatesService';

interface PMTemplateSelectorProps {
  isLoading: boolean;
  templates: PMTemplateSummary[];
  selectedValue: string;
  onTemplateChange: (templateId: string) => void;
  showLicenseFooter?: boolean;
  canCreateCustomPMTemplates?: boolean;
  assignedTemplate?: PMTemplateSummary | null;
  equipmentName?: string;
}

const PMTemplateSelector: React.FC<PMTemplateSelectorProps> = ({
  isLoading,
  templates,
  selectedValue,
  onTemplateChange,
  showLicenseFooter = false,
  canCreateCustomPMTemplates = true,
  assignedTemplate,
  equipmentName,
}) => {
  const { t } = useI18n();
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-sm text-muted-foreground">{t('workOrderForm.loadingTemplates')}</p>
      </div>
    );
  }

  return (
    <Select
      value={selectedValue}
      onValueChange={onTemplateChange}
      disabled={isLoading}
    >
      <SelectTrigger id="pm-template-select" aria-label={t('workOrderForm.pmTemplate')}>
        <SelectValue placeholder={t('workOrderForm.selectPmTemplate')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={PM_TEMPLATE_NONE_VALUE}>{t('workOrderForm.none')}</SelectItem>
        {templates.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            <div className="flex items-center gap-2">
              <span>{template.name}</span>
              {template.organization_id === null && (
                <div className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  <span className="text-xs text-muted-foreground">{t('workOrderForm.global')}</span>
                </div>
              )}
              {assignedTemplate?.id === template.id && equipmentName && (
                <span className="text-xs text-muted-foreground">{t('workOrderForm.equipmentDefault')}</span>
              )}
            </div>
          </SelectItem>
        ))}
        {showLicenseFooter && !canCreateCustomPMTemplates && templates.some(t => t.organization_id) && (
          <div className="border-t px-2 py-1 text-xs text-muted-foreground">
            {t('workOrderForm.customLicense')}
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

interface WorkOrderPMChecklistProps {
  values: WorkOrderPMChecklistValues;
  setValue: WorkOrderPMChecklistSetValue;
  selectedEquipment?: WorkOrderPMChecklistEquipment | null;
  allowTemplateOverride?: boolean;
  autoDefaultFromEquipment?: boolean;
}

export const WorkOrderPMChecklist: React.FC<WorkOrderPMChecklistProps> = ({
  values,
  setValue,
  selectedEquipment,
  allowTemplateOverride = false,
  autoDefaultFromEquipment = false,
}) => {
  const { t } = useI18n();
  const {
    templates,
    selectedTemplate,
    assignedTemplate,
    isLoading,
    restrictions,
    handleTemplateChange,
    handleClearTemplate,
    selectValue,
  } = useWorkOrderPMChecklist({
    values,
    setValue,
    selectedEquipment,
    allowTemplateOverride,
    autoDefaultFromEquipment,
  });

  const hasPmSelected = Boolean(values.pmTemplateId);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="pm-template-select">{t('workOrderForm.pmTemplate')}</Label>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {templates.length === 0 && !isLoading && !hasPmSelected ? (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm text-muted-foreground">
                  {t('workOrderForm.noPmTemplates')}
                </p>
              </div>
            ) : (
              <PMTemplateSelector
                isLoading={isLoading}
                templates={templates}
                selectedValue={selectValue}
                onTemplateChange={handleTemplateChange}
                showLicenseFooter
                canCreateCustomPMTemplates={restrictions.canCreateCustomPMTemplates}
                assignedTemplate={assignedTemplate}
                equipmentName={selectedEquipment?.name}
              />
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
        {assignedTemplate && selectedEquipment && hasPmSelected && values.pmTemplateId === assignedTemplate.id && (
          <p className="text-xs text-muted-foreground">
            {t('workOrderForm.pmEquipmentDefaultHint', { name: selectedEquipment.name })}
          </p>
        )}
      </div>

      {hasPmSelected && (
        <>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t('workOrderForm.pmChecklistHint')}
            </AlertDescription>
          </Alert>

          {selectedTemplate && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{t('workOrderForm.pmChecklistPreview')}</span>
                <span className="text-xs text-muted-foreground">{t('workOrderForm.items', { count: selectedTemplate.itemCount })}</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {selectedTemplate.sections.map((section) => (
                  <div key={section.name}>• {section.name} {t('workOrderForm.items', { count: section.count })}</div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
