import type { ReactNode } from 'react';
import { useI18n } from '@/i18n/I18nProvider';

export interface PrivacyDataCategoryRow {
  category: string;
  dataPoints: ReactNode;
}

interface PrivacyDataCategoryTableProps {
  rows: PrivacyDataCategoryRow[];
}

/** Two-column Category / Data Points table used in Privacy Policy Sections 2 and 3. */
export function PrivacyDataCategoryTable({ rows }: PrivacyDataCategoryTableProps) {
  const { t } = useI18n();

  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            <th className="whitespace-nowrap">{t('publicLegal.privacy.category')}</th>
            <th>{t('publicLegal.privacy.dataPoints')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category}>
              <td className="whitespace-nowrap font-medium">{row.category}</td>
              <td>{row.dataPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
