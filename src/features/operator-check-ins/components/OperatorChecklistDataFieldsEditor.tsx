import { useI18n } from '@/i18n/I18nProvider';
import { MapPin, User, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CLIENT_CONTEXT_FIELD_OPTIONS,
  EQUIPMENT_SNAPSHOT_FIELD_OPTIONS,
  OPERATOR_INPUT_TYPE_OPTIONS,
  type OperatorChecklistDataField,
  type OperatorFieldSource,
} from '@/features/operator-check-ins/types/operatorChecklist';
import { createOperatorDataField } from '@/features/operator-check-ins/services/operatorChecklistTemplatesService';
import {
  OperatorChecklistRowCard,
  RequiredBadge,
} from '@/features/operator-check-ins/components/OperatorChecklistRowCard';
import { useOperatorChecklistExpandedRows } from '@/features/operator-check-ins/hooks/useOperatorChecklistExpandedRows';

interface OperatorChecklistDataFieldsEditorProps {
  fields: OperatorChecklistDataField[];
  onChange: (fields: OperatorChecklistDataField[]) => void;
}

const SOURCE_META: Record<
  OperatorFieldSource,
  { icon: typeof User; badgeVariant: 'default' | 'secondary' | 'outline' }
> = {
  operator_input: { icon: User, badgeVariant: 'default' },
  client_context: { icon: MapPin, badgeVariant: 'secondary' },
  equipment_snapshot: { icon: Wrench, badgeVariant: 'outline' },
};

function resolveFieldSubtitle(field: OperatorChecklistDataField, t: (key: string) => string): string {
  if (field.source === 'operator_input') {
    const option = OPERATOR_INPUT_TYPE_OPTIONS.find((o) => o.key === (field.inputType ?? 'text'));
    return t(`operatorCheckinDetail.${option?.key ?? 'text'}`);
  }
  if (field.source === 'client_context') {
    const option = CLIENT_CONTEXT_FIELD_OPTIONS.find((o) => o.key === field.clientKey);
    return option ? t(`operatorCheckinDetail.${option.key}`) : t('operatorCheckinDetail.clientContextField');
  }
  const option = EQUIPMENT_SNAPSHOT_FIELD_OPTIONS.find((o) => o.key === field.equipmentKey);
  return option ? t(`operatorCheckinDetail.${option.key === 'name' ? 'equipment_name' : option.key === 'status' ? 'equipment_status' : option.key}`) : t('operatorCheckinDetail.equipmentField');
}

