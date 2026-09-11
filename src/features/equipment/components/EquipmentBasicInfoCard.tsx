import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calendar, Clock, ChevronDown, FileText, Users } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import InlineEditField from './InlineEditField';
import { EquipmentIdentityFields } from './EquipmentIdentityFields';
import { getStatusColor } from '@/features/equipment/utils/equipmentHelpers';
import { mobileInlineEditIconRowClassName } from './inlineEditStyles';
import { useI18n } from '@/i18n';

type Equipment = Tables<'equipment'>;
type EquipmentWithManagementCode = Equipment & { management_code?: string | null };

function EquipmentDescriptionField({
  descriptionFieldId,
  value,
  canEdit,
  onSave,
}: {
  descriptionFieldId: string;
  value: string;
  canEdit: boolean;
  onSave: (value: string) => void | Promise<void>;
}) {
  const { t } = useI18n();
  return (
    <div>
      <label htmlFor={descriptionFieldId} className="text-sm font-medium text-muted-foreground">
        {t('equipmentDetails.description')}
      </label>
      <div className="mt-1 w-full">
        <InlineEditField
          value={value}
          onSave={onSave}
          canEdit={canEdit}
          fieldId={descriptionFieldId}
          type="textarea"
          placeholder={t('equipmentDetails.descriptionPlaceholder')}
          className="w-full text-base"
          editAriaLabel={t('equipmentDetails.editDescription')}
        />
      </div>
    </div>
  );
}

export type EquipmentBasicInfoCardProps = {
  equipment: Equipment;
  canEdit: boolean;
  canAssignTeams: boolean;
  isMobile: boolean;
  showAllBasicInfo: boolean;
  onShowAllBasicInfoChange: (open: boolean) => void;
  onShowWorkingHoursModal: () => void;
  nameFieldId: string;
  statusFieldId: string;
  manufacturerFieldId: string;
  modelFieldId: string;
  serialNumberFieldId: string;
  assignedTeamFieldId: string;
  descriptionFieldId: string;
  teamOptions: { value: string; label: string }[];
  lastMaintenanceLink: string | null;
  lastMaintenanceDisplay: string;
  onFieldUpdate: (field: keyof Equipment, value: string) => void | Promise<void>;
  onTeamAssignment: (value: string) => void | Promise<void>;
  getCurrentTeamDisplay: () => string;
};

