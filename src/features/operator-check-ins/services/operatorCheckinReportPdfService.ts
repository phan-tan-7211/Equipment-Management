import type { OperatorCheckinSubmission } from '@/features/operator-check-ins/services/operatorCheckinSubmissionsService';
import type { OperatorCheckinReportExportOptions } from '@/features/operator-check-ins/services/operatorCheckinReportExportOptions';
import { DEFAULT_COMPACT_EXPORT_OPTIONS } from '@/features/operator-check-ins/services/operatorCheckinReportExportOptions';
import {
  buildSubmissionPdfLines,
  generateReportFilename,
  resolveReportDateRangeLabels,
} from '@/features/operator-check-ins/services/operatorCheckinReportExportHelpers';
import type { LedgerDateRange } from '@/features/operator-check-ins/utils/operatorCheckinLedgerScope';
import { downloadBlob } from '@/utils/exportUtils';
import type { Language } from '@/i18n/I18nProvider';
import { getOperatorCheckinExcelLabels } from './operatorCheckinExcelLabels';
import { registerOperatorCheckinPdfFont } from './operatorCheckinPdfFont';

export async function downloadOperatorCheckinDailyPdf(
  submissions: OperatorCheckinSubmission[],
  dateRange: LedgerDateRange,
  templateName: string,
  equipmentLabel: string,
  options: OperatorCheckinReportExportOptions = DEFAULT_COMPACT_EXPORT_OPTIONS,
  language: Language = 'en',
): Promise<void> {
  const { reportDateRangeLabel, dateRangeFilenamePart } = resolveReportDateRangeLabels(dateRange);
  const labels = getOperatorCheckinExcelLabels(language);

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const fontFamily = await registerOperatorCheckinPdfFont(doc, language);
  const margin = 48;
  let y = margin;
  const drawLine = (text: string, fontSize: number, lineHeight: number) => {
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(fontSize);
    const wrapped: string[] = doc.splitTextToSize(text, 612 - 2 * margin);
    for (const segment of wrapped) {
      if (y > 744 - lineHeight) {
        doc.addPage();
        y = margin;
      }
      doc.text(segment, margin, y);
      y += lineHeight;
    }
  };

  drawLine(labels.title, 16, 22);

  drawLine(`${labels.period}: ${reportDateRangeLabel}`, 10, 14);
  drawLine(`${labels.template}: ${templateName}`, 10, 14);
  drawLine(`${labels.equipment}: ${equipmentLabel}`, 10, 14);
  drawLine(`${labels.submissions}: ${submissions.length}`, 10, 14);

  if (options.detailLevel === 'full') {
    drawLine(labels.pdfDisclaimer, 10, 14);
    y += 14;
  } else {
    y += 8;
  }

  for (const submission of submissions) {
    const lines = buildSubmissionPdfLines(submission, options, labels);

    for (const line of lines) {
      const isHeading = line === (submission.equipment?.name ?? submission.equipment_id)
        || (options.detailLevel === 'compact' && line.includes(' — '));
      drawLine(line, isHeading && options.detailLevel === 'full' ? 12 : 10, options.detailLevel === 'compact' ? 13 : 14);
    }

    y += options.detailLevel === 'compact' ? 6 : 10;
  }

  const filename = generateReportFilename(submissions, dateRangeFilenamePart, 'pdf');
  downloadBlob(doc.output('blob'), filename);
}
