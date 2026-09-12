import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChecklistTemplateToolbarProps = {
  isPageLayout: boolean;
  sectionCount: number;
  totalItemCount: number;
  previewMode: boolean;
  isLargeTemplate: boolean;
  focusSectionMode: boolean;
  onPreviewModeChange: (checked: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onEnableFocusSectionMode: () => void;
  onOpenAddSection: () => void;
};

export function ChecklistTemplateToolbar({
  isPageLayout,
  sectionCount,
  totalItemCount,
  previewMode,
  isLargeTemplate,
  focusSectionMode,
  onPreviewModeChange,
  onExpandAll,
  onCollapseAll,
  onEnableFocusSectionMode,
  onOpenAddSection,
}: ChecklistTemplateToolbarProps) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background/95 backdrop-blur p-3 mb-4',
        isPageLayout && 'sticky top-0 z-10'
      )}
    >
      <div className="text-sm text-muted-foreground">
        {t(sectionCount === 1 ? 'pmTemplates.editor.sectionCount' : 'pmTemplates.editor.sectionsCount', { count: sectionCount })} · {t(totalItemCount === 1 ? 'pmTemplates.editor.itemCount' : 'pmTemplates.editor.itemsCount', { count: totalItemCount })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('pmTemplates.editor.preview')}</span>
          <Switch checked={previewMode} onCheckedChange={onPreviewModeChange} />
        </div>
        {isLargeTemplate && (
          <Button
            size="sm"
            variant="outline"
            onClick={focusSectionMode ? onExpandAll : onEnableFocusSectionMode}
          >
            {focusSectionMode ? t('pmTemplates.editor.showAll') : t('pmTemplates.editor.focusSection')}
          </Button>
        )}
        {!focusSectionMode && (
          <>
            <Button size="sm" variant="ghost" onClick={onExpandAll} className="hidden md:inline-flex">
              {t('pmTemplates.editor.expandAll')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onCollapseAll} className="hidden md:inline-flex">
              {t('pmTemplates.editor.collapseAll')}
            </Button>
          </>
        )}
        <Button onClick={onOpenAddSection} size="sm">
          <Plus className="mr-1 h-3 w-3" />
          {t('pmTemplates.editor.addSection')}
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="ghost" aria-label={t('pmTemplates.editor.keyboardShortcuts')}>
              <HelpCircle className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 text-sm" align="end">
            <p className="font-medium mb-2">{t('pmTemplates.editor.keyboardShortcuts')}</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <kbd className="px-1 rounded bg-muted">Enter</kbd> — {t('pmTemplates.editor.shortcutAddBelow')}
              </li>
              <li>
                <kbd className="px-1 rounded bg-muted">Esc</kbd> — {t('pmTemplates.editor.shortcutCollapse')}
              </li>
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
