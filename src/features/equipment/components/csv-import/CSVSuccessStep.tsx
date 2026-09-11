import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, X } from 'lucide-react';
import { useI18n } from '@/i18n';

interface CSVSuccessStepProps {
  importProgress: {
    processed: number;
    total: number;
    isImporting: boolean;
    completed: boolean;
    errors: Array<{ row: number; reason: string }>;
  };
  organizationName: string;
  importId: string;
  selectedTeamId: string | null;
  onClose: () => void;
  onDownloadErrors: () => void;
}

export const CSVSuccessStep: React.FC<CSVSuccessStepProps> = ({ importProgress, organizationName, importId, selectedTeamId, onClose, onDownloadErrors }) => {
  const { t } = useI18n();
  const successCount = importProgress.processed - importProgress.errors.length;
  const hasErrors = importProgress.errors.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="flex justify-center"><CheckCircle className="w-16 h-16 text-success" /></div>
        <div><h3 className="text-xl font-semibold text-success">{t('equipmentImport.completeTitle')}</h3><p className="text-sm text-muted-foreground mt-1">{t('equipmentImport.completeDescription', { organization: organizationName })}</p></div>
      </div>

      <div className="bg-muted rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="font-medium text-success">{t('equipmentImport.successfullyProcessed')}</span><div className="text-lg font-bold text-success">{successCount}</div></div>
          {hasErrors && <div><span className="font-medium text-destructive">{t('equipmentImport.failed')}</span><div className="text-lg font-bold text-destructive">{importProgress.errors.length}</div></div>}
        </div>
        <div className="text-xs text-muted-foreground"><div>{t('equipmentImport.importId', { id: importId })}</div>{selectedTeamId && <div>{t('equipmentImport.assignedTeam')}</div>}</div>
      </div>

      {hasErrors && <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4"><div className="flex items-start justify-between gap-4"><div className="flex-1"><h4 className="font-medium text-destructive mb-2">{t('equipmentImport.someFailed')}</h4><p className="text-sm text-destructive">{t('equipmentImport.someFailedDescription', { count: importProgress.errors.length })}</p></div><Button variant="outline" size="sm" onClick={onDownloadErrors} className="flex items-center gap-2"><Download className="w-4 h-4" />{t('equipmentImport.downloadErrors')}</Button></div></div>}

      <div className="flex justify-center pt-4"><Button onClick={onClose} className="flex items-center gap-2"><X className="w-4 h-4" />{t('equipmentImport.close')}</Button></div>
    </div>
  );
};
