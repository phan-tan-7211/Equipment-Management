import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, AlertTriangle, XCircle, Download, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { ImportDryRunResult } from '@/types/csvImport';

interface CSVPreviewStepProps {
  dryRunResult: ImportDryRunResult | null;
  onImport: () => void;
  onBack: () => void;
  importProgress: {
    processed: number;
    total: number;
    isImporting: boolean;
    completed: boolean;
    errors: Array<{ row: number; reason: string }>;
  };
  parsedData: Record<string, string>[] | null;
  onDownloadErrors: () => void;
}

export const CSVPreviewStep: React.FC<CSVPreviewStepProps> = ({ dryRunResult, onImport, onBack, importProgress, onDownloadErrors }) => {
  const { t } = useI18n();

  if (!dryRunResult) {
    return <div className="flex items-center justify-center py-8"><div className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /><span>{t('equipmentImport.validating')}</span></div></div>;
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create': return <Badge className="bg-success/20 text-success hover:bg-success/20">{t('equipmentImport.create')}</Badge>;
      case 'merge': return <Badge className="bg-info/20 text-info hover:bg-info/20">{t('equipmentImport.merge')}</Badge>;
      case 'error': return <Badge variant="destructive">{t('equipmentImport.error')}</Badge>;
      default: return <Badge variant="outline">{action}</Badge>;
    }
  };

  const progressPercentage = importProgress.total > 0 ? (importProgress.processed / importProgress.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-success" /><div><p className="text-sm font-medium">{t('equipmentImport.willCreate')}</p><p className="text-2xl font-bold">{dryRunResult.willCreate}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-info" /><div><p className="text-sm font-medium">{t('equipmentImport.willMerge')}</p><p className="text-2xl font-bold">{dryRunResult.willMerge}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><XCircle className="w-5 h-5 text-destructive" /><div><p className="text-sm font-medium">{t('equipmentImport.errors')}</p><p className="text-2xl font-bold">{dryRunResult.errorCount}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary" /><div><p className="text-sm font-medium">{t('equipmentImport.validRows')}</p><p className="text-2xl font-bold">{dryRunResult.validCount}</p></div></div></CardContent></Card>
      </div>

      {dryRunResult.warnings.length > 0 && <Alert><AlertTriangle className="w-4 h-4" /><AlertDescription><div className="space-y-1"><p className="font-medium">{t('equipmentImport.warnings')}</p>{dryRunResult.warnings.map((warning, index) => <div key={index} className="text-sm">• {warning}</div>)}</div></AlertDescription></Alert>}

      {dryRunResult.errors.length > 0 && (
        <Alert variant="destructive"><XCircle className="w-4 h-4" /><AlertDescription><div className="space-y-2"><p className="font-medium">{t('equipmentImport.rowsSkipped', { count: dryRunResult.errors.length })}</p><div className="max-h-32 overflow-y-auto text-sm space-y-1">{dryRunResult.errors.slice(0, 10).map((error, index) => <div key={index}>{t('equipmentImport.rowError', { row: error.row, reason: error.reason })}</div>)}{dryRunResult.errors.length > 10 && <div className="text-muted-foreground">{t('equipmentImport.moreErrors', { count: dryRunResult.errors.length - 10 })}</div>}</div><Button variant="outline" size="sm" onClick={onDownloadErrors} className="mt-2"><Download className="w-4 h-4 mr-2" />{t('equipmentImport.downloadErrorReport')}</Button></div></AlertDescription></Alert>
      )}

      <Card><CardHeader><CardTitle className="text-lg">{t('equipmentImport.previewFirstRows')}</CardTitle></CardHeader><CardContent><div className="border rounded-lg overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{t('equipmentImport.action')}</TableHead><TableHead>{t('equipmentImport.manufacturer')}</TableHead><TableHead>{t('equipmentImport.model')}</TableHead><TableHead>{t('equipmentImport.serial')}</TableHead><TableHead>{t('equipmentImport.lastMaintenance')}</TableHead><TableHead>{t('equipmentImport.customAttributes')}</TableHead><TableHead>{t('equipmentImport.notes')}</TableHead></TableRow></TableHeader><TableBody>{dryRunResult.sample.slice(0, 20).map((row, index) => <TableRow key={index}><TableCell>{getActionBadge(row.action)}</TableCell><TableCell>{row.manufacturer || '-'}</TableCell><TableCell>{row.model || '-'}</TableCell><TableCell>{row.serial || '-'}</TableCell><TableCell>{row.last_maintenance || '-'}</TableCell><TableCell><div className="text-xs text-muted-foreground">{t('equipmentImport.attributeCount', { count: Object.keys(row.customAttributes).length })}</div></TableCell><TableCell>{row.error && <div className="text-xs text-destructive">{row.error}</div>}{row.warning && <div className="text-xs text-warning">{row.warning}</div>}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>

      {importProgress.isImporting && <Card><CardContent className="pt-6"><div className="space-y-2"><div className="flex justify-between text-sm"><span>{t('equipmentImport.importProgress')}</span><span>{importProgress.processed.toLocaleString()} / {importProgress.total.toLocaleString()}</span></div><Progress value={progressPercentage} className="w-full" /><p className="text-xs text-muted-foreground">{t('equipmentImport.processingRecords')}</p></div></CardContent></Card>}

      <div className="flex justify-between"><Button variant="outline" onClick={onBack} disabled={importProgress.isImporting}>{t('equipmentImport.back')}</Button><Button onClick={onImport} disabled={importProgress.isImporting || dryRunResult.validCount === 0} className="bg-primary hover:bg-primary/90">{importProgress.isImporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('equipmentImport.importing')}</> : t('equipmentImport.startImport')}</Button></div>
    </div>
  );
};
