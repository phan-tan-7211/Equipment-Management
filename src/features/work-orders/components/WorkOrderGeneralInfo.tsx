import { useI18n } from '@/i18n';
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WorkOrderFormData } from '@/features/work-orders/hooks/useWorkOrderForm';
import { useVoiceTextAppender } from '@/hooks/useVoiceTextAppender';
import VoiceInputButton from '@/components/common/VoiceInputButton';
import VoiceInterimTranscript from '@/components/common/VoiceInterimTranscript';

interface WorkOrderGeneralInfoProps {
  values: Pick<WorkOrderFormData, 'title' | 'priority' | 'description'>;
  errors: Partial<Record<keyof Pick<WorkOrderFormData, 'title' | 'priority' | 'description'>, string>>;
  setValue: <K extends keyof WorkOrderFormData>(field: K, value: WorkOrderFormData[K]) => void;
  preSelectedEquipment?: {
    id?: string;
    name?: string;
  } | null;
  pmTemplateControl?: React.ReactNode;
}

export const WorkOrderGeneralInfo: React.FC<WorkOrderGeneralInfoProps> = ({
  values,
  errors,
  setValue,
  preSelectedEquipment,
  pmTemplateControl,
}) => {
  const { t } = useI18n();
  const titleFieldId = "work-order-title";
  const priorityFieldId = "work-order-priority";
  const descriptionFieldId = "work-order-description";

  const {
    isListening,
    error: speechError,
    interimTranscript,
    toggleListening,
    canUseVoice,
  } = useVoiceTextAppender({
    value: values.description || '',
    onChange: (value) => setValue('description', value),
  });

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
          {t('workOrderForm.generalInformation')}
        </h3>

        <div className="space-y-2">
          <Label htmlFor={titleFieldId}>{t('workOrderForm.fieldTitle')}</Label>
          <Input
            id={titleFieldId}
            placeholder={preSelectedEquipment ?
              t('workOrderForm.maintenanceFor', { name: preSelectedEquipment.name || '' }) :
              t('workOrderForm.workBrief')
            }
            value={values.title || ''}
            onChange={(e) => setValue('title', e.target.value)}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title}</p>
          )}
        </div>

        {pmTemplateControl}

        <div className="space-y-2">
          <Label htmlFor={priorityFieldId}>{t('workOrderForm.priority')}</Label>
          <Select
            value={values.priority}
            onValueChange={(value) => setValue('priority', value as WorkOrderFormData['priority'])}
          >
            <SelectTrigger id={priorityFieldId}>
              <SelectValue placeholder={t('workOrderForm.selectPriority')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  {t('workOrderForm.lowPriority')}
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  {t('workOrderForm.mediumPriority')}
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  {t('workOrderForm.highPriority')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.priority && (
            <p className="text-sm text-destructive">{errors.priority}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={descriptionFieldId}>{t('workOrderForm.description')}</Label>
          <div className="relative">
            <Textarea
              id={descriptionFieldId}
              placeholder={preSelectedEquipment ?
                t('workOrderForm.describeEquipment', { name: preSelectedEquipment.name || '' }) :
                t('workOrderForm.describeWork')
              }
              className="min-h-30 pb-12"
              value={values.description || ''}
              onChange={(e) => setValue('description', e.target.value)}
            />
            <VoiceInterimTranscript
              isListening={isListening}
              interimTranscript={interimTranscript}
              className="bottom-12 left-2 right-2"
            />
            <VoiceInputButton
              isListening={isListening}
              onToggle={toggleListening}
              canUseVoice={canUseVoice}
              className="absolute bottom-2 left-2"
            />
          </div>
          {speechError && (
            <p className="text-sm text-destructive">{speechError}</p>
          )}
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};