function sourceSpecificSelectLabel(source: OperatorFieldSource, t: (key: string) => string): string {
  switch (source) {
    case 'operator_input':
      return t('operatorCheckinDetail.answerType');
    case 'client_context':
      return t('operatorCheckinDetail.clientContextField');
    case 'equipment_snapshot':
      return t('operatorCheckinDetail.equipmentField');
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

export function OperatorChecklistDataFieldsEditor({
  fields,
  onChange,
}: OperatorChecklistDataFieldsEditorProps) {
  const { expandedIds, setRowOpen, clearExpanded, expandRow } = useOperatorChecklistExpandedRows();
  const { t } = useI18n();

  function updateField(index: number, patch: Partial<OperatorChecklistDataField>) {
    onChange(fields.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  }

  function removeField(index: number) {
    const removedId = fields[index]?.id;
    onChange(fields.filter((_, i) => i !== index));
    if (removedId) clearExpanded(removedId);
  }

  function addField(source: OperatorFieldSource) {
    const newField = createOperatorDataField(source);
    onChange([...fields, newField]);
    expandRow(newField.id);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('operatorCheckinDetail.capturedFields')}</CardTitle>
        <CardDescription>
          {t('operatorCheckinDetail.capturedFieldsHelp')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => addField('operator_input')}>
            <User className="mr-2 h-4 w-4" />
            Add operator field
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addField('client_context')}>
            <MapPin className="mr-2 h-4 w-4" />
            Add client field
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addField('equipment_snapshot')}>
            <Wrench className="mr-2 h-4 w-4" />
            Add equipment field
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('operatorCheckinDetail.noFields')}
          </p>
        ) : (
          fields.map((field, index) => {
            const meta = SOURCE_META[field.source];
            const SourceIcon = meta.icon;
            return (
              <OperatorChecklistRowCard
                key={field.id}
                title={field.label}
                emptyTitle={t('operatorCheckinDetail.untitledField')}
                subtitle={resolveFieldSubtitle(field, t)}
                icon={<SourceIcon className="h-4 w-4" />}
                badges={
                  <>
                    <Badge variant={meta.badgeVariant} className="font-normal">
                      {t(`operatorCheckinDetail.${field.source === 'operator_input' ? 'operatorInput' : field.source === 'client_context' ? 'clientContext' : 'equipmentSnapshot'}`)}
                    </Badge>
                    {field.required && field.source === 'operator_input' && <RequiredBadge />}
                  </>
                }
                isOpen={expandedIds.has(field.id)}
                onOpenChange={(open) => setRowOpen(field.id, open)}
                onRemove={() => removeField(index)}
                removeLabel={t('operatorCheckinDetail.removeField', { name: field.label || index + 1 })}
              >
                <div className="space-y-2">
                  <Label htmlFor={`field-label-${field.id}`}>{t('operatorCheckinDetail.fieldLabel')}</Label>
                  <Input
                    id={`field-label-${field.id}`}
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    placeholder={t('operatorCheckinDetail.fieldHint')}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`field-source-${field.id}`}>{t('operatorCheckinDetail.fieldSource')}</Label>
                    <Select
                      value={field.source}
                      onValueChange={(value) =>
                        updateField(
                          index,
                          createOperatorDataField(value as OperatorFieldSource, {
                            id: field.id,
                            label: field.label,
                            required: field.required,
                            helpText: field.helpText,
                          }),
                        )
                      }
                    >
                      <SelectTrigger id={`field-source-${field.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operator_input">{t('operatorCheckinDetail.operatorEnters')}</SelectItem>
                        <SelectItem value="client_context">{t('operatorCheckinDetail.clientDevice')}</SelectItem>
                        <SelectItem value="equipment_snapshot">{t('operatorCheckinDetail.equipmentRecord')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`field-specific-${field.id}`}>
                      {sourceSpecificSelectLabel(field.source, t)}
                    </Label>
                    {field.source === 'operator_input' && (
                      <Select
                        value={field.inputType ?? 'text'}
                        onValueChange={(value) =>
                          updateField(index, {
                            inputType: value as OperatorChecklistDataField['inputType'],
                          })
                        }
                      >
                        <SelectTrigger id={`field-specific-${field.id}`}>
                          <SelectValue placeholder={t('operatorCheckinDetail.inputType')} />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATOR_INPUT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.key} value={option.key}>
                              {t(`operatorCheckinDetail.${option.key === 'name' ? 'equipment_name' : option.key === 'status' ? 'equipment_status' : option.key}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.source === 'client_context' && (
                      <Select
                        value={field.clientKey ?? ''}
                        onValueChange={(value) =>
                          updateField(index, {
                            clientKey: value as OperatorChecklistDataField['clientKey'],
                          })
                        }
                      >
                        <SelectTrigger id={`field-specific-${field.id}`}>
                          <SelectValue placeholder={t('operatorCheckinDetail.clientContextField')} />
                        </SelectTrigger>
                        <SelectContent>
                          {CLIENT_CONTEXT_FIELD_OPTIONS.map((option) => (
                            <SelectItem key={option.key} value={option.key}>
                              {t(`operatorCheckinDetail.${option.key === 'name' ? 'equipment_name' : option.key === 'status' ? 'equipment_status' : option.key}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.source === 'equipment_snapshot' && (
                      <Select
                        value={field.equipmentKey ?? ''}
                        onValueChange={(value) =>
                          updateField(index, {
                            equipmentKey: value as OperatorChecklistDataField['equipmentKey'],
                          })
                        }
                      >
                        <SelectTrigger id={`field-specific-${field.id}`}>
                          <SelectValue placeholder={t('operatorCheckinDetail.equipmentField')} />
                        </SelectTrigger>
                        <SelectContent>
                          {EQUIPMENT_SNAPSHOT_FIELD_OPTIONS.map((option) => (
                            <SelectItem key={option.key} value={option.key}>
                              {t(`operatorCheckinDetail.${option.key === 'name' ? 'equipment_name' : option.key === 'status' ? 'equipment_status' : option.key}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`field-help-${field.id}`}>{t('operatorCheckinDetail.helpText')}</Label>
                  <Input
                    id={`field-help-${field.id}`}
                    value={field.helpText ?? ''}
                    onChange={(e) => updateField(index, { helpText: e.target.value || undefined })}
                    placeholder={t('operatorCheckinDetail.helpTextHint')}
                  />
                </div>

                {field.source === 'operator_input' && (
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div className="space-y-0.5">
                      <Label htmlFor={`field-required-${field.id}`}>{t('operatorCheckinDetail.requireAnswer')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('operatorCheckinDetail.requireAnswerHelp')}
                      </p>
                    </div>
                    <Switch
                      id={`field-required-${field.id}`}
                      checked={Boolean(field.required)}
                      onCheckedChange={(checked) => updateField(index, { required: checked })}
                    />
                  </div>
                )}
              </OperatorChecklistRowCard>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
