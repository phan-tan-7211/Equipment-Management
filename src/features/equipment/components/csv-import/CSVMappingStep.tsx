import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/i18n';
import type { ColumnMapping } from '@/types/csvImport';
import { autoMapHeaders, toSnakeCase } from '@/utils/csvImportUtils';

interface CSVMappingStepProps {
  headers: string[];
  mappings: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
  teams: Array<{ id: string; name: string }>;
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CSVMappingStep: React.FC<CSVMappingStepProps> = ({ headers, mappings, onMappingsChange, teams, selectedTeamId, onTeamChange, onNext, onBack }) => {
  const { t } = useI18n();
  const [autoMapped, setAutoMapped] = useState(false);

  useEffect(() => {
    if (headers.length > 0 && !autoMapped) {
      onMappingsChange(autoMapHeaders(headers));
      setAutoMapped(true);
    }
  }, [headers, autoMapped, onMappingsChange]);

  const updateMapping = (index: number, updates: Partial<ColumnMapping>) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], ...updates };
    if (updates.mappedTo === 'custom' && !updates.customKey) newMappings[index].customKey = toSnakeCase(newMappings[index].header);
    onMappingsChange(newMappings);
  };

  const hasRequiredMappings = () => mappings.some(m => ['manufacturer', 'model', 'serial'].includes(m.mappedTo));

  const getDuplicateWarnings = () => {
    const grouped = new Map<string, ColumnMapping[]>();
    mappings.filter(m => m.isDuplicate).forEach(mapping => {
      const key = mapping.mappedTo === 'custom' ? mapping.customKey : mapping.mappedTo;
      const normalized = key || '';
      grouped.set(normalized, [...(grouped.get(normalized) ?? []), mapping]);
    });
    return Array.from(grouped.entries()).filter(([, entries]) => entries.length > 1);
  };

  const duplicateWarnings = getDuplicateWarnings();

  return (
    <div className="space-y-6">
      <Alert><Info className="w-4 h-4" /><AlertDescription>{t('equipmentImport.mappingInfo')}</AlertDescription></Alert>

      <Card><CardHeader><CardTitle className="text-lg">{t('equipmentImport.teamAssignment')}</CardTitle></CardHeader><CardContent><div className="space-y-2"><label htmlFor="csv-team-select" className="text-sm font-medium">{t('equipmentImport.assignNewToTeam')}</label><Select value={selectedTeamId || 'none'} onValueChange={(value) => onTeamChange(value === 'none' ? null : value)}><SelectTrigger id="csv-team-select"><SelectValue placeholder={t('equipmentImport.selectTeam')} /></SelectTrigger><SelectContent><SelectItem value="none">{t('equipmentImport.noTeamAssignment')}</SelectItem>{teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">{t('equipmentImport.teamAssignmentHint')}</p></div></CardContent></Card>

      <Card><CardHeader><CardTitle className="text-lg">{t('equipmentImport.columnMapping')}</CardTitle></CardHeader><CardContent><div className="space-y-4">{mappings.map((mapping, index) => (
        <div key={index} className="flex flex-col gap-3 p-3 border rounded-lg sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-medium truncate">{mapping.header}</span>{mapping.isDuplicate && <TooltipProvider><Tooltip><TooltipTrigger><Badge variant="outline" className="text-xs">{t('equipmentImport.duplicate')}</Badge></TooltipTrigger><TooltipContent><p>{t('equipmentImport.duplicateTooltip')}</p></TooltipContent></Tooltip></TooltipProvider>}</div></div>
          <div className="flex items-center gap-2"><Select value={mapping.mappedTo} onValueChange={(value) => updateMapping(index, { mappedTo: value as ColumnMapping['mappedTo'], customKey: value === 'custom' ? toSnakeCase(mapping.header) : undefined })}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="name">{t('equipmentImport.name')}</SelectItem><SelectItem value="manufacturer">{t('equipmentImport.manufacturer')}</SelectItem><SelectItem value="model">{t('equipmentImport.model')}</SelectItem><SelectItem value="serial">{t('equipmentImport.serialNumber')}</SelectItem><SelectItem value="location">{t('equipmentImport.location')}</SelectItem><SelectItem value="last_maintenance">{t('equipmentImport.lastMaintenance')}</SelectItem><SelectItem value="custom">{t('equipmentImport.customAttribute')}</SelectItem><SelectItem value="skip">{t('equipmentImport.skipColumn')}</SelectItem></SelectContent></Select>{mapping.mappedTo === 'custom' && <div className="text-sm text-muted-foreground">→ {mapping.customKey}</div>}</div>
        </div>
      ))}</div></CardContent></Card>

      {duplicateWarnings.length > 0 && <Alert><AlertTriangle className="w-4 h-4" /><AlertDescription><div className="space-y-2"><p className="font-medium">{t('equipmentImport.duplicateMappings')}</p>{duplicateWarnings.map(([key, entries]) => <div key={key} className="text-sm">• <strong>{key}</strong>: {entries.map(m => m.header).join(', ')}<br /><span className="text-muted-foreground ml-2">{t('equipmentImport.duplicateValueHint')}</span></div>)}</div></AlertDescription></Alert>}

      <div className="flex justify-between"><Button variant="outline" onClick={onBack}>{t('equipmentImport.back')}</Button><Button onClick={onNext} disabled={!hasRequiredMappings()}>{t('equipmentImport.previewImportButton')}</Button></div>
    </div>
  );
};
