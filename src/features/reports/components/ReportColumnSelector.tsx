import React, { useMemo } from 'react';
import { ExportCollapsibleCheckboxPicker } from '@/components/common/ExportCollapsibleCheckboxPicker';
import { getColumnsForReportType } from '@/features/reports/constants/reportColumns';
import type { ReportType } from '@/features/reports/types/reports';
import { useI18n } from '@/i18n';

interface ReportColumnSelectorProps {
  reportType: ReportType;
  selectedColumns: string[];
  onChange: (columns: string[]) => void;
  className?: string;
}

/**
 * Collapsible column picker for CSV export cards on the Reports page.
 * Collapsed by default; default columns selected on first load.
 */
export const ReportColumnSelector: React.FC<ReportColumnSelectorProps> = ({
  reportType,
  selectedColumns,
  onChange,
  className,
}) => {
  const { t } = useI18n();
  const items = useMemo(
    () =>
      getColumnsForReportType(reportType).map((column) => ({
        key: column.key,
        label: t(`reports.columns.${reportType === 'operator-check-ins' && column.key === 'serial_number' ? 'unitNumber' : column.key}`),
      })),
    [reportType, t],
  );

  return (
    <ExportCollapsibleCheckboxPicker
      title={t('reports.fieldsToExport')}
      items={items}
      selectedKeys={selectedColumns}
      onChange={onChange}
      noneSelectedMessage={t('reports.selectField')}
      idPrefix={`column-${reportType}`}
      className={className}
    />
  );
};
