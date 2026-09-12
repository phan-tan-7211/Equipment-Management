import type { OperatorCheckinSubmission } from '@/features/operator-check-ins/services/operatorCheckinSubmissionsService';
import type { OperatorCheckinReportExportOptions } from '@/features/operator-check-ins/services/operatorCheckinReportExportOptions';
import { DEFAULT_COMPACT_EXPORT_OPTIONS } from '@/features/operator-check-ins/services/operatorCheckinReportExportOptions';
import {
  buildCapturedFieldExportRows,
  buildChecklistExportRows,
  buildSubmissionExportRow,
  buildSummarySheetRows,
  generateReportFilename,
  resolveReportDateRangeLabels,
} from '@/features/operator-check-ins/services/operatorCheckinReportExportHelpers';
import type { LedgerDateRange } from '@/features/operator-check-ins/utils/operatorCheckinLedgerScope';
import { downloadBlob } from '@/utils/exportUtils';
import type { Language } from '@/i18n/I18nProvider';
import { getOperatorCheckinExcelLabels } from './operatorCheckinExcelLabels';

export async function downloadOperatorCheckinDailyExcel(
  submissions: OperatorCheckinSubmission[],
  dateRange: LedgerDateRange,
  templateName: string,
  equipmentLabel: string,
  options: OperatorCheckinReportExportOptions = DEFAULT_COMPACT_EXPORT_OPTIONS,
  language: Language = 'en',
): Promise<void> {
  const { reportDateRangeLabel, dateRangeFilenamePart } = resolveReportDateRangeLabels(dateRange);
  const labels = getOperatorCheckinExcelLabels(language);

  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet(
    buildSummarySheetRows(reportDateRangeLabel, templateName, equipmentLabel, submissions, labels),
  );
  XLSX.utils.book_append_sheet(workbook, summarySheet, labels.summary);

  const submissionRows = submissions.map((submission) => {
    const row = buildSubmissionExportRow(submission, options);
    const answers = Array.isArray(submission.checklist_answers) ? submission.checklist_answers : [];
    const passCount = answers.filter((answer) => answer.passed).length;
    const failCount = answers.filter((answer) => !answer.passed).length;
    return [
      row.equipmentName,
      row.serialNumber ?? '',
      row.templateName ?? '',
      row.submittedAt,
      row.isComplete ? labels.yes : labels.no,
      row.requiredAnswered,
      options.includeChecklist && language !== 'en'
        ? (row.requiredAnswered ? `${labels.checklist}: ${row.requiredAnswered} ${labels.requiredAnswered}, ${passCount} ${labels.pass}, ${failCount} ${labels.fail}` : '')
        : row.checklistSummary ?? '',
    ];
  });
  const submissionsSheet = XLSX.utils.aoa_to_sheet([
    [labels.equipment, labels.serial, labels.template, labels.submitted, labels.complete, labels.requiredAnswered, labels.summary],
    ...submissionRows,
  ]);
  XLSX.utils.book_append_sheet(workbook, submissionsSheet, labels.submittedSheet);

  const capturedRows = submissions.flatMap((submission) =>
    buildCapturedFieldExportRows(submission, options).map((row) => [
      row.equipmentName,
      row.label,
      row.source === 'operator_input' ? labels.operatorInput : row.source === 'equipment_snapshot' ? labels.equipmentSnapshot : labels.clientContext,
      row.value,
    ]),
  );
  if (capturedRows.length > 0) {
    const capturedSheet = XLSX.utils.aoa_to_sheet([
      [labels.equipment, labels.label, labels.source, labels.value],
      ...capturedRows,
    ]);
    XLSX.utils.book_append_sheet(workbook, capturedSheet, labels.captured);
  }

  if (options.includeChecklist) {
    const checklistRows = submissions.flatMap((submission) =>
      buildChecklistExportRows(submission, options).map((row) => [
        row.equipmentName,
        row.templateName ?? '',
        row.section,
        row.itemTitle,
        row.required ? labels.yes : labels.no,
        row.passed === null ? '' : row.passed ? labels.pass : labels.fail,
        row.notes ?? '',
      ]),
    );
    if (checklistRows.length > 0) {
      const checklistSheet = XLSX.utils.aoa_to_sheet([
        [labels.equipment, labels.template, labels.section, labels.item, labels.required, labels.result, labels.notes],
        ...checklistRows,
      ]);
      XLSX.utils.book_append_sheet(workbook, checklistSheet, labels.checklist);
    }
  }

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const filename = generateReportFilename(submissions, dateRangeFilenamePart, 'xlsx');
  downloadBlob(blob, filename);
}

export async function downloadOperatorCheckinDailyReport(
  submissions: OperatorCheckinSubmission[],
  dateRange: LedgerDateRange,
  templateName: string,
  equipmentLabel: string,
  options: OperatorCheckinReportExportOptions,
  language: Language = 'en',
): Promise<void> {
  if (options.format === 'xlsx') {
    await downloadOperatorCheckinDailyExcel(
      submissions,
      dateRange,
      templateName,
      equipmentLabel,
      options,
      language,
    );
    return;
  }
  const { downloadOperatorCheckinDailyPdf } = await import(
    '@/features/operator-check-ins/services/operatorCheckinReportPdfService'
  );
  await downloadOperatorCheckinDailyPdf(
    submissions,
    dateRange,
    templateName,
    equipmentLabel,
    options,
  );
}
