import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { useCustomAttributes, type CustomAttribute } from '@/hooks/useCustomAttributes';
import { useI18n } from '@/i18n';

interface CustomAttributesSectionProps {
  initialAttributes?: CustomAttribute[] | Record<string, string>;
  onChange: (attributes: CustomAttribute[]) => void;
  hasError?: boolean;
}

const CustomAttributesSection: React.FC<CustomAttributesSectionProps> = ({
  initialAttributes = [],
  onChange,
  hasError = false
}) => {
  const { t } = useI18n();
  const normalizedInitialAttributes = React.useMemo(() => {
    if (Array.isArray(initialAttributes)) return initialAttributes;
    if (initialAttributes && typeof initialAttributes === 'object') {
      return Object.entries(initialAttributes).map(([key, value]) => ({
        id: crypto.randomUUID(),
        key,
        value: String(value)
      }));
    }
    return [];
  }, [initialAttributes]);

  const {
    attributes,
    addAttribute,
    removeAttribute,
    updateAttribute,
    getCleanAttributes
  } = useCustomAttributes(normalizedInitialAttributes);

  React.useEffect(() => {
    onChange(getCleanAttributes());
  }, [attributes, onChange, getCleanAttributes]);

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            {t('equipmentCustomAttributes.title')}
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
            <Plus className="h-4 w-4 mr-1" />
            {t('equipmentCustomAttributes.add')}
          </Button>
        </div>

        {hasError && (
          <p className="text-sm text-destructive">
            {t('equipmentCustomAttributes.uniqueRequired')}
          </p>
        )}

        <div className="space-y-3">
          {attributes.map((attribute) => (
            <div key={attribute.id} className="flex gap-2 items-start">
              <div className="flex-1">
                <Label htmlFor={`attr-key-${attribute.id}`} className="sr-only">
                  {t('equipmentCustomAttributes.name')}
                </Label>
                <Input
                  id={`attr-key-${attribute.id}`}
                  placeholder={t('equipmentCustomAttributes.namePlaceholder')}
                  value={attribute.key}
                  onChange={(e) => updateAttribute(attribute.id, 'key', e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`attr-value-${attribute.id}`} className="sr-only">
                  {t('equipmentCustomAttributes.value')}
                </Label>
                <Input
                  id={`attr-value-${attribute.id}`}
                  placeholder={t('equipmentCustomAttributes.valuePlaceholder')}
                  value={attribute.value}
                  onChange={(e) => updateAttribute(attribute.id, 'value', e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeAttribute(attribute.id)}
                disabled={attributes.length === 1}
                aria-label={t('equipmentCustomAttributes.deleteAria', { name: attribute.key || t('equipmentCustomAttributes.unnamed') })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomAttributesSection;
