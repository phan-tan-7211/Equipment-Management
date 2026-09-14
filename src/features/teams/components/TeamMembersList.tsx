
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, User, Settings, Trash2 } from 'lucide-react';
import { TeamWithMembers } from '@/features/teams/services/teamService';
import { usePermissions } from '@/hooks/usePermissions';
import { useTeamMembers } from '@/features/teams/hooks/useTeamManagement';
import { useOrganization } from '@/contexts/OrganizationContext';
import { logger } from '@/utils/logger';
import RoleChangeDialog from './RoleChangeDialog';

import { useI18n } from '@/i18n';

interface TeamMembersListProps {
  team: TeamWithMembers;
}

type TeamMemberWithProfile = TeamWithMembers['members'][number];

const TeamMembersList: React.FC<TeamMembersListProps> = ({ team }) => {
  const { t } = useI18n();
  const { currentOrganization } = useOrganization();
  const { removeMember } = useTeamMembers(team.id, currentOrganization?.id);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithProfile | null>(null);
  const [memberPendingRemoval, setMemberPendingRemoval] = useState<TeamMemberWithProfile | null>(null);
  const { canManageTeam } = usePermissions();
  
  const canManage = canManageTeam(team.id);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager':
        return <Users className="h-4 w-4 text-info" />;
      case 'technician':
        return <User className="h-4 w-4 text-success" />;
      case 'requestor':
        return <User className="h-4 w-4 text-warning" />;
      case 'viewer':
        return <User className="h-4 w-4 text-muted-foreground" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-info/20 text-info border-info/30';
      case 'technician':
        return 'bg-success/20 text-success border-success/30';
      case 'requestor':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'viewer':
        return 'bg-muted text-foreground border-border';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  const handleChangeRole = (member: TeamMemberWithProfile) => {
    setSelectedMember(member);
    setShowRoleDialog(true);
  };

  const handleRequestRemoveMember = (member: TeamMemberWithProfile) => {
    setMemberPendingRemoval(member);
  };

  const handleRemoveDialogOpenChange = (open: boolean) => {
    if (!open) {
      setMemberPendingRemoval(null);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberPendingRemoval) return;

    try {
      await removeMember.mutateAsync({
        teamId: team.id,
        userId: memberPendingRemoval.user_id
      });
      setMemberPendingRemoval(null);
    } catch (error) {
      logger.error('Failed to remove member from team', error);
    }
  };

  // Ensure members array exists and has the expected structure
  const members = team.members || [];
  const pendingRemovalName = memberPendingRemoval?.profiles?.name || t('teamsDetail.thisMember');

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('teamsDetail.member')}</TableHead>
            <TableHead>{t('teamsDetail.role')}</TableHead>
            <TableHead>{t('teamsDetail.email')}</TableHead>
            {canManage && <TableHead className="text-right">{t('teamsDetail.actions')}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                   <Avatar className="h-8 w-8">
                     {(member.profiles as { avatar_url?: string | null })?.avatar_url && (
                       <AvatarImage src={(member.profiles as { avatar_url?: string | null }).avatar_url!} alt={member.profiles?.name || t('teamsDetail.user')} />
                     )}
                     <AvatarFallback className="text-sm">
                       {(member.profiles?.name || 'U').split(' ').map(n => n[0]).join('')}
                     </AvatarFallback>
                   </Avatar>
                   <div>
                     <p className="font-medium">{member.profiles?.name || t('teamsDetail.unknown')}</p>
                   </div>
                </div>
              </TableCell>
              <TableCell>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => handleChangeRole(member)}
                    className="inline-flex"
                    title={t('teamsDetail.clickRole')}
                    aria-label={t('teamsDetail.changeRoleFor', { name: member.profiles?.name || t('teamsDetail.thisMember') })}
                  >
                    <Badge className={`${getRoleColor(member.role)} cursor-pointer hover:opacity-80 transition-opacity`} variant="outline">
                      <div className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        {t(`teamsDetail.roles.${member.role}`)}
                      </div>
                    </Badge>
                  </button>
                ) : (
                  <Badge className={getRoleColor(member.role)} variant="outline">
                    <div className="flex items-center gap-1">
                      {getRoleIcon(member.role)}
                      {t(`teamsDetail.roles.${member.role}`)}
                    </div>
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">{member.profiles?.email || t('teamsDetail.noEmail')}</span>
              </TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={t('teamsDetail.actionsFor', { name: member.profiles?.name || t('teamsDetail.thisMember') })}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleChangeRole(member)}
                        className="flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" />
                        {t('teamsDetail.changeRole')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => handleRequestRemoveMember(member)}
                        className="flex items-center gap-2 text-destructive"
                        disabled={removeMember.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        {removeMember.isPending ? t('teamsDetail.removing') : t('teamsDetail.removeFromTeam')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {members.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('teamsDetail.noMembers')}</h3>
          <p className="text-muted-foreground">
            {t('teamsDetail.noMembersDescription')}
          </p>
        </div>
      )}

      <RoleChangeDialog
        open={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        member={selectedMember}
        team={team}
      />

      <AlertDialog
        open={memberPendingRemoval !== null}
        onOpenChange={handleRemoveDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('teamsDetail.removeQuestion')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {t('teamsDetail.removeDescription', { member: pendingRemovalName, team: team.name })}
                </p>
                <p>
                  {t('teamsDetail.removeNotice')}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMember.isPending}>
              {t('teamsDetail.cancel')}
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={removeMember.isPending}
              onClick={handleConfirmRemoveMember}
            >
              {removeMember.isPending ? t('teamsDetail.removing') : t('teamsDetail.removeFromTeam')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamMembersList;

