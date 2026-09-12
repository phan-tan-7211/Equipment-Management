import { useI18n } from '@/i18n/I18nProvider';
import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import type { OperatorCheckinSubmission } from '@/features/operator-check-ins/services/operatorCheckinSubmissionsService';
import {
  applyDetailPreset,
  DEFAULT_COMPACT_EXPORT_OPTIONS,
  type OperatorCheckinReportExportOptions,
  type OperatorCheckinReportDetailLevel,
  type OperatorCheckinReportFormat,
} from '@/features/operator-check-ins/services/operatorCheckinReportExportOptions';

interface OperatorCheckinReportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportDateRangeLabel: string;
  templateName: string;
  equipmentLabel: string;
  submissions: OperatorCheckinSubmission[];
  onExport: (options: OperatorCheckinReportExportOptions) => Promise<void>;
}

function describeIncludedSections(options: OperatorCheckinReportExportOptions, t: (key: string) => string): string {
  const parts: string[] = [];
  if (options.includeOperatorFields) parts.push(t('operatorCheckinDetail.operatorFields'));
  if (options.includeEquipmentSnapshot) parts.push(t('operatorCheckinDetail.snapshot'));
  if (options.includeClientContext) parts.push(t('operatorCheckinDetail.context'));
  if (options.includeChecklist) {
    parts.push(
      options.checklistMode === 'exceptions'
        ? t('operatorCheckinDetail.exceptions')
        : t('operatorCheckinDetail.fullChecklist'),
    );
  }
  return parts.length > 0 ? parts.join(', ') : t('operatorCheckinDetail.summaryOnly');
}

export function OperatorCheckinReportExportDialog({
  open,
  onOpenChange,
  reportDateRangeLabel,
  templateName,
  equipmentLabel,
  submissions,
  onExport,
}: OperatorCheckinReportExportDialogProps) {
  const { t } = useI18n();
  const [options, setOptions] = useState<OperatorCheckinReportExportOptions>(
    DEFAULT_COMPACT_EXPORT_OPTIONS,
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const completeCount = useMemo(
    () => submissions.filter((submission) => submission.is_complete).length,
    [submissions],
  );

  const updateOptions = (patch: Partial<OperatorCheckinReportExportOptions>) => {
    setOptions((current) => ({ ...current, ...patch }));
  };

  const handlePresetChange = (preset: OperatorCheckinReportDetailLevel) => {
    setOptions((current) => applyDetailPreset(preset, current));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      await onExport(options);
      onOpenChange(false);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : t('operatorCheckinDetail.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('operatorCheckinDetail.exportTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('operatorCheckinDetail.exportIntro')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-1">
            <p><span className="font-medium">{t('operatorCheckinDetail.dateRange')}</span> {reportDateRangeLabel}</p>
            <p><span className="font-medium">{t('operatorCheckinDetail.reportTemplateLabel')}</span> {templateName}</p>
            <p><span className="font-medium">{t('operatorCheckinDetail.equipmentLabel')}</span> {equipmentLabel}</p>
            <p>
              <span className="font-medium">{t('operatorCheckinDetail.submissionsLabel')}</span> {submissions.length}
              {' '}({t('operatorCheckinDetail.completeCount', { count: completeCount })})
            </p>
            <p className="text-muted-foreground pt-1">
              {t('operatorCheckinDetail.includes')} {describeIncludedSections(options, t)}
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('operatorCheckinDetail.format')}</Label>
            <RadioGroup
              value={options.format}
              onValueChange={(value) => updateOptions({ format: value as OperatorCheckinReportFormat })}
              className="grid gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="pdf" id="export-format-pdf" />
                <Label htmlFor="export-format-pdf" className="font-normal cursor-pointer">
                  PDF
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="xlsx" id="export-format-xlsx" />
                <Label htmlFor="export-format-xlsx" className="font-normal cursor-pointer">
                  {t('operatorCheckinDetail.excelWorkbook')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('operatorCheckinDetail.detailPreset')}</Label>
            <RadioGroup
              value={options.detailLevel}
              onValueChange={(value) => handlePresetChange(value as OperatorCheckinReportDetailLevel)}
              className="grid gap-2"
            >
              <div className="flex items-start gap-2">
                <RadioGroupItem value="compact" id="export-preset-compact" className="mt-1" />
                <div>
                  <Label htmlFor="export-preset-compact" className="font-normal cursor-pointer">
                    {t('operatorCheckinDetail.compactReview')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('operatorCheckinDetail.compactHelp')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="full" id="export-preset-full" className="mt-1" />
                <div>
                  <Label htmlFor="export-preset-full" className="font-normal cursor-pointer">
                    {t('operatorCheckinDetail.fullAudit')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('operatorCheckinDetail.fullAuditHelp')}
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t('operatorCheckinDetail.includeSections')}</Label>
              <Badge variant="secondary" className="text-[10px]">{t('operatorCheckinDetail.optional')}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-operator-fields"
                  checked={options.includeOperatorFields}
                  onCheckedChange={(checked) =>
                    updateOptions({ includeOperatorFields: checked === true })}
                />
                <Label htmlFor="include-operator-fields" className="font-normal cursor-pointer">
                  {t('operatorCheckinDetail.operatorEnteredFields')}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-equipment-snapshot"
                  checked={options.includeEquipmentSnapshot}
                  onCheckedChange={(checked) =>
                    updateOptions({ includeEquipmentSnapshot: checked === true })}
                />
                <Label htmlFor="include-equipment-snapshot" className="font-normal cursor-pointer">
                  {t('operatorCheckinDetail.snapshotFields')}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-client-context"
                  checked={options.includeClientContext}
                  onCheckedChange={(checked) =>
                    updateOptions({ includeClientContext: checked === true })}
                />
                <Label htmlFor="include-client-context" className="font-normal cursor-pointer">
                  {t('operatorCheckinDetail.contextFields')}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-checklist"
                  checked={options.includeChecklist}
                  onCheckedChange={(checked) =>
                    updateOptions({ includeChecklist: checked === true })}
                />
                <Label htmlFor="include-checklist" className="font-normal cursor-pointer">
                  {t('operatorCheckinDetail.checklistResults')}
                </Label>
              </div>

              {options.includeChecklist && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="checklist-exceptions-only"
                      checked={options.checklistMode === 'exceptions'}
                      onCheckedChange={(checked) =>
                        updateOptions({ checklistMode: checked ? 'exceptions' : 'all' })}
                    />
                    <Label htmlFor="checklist-exceptions-only" className="font-normal cursor-pointer">
                      {t('operatorCheckinDetail.failuresOnly')}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="include-notes"
                      checked={options.includeNotes}
                      onCheckedChange={(checked) =>
                        updateOptions({ includeNotes: checked === true })}
                    />
                    <Label htmlFor="include-notes" className="font-normal cursor-pointer">
                      {t('operatorCheckinDetail.includeNotes')}
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {exportError && (
            <p className="text-sm text-destructive" role="alert">{exportError}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            {t('operatorCheckinDetail.cancel')}
          </Button>
          <Button onClick={() => void handleExport()} disabled={isExporting || submissions.length === 0}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('operatorCheckinDetail.exporting')}
              </>
            ) : (
              <>
                {options.format === 'xlsx' ? (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                {t('operatorCheckinDetail.downloadReport')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