export function EquipmentBasicInfoCard({
  equipment,
  canEdit,
  canAssignTeams,
  isMobile,
  showAllBasicInfo,
  onShowAllBasicInfoChange,
  onShowWorkingHoursModal,
  nameFieldId,
  statusFieldId,
  manufacturerFieldId,
  modelFieldId,
  serialNumberFieldId,
  assignedTeamFieldId,
  descriptionFieldId,
  teamOptions,
  lastMaintenanceLink,
  lastMaintenanceDisplay,
  onFieldUpdate,
  onTeamAssignment,
  getCurrentTeamDisplay,
}: EquipmentBasicInfoCardProps) {
  const { t } = useI18n();
  const managementCode = (equipment as EquipmentWithManagementCode).management_code ?? null;
  const statusOptions = [
    { value: 'active', label: t('equipmentDetails.active') },
    { value: 'maintenance', label: t('equipmentDetails.maintenance') },
    { value: 'inactive', label: t('equipmentDetails.inactive') },
  ];
  const currentStatusLabel = statusOptions.find((option) => option.value === (equipment.status || 'active'))?.label ?? t('equipmentDetails.active');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('equipmentDetails.basicInformation')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor={nameFieldId} className="text-sm font-medium text-muted-foreground">{t('equipmentDetails.name')}</label>
            <div className="mt-1 w-full">
              <InlineEditField
                value={equipment.name || ''}
                onSave={(value) => onFieldUpdate('name', value)}
                canEdit={canEdit}
                fieldId={nameFieldId}
                placeholder={t('equipmentDetails.namePlaceholder')}
                className="w-full text-base"
                editAriaLabel={t('equipmentDetails.editName')}
              />
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-muted-foreground">Management Code</span>
            <div className="mt-1 min-h-9 rounded-md border bg-muted/30 px-3 py-2 font-mono text-sm font-semibold text-foreground">
              {managementCode || '—'}
            </div>
          </div>

          <div>
            <label htmlFor={statusFieldId} className="text-sm font-medium text-muted-foreground">{t('equipmentDetails.status')}</label>
            <div className="mt-1 w-full">
              {canEdit ? (
                <InlineEditField
                  value={equipment.status || 'active'}
                  onSave={(value) => onFieldUpdate('status', value)}
                  canEdit={canEdit}
                  fieldId={statusFieldId}
                  type="select"
                  selectOptions={statusOptions}
                  className="w-full text-base"
                  editAriaLabel={t('equipmentDetails.editStatus')}
                />
              ) : (
                <Badge className={`${getStatusColor(equipment.status || 'active')} rounded-full px-2 py-0.5 text-xs`} variant="outline">
                  {currentStatusLabel}
                </Badge>
              )}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-muted-foreground">{t('equipmentDetails.workingHours')}</span>
            <div className="mt-1 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowWorkingHoursModal}
                className="min-h-11 justify-start px-2 text-left text-base font-normal hover:underline"
              >
                {t('equipmentDetails.hoursValue', { count: equipment.working_hours ?? 0 })}
              </Button>
            </div>
          </div>

          <div>
            <label htmlFor={assignedTeamFieldId} className="text-sm font-medium text-muted-foreground">{t('equipmentDetails.assignedTeam')}</label>
            <div className={mobileInlineEditIconRowClassName}>
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
              {canAssignTeams ? (
                <InlineEditField
                  value={equipment.team_id || 'unassigned'}
                  onSave={onTeamAssignment}
                  canEdit={canAssignTeams}
                  fieldId={assignedTeamFieldId}
                  type="select"
                  selectOptions={teamOptions}
                  placeholder={t('equipmentDetails.selectTeam')}
                  className="min-w-0 flex-1 text-base"
                  editAriaLabel={t('equipmentDetails.editAssignedTeam')}
                />
              ) : (
                <span className="min-w-0 flex-1 text-base text-foreground">
                  {getCurrentTeamDisplay()}
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-muted-foreground">{t('equipmentDetails.lastMaintenance')}</span>
            <div className="mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {lastMaintenanceLink ? (
                <Link to={lastMaintenanceLink} className="text-base text-primary hover:underline">
                  {lastMaintenanceDisplay}
                </Link>
              ) : (
                <span className="text-base">{lastMaintenanceDisplay}</span>
              )}
            </div>
          </div>

          <EquipmentIdentityFields
            equipment={equipment}
            canEdit={canEdit}
            manufacturerFieldId={manufacturerFieldId}
            modelFieldId={modelFieldId}
            serialNumberFieldId={serialNumberFieldId}
            onFieldUpdate={onFieldUpdate}
          />
        </div>

        {!isMobile && (
          <EquipmentDescriptionField
            descriptionFieldId={descriptionFieldId}
            value={equipment.notes || ''}
            canEdit={canEdit}
            onSave={(value) => onFieldUpdate('notes', value)}
          />
        )}

        {isMobile && (
          <Collapsible open={showAllBasicInfo} onOpenChange={onShowAllBasicInfoChange}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-center gap-1.5 text-muted-foreground">
                <ChevronDown className={`h-4 w-4 transition-transform ${showAllBasicInfo ? 'rotate-180' : ''}`} />
                {showAllBasicInfo ? t('equipmentDetails.hideDescription') : t('equipmentDetails.showDescription')}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-4 border-t mt-2">
                <EquipmentDescriptionField
                  descriptionFieldId={descriptionFieldId}
                  value={equipment.notes || ''}
                  canEdit={canEdit}
                  onSave={(value) => onFieldUpdate('notes', value)}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
