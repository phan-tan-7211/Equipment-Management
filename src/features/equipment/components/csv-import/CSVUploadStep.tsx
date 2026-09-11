import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Info } from 'lucide-react';
import { useI18n } from '@/i18n';

interface CSVUploadStepProps {
  onFileUpload: (file: File) => void;
  file: File | null;
  rowCount: number;
  delimiter: string;
}

export const CSVUploadStep: React.FC<CSVUploadStepProps> = ({
  onFileUpload,
  file,
  rowCount,
  delimiter
}) => {
  const { t } = useI18n();
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(f => f.name.toLowerCase().endsWith('.csv'));
    if (csvFile) onFileUpload(csvFile);
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) onFileUpload(selectedFile);
  }, [onFileUpload]);

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>{t('equipmentImportStep.uploadInfo')}</AlertDescription>
      </Alert>

      <Card 
        className="border-dashed border-2 p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById('csv-upload')?.click()}
      >
        <CardContent className="pt-6">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">{t('equipmentImportStep.uploadTitle')}</h3>
          <p className="text-muted-foreground mb-4">{t('equipmentImportStep.dragDrop')}</p>
          <Button variant="outline">{t('equipmentImportStep.chooseFile')}</Button>
          <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
        </CardContent>
      </Card>

      {file && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 mt-0.5 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold">{file.name}</h4>
                <div className="text-sm text-muted-foreground space-y-1 mt-1">
                  <div>{t('equipmentImportStep.size')}: {(file.size / 1024).toFixed(1)} KB</div>
                  <div>{t('equipmentImportStep.rows')}: {rowCount.toLocaleString()}</div>
                  <div>{t('equipmentImportStep.delimiter')}: "{delimiter}"</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3 text-sm text-muted-foreground">
        <h4 className="font-semibold text-foreground">{t('equipmentImportStep.requirements')}</h4>
        <ul className="space-y-1 ml-4">
          <li>• {t('equipmentImportStep.reqHeader')}</li>
          <li>• {t('equipmentImportStep.reqRows')}</li>
          <li>• {t('equipmentImportStep.reqSize')}</li>
          <li>• {t('equipmentImportStep.reqIdentity')}</li>
          <li>• {t('equipmentImportStep.reqDates')}</li>
        </ul>
      </div>
    </div>
  );
};