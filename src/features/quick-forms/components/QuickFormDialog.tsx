import React, { useEffect, useState } from 'react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { QuickFormFieldsEditor } from './QuickFormFieldsEditor';
import type { QuickForm } from '@/features/quick-forms/services/quickFormsService';
import {
  parseQuickFormData,
  type QuickFormData,
  type QuickFormField,
} from '@/features/quick-forms/types/quickForm';

export interface QuickFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this form; otherwise it creates a new one. */
  editingForm: QuickForm | null;
  onSubmit: (input: {
    name: string;
    description: string | null;
    formData: QuickFormData;
  }) => Promise<void>;
  isSaving: boolean;
}

export function QuickFormDialog({
  open,
  onOpenChange,
  editingForm,
  onSubmit,
  isSaving,
}: QuickFormDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<QuickFormField[]>([]);
  const [collectLocation, setCollectLocation] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingForm) {
      const parsed = parseQuickFormData(editingForm.form_data);
      setName(editingForm.name);
      setDescription(editingForm.description ?? '');
      setFields(parsed.fields);
      setCollectLocation(parsed.collectLocation === true);
    } else {
      setName('');
      setDescription('');
      setFields([]);
      setCollectLocation(false);
    }
  }, [open, editingForm]);

  const validFields = fields.filter((field) => field.label.trim().length > 0);
  const canSave = name.trim().length > 0 && validFields.length > 0 && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    await onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      formData: {
        fields: validFields.map((field) => ({ ...field, label: field.label.trim() })),
        collectLocation,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingForm ? t('quickForms.dialog.editTitle') : t('quickForms.dialog.newTitle')}</DialogTitle>
          <DialogDescription>
            {t('quickForms.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="quick-form-name">{t('quickForms.dialog.name')}</Label>
            <Input
              id="quick-form-name"
              value={name}
              placeholder={t('quickForms.dialog.namePlaceholder')}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quick-form-description">{t('quickForms.dialog.descriptionLabel')}</Label>
            <Textarea
              id="quick-form-description"
              value={description}
              placeholder={t('quickForms.dialog.descriptionPlaceholder')}
              rows={2}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="quick-form-collect-location"
              checked={collectLocation}
              onCheckedChange={setCollectLocation}
            />
            <Label htmlFor="quick-form-collect-location" className="text-sm">
              {t('quickForms.dialog.collectGPS')}
            </Label>
          </div>

          <div className="space-y-1.5">
            <Label>{t('quickForms.dialog.fields')}</Label>
            <QuickFormFieldsEditor fields={fields} onChange={setFields} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('quickForms.page.cancel')}
          </Button>
          <Button onClick={() => void handleSave()} disabled={!canSave}>
            {isSaving ? t('quickForms.dialog.saving') : editingForm ? t('quickForms.dialog.saveChanges') : t('quickForms.dialog.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
