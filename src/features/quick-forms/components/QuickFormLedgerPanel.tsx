import React, { useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { Download, Eye, FileDown, FileSpreadsheet, FileText, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import { useFormatTimestamp } from '@/hooks/useFormatTimestamp';
import { useQuickFormSubmissions } from '@/features/quick-forms/hooks/useQuickFormSubmissions';
import {
  downloadQuickFormSubmissionsCsv,
  downloadQuickFormSubmissionsExcel,
  downloadQuickFormSubmissionsPdf,
} from '@/features/quick-forms/services/quickFormExportService';
import { formatQuickFormValue } from '@/features/quick-forms/types/quickForm';
import type { QuickForm } from '@/features/quick-forms/services/quickFormsService';
import type { QuickFormSubmission } from '@/features/quick-forms/services/quickFormSubmissionsService';
import { logger } from '@/utils/logger';

type LedgerRangeKey = 'last_7d' | 'last_30d' | 'all';

const RANGE_OPTIONS: { value: LedgerRangeKey; labelKey: string }[] = [
  { value: 'last_7d', labelKey: 'last7' },
  { value: 'last_30d', labelKey: 'last30' },
  { value: 'all', labelKey: 'allTime' },
];

function rangeToDateFrom(range: LedgerRangeKey): string | undefined {
  if (range === 'all') return undefined;
  const days = range === 'last_7d' ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export interface QuickFormLedgerPanelProps {
  organizationId: string;
  forms: QuickForm[];
}

/** Admin-only submissions ledger with per-form filter, date range, and exports (#1184). */
export function QuickFormLedgerPanel({ organizationId, forms }: QuickFormLedgerPanelProps) {
  const { t } = useI18n();
  const { formatDateTime } = useFormatTimestamp();
  const booleanLabels = { yes: t('quickForms.ledger.yes'), no: t('quickForms.ledger.no') };
  const [formFilter, setFormFilter] = useState<string>('all');
  const [range, setRange] = useState<LedgerRangeKey>('last_30d');
  const [viewing, setViewing] = useState<QuickFormSubmission | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters = useMemo(
    () => ({
      quickFormId: formFilter === 'all' ? undefined : formFilter,
      dateFrom: rangeToDateFrom(range),
    }),
    [formFilter, range],
  );

  const { data: submissions = [], isLoading } = useQuickFormSubmissions(organizationId, filters);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (submissions.length === 0 || exporting) return;
    setExporting(true);
    try {
      if (format === 'csv') {
        downloadQuickFormSubmissionsCsv(submissions);
      } else if (format === 'excel') {
        await downloadQuickFormSubmissionsExcel(submissions);
      } else {
        await downloadQuickFormSubmissionsPdf(submissions);
      }
      toast.success(t('quickForms.ledger.exported', { count: submissions.length }));
    } catch (error) {
      logger.error('Quick form ledger export failed', error);
      toast.error(t('quickForms.ledger.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('quickForms.ledger.title')}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={formFilter} onValueChange={setFormFilter}>
              <SelectTrigger className="w-52" aria-label={t('quickForms.ledger.filterForm')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('quickForms.ledger.allForms')}</SelectItem>
                {forms.map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={(value) => setRange(value as LedgerRangeKey)}>
              <SelectTrigger className="w-40" aria-label={t('quickForms.ledger.dateRange')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(`quickForms.ledger.${option.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={submissions.length === 0 || exporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? t('quickForms.ledger.exporting') : t('quickForms.ledger.export')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void handleExport('csv')}>
                  <FileText className="h-4 w-4 mr-2" />
                  CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleExport('pdf')}>
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF (.pdf)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={t('quickForms.ledger.emptyTitle')}
            description={t('quickForms.ledger.emptyDescription')}
            className="border-0 bg-transparent"
          />
        ) : (
          <div className="divide-y rounded-md border">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex items-center gap-3 px-3 py-2 text-sm"
                data-testid="quick-form-submission-row"
              >
                <span className="font-mono tabular-nums text-xs text-muted-foreground min-w-35">
                  {formatDateTime(submission.submitted_at)}
                </span>
                <Badge variant="outline" className="shrink-0">
                  {submission.form_snapshot?.name ?? t('quickForms.ledger.formFallback')}
                </Badge>
                <span className="truncate flex-1 text-muted-foreground">
                  {(submission.field_values ?? [])
                    .slice(0, 3)
                    .map((field) => `${field.label}: ${formatQuickFormValue(field.value, booleanLabels)}`)
                    .join(' · ')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 shrink-0"
                  onClick={() => setViewing(submission)}
                  aria-label={t('quickForms.ledger.viewDetails')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.form_snapshot?.name ?? t('quickForms.ledger.submission')}</DialogTitle>
            <DialogDescription>
              {viewing ? t('quickForms.ledger.submitted', { date: formatDateTime(viewing.submitted_at) }) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {(viewing?.field_values ?? []).map((field) => (
              <div key={field.field_id} className="grid grid-cols-[1fr_1fr] gap-2 border-b py-1.5 last:border-b-0">
                <span className="font-medium">{field.label}</span>
                <span className="text-muted-foreground wrap-break-word">
                  {formatQuickFormValue(field.value, booleanLabels)}
                </span>
              </div>
            ))}
            {viewing?.client_context?.browser_timezone && (
              <div className="grid grid-cols-[1fr_1fr] gap-2 border-b py-1.5">
                <span className="font-medium">{t('quickForms.ledger.timezone')}</span>
                <span className="text-muted-foreground">
                  {viewing.client_context.browser_timezone}
                </span>
              </div>
            )}
            {viewing?.client_context?.gps && (
              <div className="grid grid-cols-[1fr_1fr] gap-2 py-1.5">
                <span className="font-medium">GPS</span>
                <span className="text-muted-foreground">
                  {viewing.client_context.gps.latitude}, {viewing.client_context.gps.longitude}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
