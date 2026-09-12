import React, { useState, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/hooks/useAuth';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { useTeamMutations } from '@/features/teams/hooks/useTeamManagement';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Receipt } from 'lucide-react';
import type { TeamWithMembers } from '@/features/teams/types/team';
import { useI18n } from '@/i18n';

const UNASSIGNED_VALUE = 'unassigned';
const CREATE_NEW_VALUE = '__create_new__';

export interface TeamPickerWithCreateProps {
  value: string;
  onChange: (teamId: string) => void;
  requireTeam?: boolean;
  showBillingCallout?: boolean;
  allowUnassigned?: boolean;
  onRequestUnassignedConfirm?: () => void;
  disabled?: boolean;
  id?: string;
  teamFilter?: (team: TeamWithMembers) => boolean;
}

const TeamPickerWithCreate: React.FC<TeamPickerWithCreateProps> = ({
  value,
  onChange,
  requireTeam = false,
  showBillingCallout = false,
  allowUnassigned = false,
  onRequestUnassignedConfirm,
  disabled = false,
  id = 'team-picker',
  teamFilter,
}) => {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const { teams: allTeams, isLoading } = useTeams();
  const teams = useMemo(
    () => (teamFilter ? allTeams.filter(teamFilter) : allTeams),
    [allTeams, teamFilter],
  );
  const { createTeamWithCreator } = useTeamMutations();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const selectValue = useMemo(() => {
    if (showInlineCreate) return CREATE_NEW_VALUE;
    if (!value) return allowUnassigned ? UNASSIGNED_VALUE : '';
    return value;
  }, [allowUnassigned, showInlineCreate, value]);

  const handleSelectChange = (next: string) => {
    if (next === CREATE_NEW_VALUE) {
      setShowInlineCreate(true);
      return;
    }
    setShowInlineCreate(false);
    if (next === UNASSIGNED_VALUE) {
      if (onRequestUnassignedConfirm) {
        onRequestUnassignedConfirm();
        return;
      }
      onChange('');
      return;
    }
    onChange(next);
  };

  const handleInlineCreate = async () => {
    if (!newTeamName.trim() || !currentOrganization?.id || !user?.id) {
      return;
    }

    setIsCreating(true);
    try {
      const team = await createTeamWithCreator.mutateAsync({
        teamData: {
          name: newTeamName.trim(),
          description: newTeamDescription.trim() || null,
          organization_id: currentOrganization.id,
        },
        creatorId: user.id,
      });

      queryClient.invalidateQueries({ queryKey: ['access-snapshot'] });
      queryClient.invalidateQueries({ queryKey: ['teams', currentOrganization.id] });

      onChange(team.id);
      setShowInlineCreate(false);
      setNewTeamName('');
      setNewTeamDescription('');
      toast({
        title: t('teamsCustomer.teamCreated'),
        description: t('teamsCustomer.teamCreatedDescription', { name: team.name }),
      });
    } catch (error) {
      console.error('Inline team create failed:', error);
      toast({
        title: t('teamsCustomer.createError'),
        description: t('teamsDetail.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('teamsCustomer.loadingTeams')}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="team-picker-with-create">
      {showBillingCallout && (
        <Alert>
          <Receipt className="h-4 w-4" />
          <AlertTitle>{t('teamsCustomer.billingTitle')}</AlertTitle>
          <AlertDescription>
            {t('teamsCustomer.billingDescription')}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor={id}>
          {t('teamsCustomer.assignTeam')}{requireTeam ? ' *' : ''}
        </Label>
        <Select value={selectValue} onValueChange={handleSelectChange} disabled={disabled}>
          <SelectTrigger id={id}>
            <SelectValue
              placeholder={requireTeam ? t('teamsCustomer.selectTeam') : t('teamsCustomer.selectTeamRecommended')}
            />
          </SelectTrigger>
          <SelectContent>
            {allowUnassigned && (
              <SelectItem value={UNASSIGNED_VALUE}>{t('teamsCustomer.noTeam')}</SelectItem>
            )}
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
                {team.description ? (
                  <span className="text-muted-foreground ml-2">- {team.description}</span>
                ) : null}
              </SelectItem>
            ))}
            <SelectItem value={CREATE_NEW_VALUE}>
              <span className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                {t('teamsCustomer.createNewTeam')}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showInlineCreate && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-medium">{t('teamsCustomer.createNewTeam')}</p>
          <div className="space-y-2">
            <Label htmlFor={`${id}-new-name`}>{t('teamsDetail.nameRequiredLabel')}</Label>
            <Input
              id={`${id}-new-name`}
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder={t('teamsCustomer.departmentOrCustomer')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-new-description`}>{t('teamsDetail.description')}</Label>
            <Input
              id={`${id}-new-description`}
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              placeholder={t('teamsCustomer.optional')}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleInlineCreate}
              disabled={!newTeamName.trim() || isCreating}
            >
              {isCreating ? t('teamsDetail.creating') : t('teamsCustomer.createSelect')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowInlineCreate(false);
                setNewTeamName('');
                setNewTeamDescription('');
              }}
            >
              {t('teamsDetail.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPickerWithCreate;
