import { useI18n } from '@/i18n/I18nProvider';
import { ClipboardCheck, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { createDefaultOperatorChecklistItem } from '@/features/operator-check-ins/services/operatorChecklistTemplatesService';
import type { OperatorChecklistTemplateItem } from '@/features/operator-check-ins/types/operatorChecklist';
import {
  OperatorChecklistRowCard,
  RequiredBadge,
} from '@/features/operator-check-ins/components/OperatorChecklistRowCard';
import { useOperatorChecklistExpandedRows } from '@/features/operator-check-ins/hooks/useOperatorChecklistExpandedRows';

interface OperatorChecklistItemsEditorProps {
  items: OperatorChecklistTemplateItem[];
  onChange: (items: OperatorChecklistTemplateItem[]) => void;
  defaultSection?: string;
}

export function OperatorChecklistItemsEditor({
  items,
  onChange,
  defaultSection = 'Daily Safety',
}: OperatorChecklistItemsEditorProps) {
  const { expandedIds, setRowOpen, clearExpanded, expandRow } = useOperatorChecklistExpandedRows();
  const { t } = useI18n();

  function updateItem(index: number, patch: Partial<OperatorChecklistTemplateItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeItem(index: number) {
    const removedId = items[index]?.id;
    onChange(items.filter((_, i) => i !== index));
    if (removedId) clearExpanded(removedId);
  }

  function addItem() {
    const newItem = createDefaultOperatorChecklistItem(defaultSection);
    onChange([...items, newItem]);
    expandRow(newItem.id);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{t('operatorCheckinDetail.checklistItems')}</CardTitle>
            <CardDescription>
              {t('operatorCheckinDetail.checklistItemsHelp')}
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            {t('operatorCheckinDetail.addItem')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('operatorCheckinDetail.noItems')}
          </p>
        ) : (
          items.map((item, index) => (
            <OperatorChecklistRowCard
              key={item.id}
              title={item.title}
              emptyTitle={t('operatorCheckinDetail.untitledItem')}
              subtitle={item.section.trim() || t('operatorCheckinDetail.noSection')}
              icon={<ClipboardCheck className="h-4 w-4" />}
              badges={
                <>
                  {item.section.trim() && (
                    <Badge variant="outline" className="font-normal">
                      {item.section}
                    </Badge>
                  )}
                  {item.required && <RequiredBadge />}
                </>
              }
              isOpen={expandedIds.has(item.id)}
              onOpenChange={(open) => setRowOpen(item.id, open)}
              onRemove={() => removeItem(index)}
              removeLabel={t('operatorCheckinDetail.removeItem', { name: item.title || index + 1 })}
            >
              <div className="space-y-2">
                <Label htmlFor={`item-title-${item.id}`}>{t('operatorCheckinDetail.checklistItem')}</Label>
                <Input
                  id={`item-title-${item.id}`}
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  placeholder={t('operatorCheckinDetail.itemHint')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`item-section-${item.id}`}>{t('operatorCheckinDetail.section')}</Label>
                <Input
                  id={`item-section-${item.id}`}
                  value={item.section}
                  onChange={(e) => updateItem(index, { section: e.target.value })}
                  placeholder={t('operatorCheckinDetail.sectionHint')}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="space-y-0.5">
                  <Label htmlFor={`item-required-${item.id}`}>{t('operatorCheckinDetail.requiredItem')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('operatorCheckinDetail.requiredItemHelp')}
                  </p>
                </div>
                <Switch
                  id={`item-required-${item.id}`}
                  checked={item.required}
                  onCheckedChange={(checked) => updateItem(index, { required: checked })}
                />
              </div>
            </OperatorChecklistRowCard>
          ))
        )}
      </CardContent>
    </Card>
  );
}
