import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, Check, X } from 'lucide-react';
import { responsiveHoverEditIconClassName } from './inlineEditStyles';
import CustomAttributesSection from './CustomAttributesSection';
import { CustomAttributesReadOnlyGrid } from '@/features/equipment/components/CustomAttributesReadOnlyGrid';
import type { CustomAttribute } from '@/hooks/useCustomAttributes';
import { useI18n } from '@/i18n';

interface InlineEditCustomAttributesProps {
  attributes?: Record<string, string>;
  value?: Record<string, string>;
  onSave: (newValue: Record<string, string>) => Promise<void>;
  canEdit: boolean;
}

const InlineEditCustomAttributes: React.FC<InlineEditCustomAttributesProps> = ({
  attributes,
  value,
  onSave,
  canEdit
}) => {
  const { t } = useI18n();
  const attributesData = attributes ?? value ?? {};
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editAttributes, setEditAttributes] = useState<CustomAttribute[]>([]);

  const handleStartEdit = () => {
    const attributeArray = Object.entries(attributesData).map(([key, val]) => ({
      id: crypto.randomUUID(),
      key,
      value: String(val)
    }));
    setEditAttributes(attributeArray.length > 0 ? attributeArray : []);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const attributeObject = Object.fromEntries(
        editAttributes
          .filter(attr => attr.key.trim() !== '' && attr.value.trim() !== '')
          .map(attr => [attr.key, attr.value])
      );
      await onSave(attributeObject);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving custom attributes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => setIsEditing(false);

  if (!canEdit && Object.keys(attributesData).length === 0) {
    return <p className="text-muted-foreground">{t('equipmentCustomAttributes.none')}</p>;
  }

  if (!canEdit) return <CustomAttributesReadOnlyGrid attributes={attributesData} />;

  if (!isEditing) {
    return (
      <div>
        <div className="group flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium">{t('equipmentCustomAttributes.title')}</h4>
          <Button
            variant="ghost"
            size="sm"
            className={responsiveHoverEditIconClassName}
            onClick={handleStartEdit}
            aria-label={t('equipmentCustomAttributes.editAria')}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {Object.keys(attributesData).length > 0 ? (
          <CustomAttributesReadOnlyGrid attributes={attributesData} />
        ) : (
          <p className="text-muted-foreground">{t('equipmentCustomAttributes.none')}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium">{t('equipmentCustomAttributes.editTitle')}</h4>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleSave} disabled={isSaving}>
            <Check className="h-4 w-4 mr-1" />
            {t('equipmentCustomAttributes.save')}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
            <X className="h-4 w-4 mr-1" />
            {t('equipmentCustomAttributes.cancel')}
          </Button>
        </div>
      </div>
      <CustomAttributesSection initialAttributes={editAttributes} onChange={setEditAttributes} />
    </div>
  );
};

export default InlineEditCustomAttributes;
