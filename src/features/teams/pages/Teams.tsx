import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Search, Settings, UserCheck, Eye, Wrench, Forklift, ClipboardList, AlertTriangle, ArrowUpDown, MoreVertical, Building2, Link2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTeams } from '@/features/teams/hooks/useTeams';
import { useTeamsListStats } from '@/features/teams/hooks/useTeamsListStats';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavigate } from 'react-router-dom';
import CreateTeamDialog from '@/features/teams/components/CreateTeamDialog';
import { useI18n } from '@/i18n';

const Teams = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const { teams = [], isLoading } = useTeams();
  const { canCreateTeam } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'members' | 'newest'>('name-asc');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const teamIds = teams.map(t => t.id);
  const { data: listStats } = useTeamsListStats(currentOrganization?.id, teamIds);

  const canCreateTeams = canCreateTeam();

  const handleTeamCardKeyDown = (event: React.KeyboardEvent<HTMLElement>, teamId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(`/dashboard/teams/${teamId}`);
    }
  };

  const filteredTeams = teams
    .filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'members':
          return b.member_count - a.member_count;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager':
        return <Settings className="h-3 w-3" />;
      case 'technician':
        return <Wrench className="h-3 w-3" />;
      case 'requestor':
        return <UserCheck className="h-3 w-3" />;
      case 'viewer':
        return <Eye className="h-3 w-3" />;
      default:
        return <UserCheck className="h-3 w-3" />;
    }
  };

  const getRoleTextColor = (role: string) => {
    switch (role) {
      case 'manager':
        return 'text-info';
      case 'technician':
        return 'text-success';
      case 'requestor':
        return 'text-warning';
      case 'viewer':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRoleLabel = (role: string) =>
    ['manager', 'technician', 'requestor', 'viewer'].includes(role)
      ? t(`teamsList.roles.${role}`)
      : role;

  if (isLoading) {
    return (
      <div data-testid="teams-loading" className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('teamsList.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('teamsList.description')}
            </p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted/80 rounded w-3/4"></div>
                <div className="h-3 bg-muted/80 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted/80 rounded"></div>
                  <div className="h-3 bg-muted/80 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('teamsList.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('teamsList.description')}
        </p>
      </div>

      {/* Search + Sort + Create toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('teamsList.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label={t('teamsList.searchAria')}
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-40 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">{t('teamsList.sortNameAsc')}</SelectItem>
            <SelectItem value="name-desc">{t('teamsList.sortNameDesc')}</SelectItem>
            <SelectItem value="members">{t('teamsList.sortMembers')}</SelectItem>
            <SelectItem value="newest">{t('teamsList.sortNewest')}</SelectItem>
          </SelectContent>
        </Select>
        {canCreateTeams && (
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            {t('teamsList.create')}
          </Button>
        )}
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            {searchTerm ? (
              <>
                <h3 className="text-lg font-semibold mb-2">{t('teamsList.noMatchTitle')}</h3>
                <p className="text-muted-foreground">
                  {t('teamsList.noMatchDescription')}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">{t('teamsList.emptyTitle')}</h3>
                <p className="text-muted-foreground mb-4">
                  {canCreateTeams
                    ? t('teamsList.emptyCanCreate')
                    : t('teamsList.emptyCannotCreate')
                  }
                </p>
                {canCreateTeams && (
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('teamsList.createFirst')}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <Card 
              key={team.id} 
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(`/dashboard/teams/${team.id}`)}
              onKeyDown={(event) => handleTeamCardKeyDown(event, team.id)}
              role="button"
              tabIndex={0}
              aria-label={t('teamsList.openDetailsFor', { name: team.name })}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-start gap-2">
                      <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors wrap-break-word flex-1 min-w-0">
                        {team.name}
                      </CardTitle>
                      {team.quickbooks_synced_at && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex shrink-0 mt-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={t('teamsList.quickBooksSynced', { date: new Date(team.quickbooks_synced_at).toLocaleDateString() })}
                              >
                                <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('teamsList.qbSynced', { date: new Date(team.quickbooks_synced_at).toLocaleDateString() })}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {team.customer_name && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                        <Building2 className="h-3 w-3 shrink-0" />
                        {team.customer_name}
                      </p>
                    )}
                    <CardDescription className="mt-1 line-clamp-2">
                      {team.description || t('teamsList.noDescription')}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">{t('teamsList.actionsFor', { name: team.name })}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/teams/${team.id}`);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {t('teamsList.viewDetails')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/equipment?team=${team.id}`);
                        }}
                      >
                        <Forklift className="h-4 w-4 mr-2" />
                        {t('teamsList.viewEquipment')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/work-orders?team=${team.id}`);
                        }}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        {t('teamsList.viewWorkOrders')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats row */}
                {(() => {
                  const stats = listStats?.[team.id];
                  return (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {team.member_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Forklift className="h-3.5 w-3.5" />
                        {stats?.equipmentCount ?? '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClipboardList className="h-3.5 w-3.5" />
                        {stats?.activeWOs ?? '—'}
                      </span>
                      {(stats?.overdueWOs ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-warning font-medium">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {t('teamsList.overdue', { count: stats!.overdueWOs })}
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Member Preview */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">{t('teamsList.members')}</h4>
                  <div className="space-y-3">
                    {team.members.slice(0, 3).map((member) => {
                      const memberName = member.profiles?.name || t('teamsList.unknownUser');
                      const memberEmail = member.profiles?.email || t('teamsList.noEmail');
                      
                      return (
                        <div key={member.id} className="flex gap-2.5">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="text-xs bg-muted">
                              {memberName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-sm font-medium leading-snug wrap-break-word">
                              {memberName}
                            </p>
                            <p
                              className={`text-xs font-medium flex items-center gap-1 capitalize ${getRoleTextColor(member.role)}`}
                            >
                              {getRoleIcon(member.role)}
                              {getRoleLabel(member.role)}
                            </p>
                            <p className="text-xs text-muted-foreground wrap-break-word">
                              {memberEmail}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {team.members.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        {t('teamsList.moreMembers', { count: team.members.length - 3 })}
                      </p>
                    )}
                    {team.members.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        {t('teamsList.noMembers')}
                      </p>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamDialog 
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        organizationId={currentOrganization?.id || ''}
      />
    </div>
  );
};

export default Teams;
