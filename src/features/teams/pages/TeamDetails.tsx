import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, ChevronRight, Handshake, Settings, Users, Trash2, Plus, Edit, Forklift, ClipboardList, MoreVertical } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useTeam, useTeamMutations } from '@/features/teams/hooks/useTeamManagement';
import { usePermissions } from '@/hooks/usePermissions';
import { useTeamStats } from '@/features/teams/hooks/useTeamStats';
import { useToast } from '@/hooks/use-toast';
import TeamMembersList from '@/features/teams/components/TeamMembersList';
import TeamMetadataEditor from '@/features/teams/components/TeamMetadataEditor';
import AddTeamMemberDialog from '@/features/teams/components/AddTeamMemberDialog';
import { QuickBooksCustomerMapping } from '@/features/teams/components/QuickBooksCustomerMapping';
import TeamActivitySummary from '@/features/teams/components/TeamActivitySummary';
import DeleteTeamDialog from '@/features/teams/components/DeleteTeamDialog';
import TeamRecentEquipment from '@/features/teams/components/TeamRecentEquipment';
import TeamRecentWorkOrders from '@/features/teams/components/TeamRecentWorkOrders';
import TeamLocationCard from '@/features/teams/components/TeamLocationCard';
import { TeamPMScheduleCard } from '@/features/teams/components/TeamPMScheduleCard';
import CustomerAccountCard from '@/features/teams/components/CustomerAccountCard';
import TeamExternalContactsSection from '@/features/teams/components/TeamExternalContactsSection';
import { TeamViewSwitcher } from '@/features/teams/components/TeamViewSwitcher';
import { updateTeam } from '@/features/teams/services/teamService';
import { isTeamView, type TeamView } from '@/features/teams/types/team';
import { useI18n } from '@/i18n';

/** Section ordering per dedicated team view (issue #1132). */
const VIEW_SECTION_ORDER: Record<TeamView, string[]> = {
  internal: [
    'info',
    'members',
    'activity',
    'recent-work-orders',
    'recent-equipment',
    'location',
    'pm-schedule',
    'customer-account',
    'external-contacts',
  ],
  department: [
    'info',
    'activity',
    'pm-schedule',
    'recent-equipment',
    'recent-work-orders',
    'location',
    'members',
    'customer-account',
    'external-contacts',
  ],
  customer: [
    'customer-account',
    'external-contacts',
    'activity',
    'recent-work-orders',
    'recent-equipment',
    'info',
    'location',
    'members',
    'pm-schedule',
  ],
};

const TeamDetails = () => {
  const { t } = useI18n();
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentOrganization, isLoading } = useOrganization();
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Session-local view override; the team's preferred_view is the default.
  const [viewOverride, setViewOverride] = useState<TeamView | null>(null);

  // Use team hook for data
  const { data: team, isLoading: teamLoading } = useTeam(teamId);
  const { deleteTeam } = useTeamMutations();
  const permissions = usePermissions();

  const setPreferredView = useMutation({
    mutationFn: (view: TeamView) => {
      if (!teamId || !currentOrganization?.id) {
        throw new Error(t('teamsDetail.updateDenied'));
      }
      return updateTeam(teamId, { preferred_view: view }, currentOrganization.id);
    },
    onSuccess: async (_, view) => {
      await queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: t('teamsDetail.defaultSaved'),
        description: t('teamsDetail.defaultSavedDescription', { view: t(`teamsDetail.views.${view}`) }),
      });
    },
    onError: (error) => {
      toast({
        title: t('teamsDetail.defaultSaveError'),
        description: error instanceof Error ? error.message : t('teamsDetail.tryAgain'),
        variant: 'destructive',
      });
    },
  });

  // Fetch team statistics (equipment, work orders, recent items)
  const {
    equipmentStats,
    workOrderStats,
    recentEquipment,
    recentWorkOrders,
    isLoadingEquipmentStats,
    isLoadingWorkOrderStats,
    isLoadingRecentEquipment,
    isLoadingRecentWorkOrders,
  } = useTeamStats(teamId, currentOrganization?.id);

  if (isLoading || teamLoading || !currentOrganization || !teamId) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="h-48 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!team || team.organization_id !== currentOrganization.id) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/teams')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('teamsDetail.back')}
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">{t('teamsDetail.notFound')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('teamsDetail.notFoundDescription')}
            </p>
            <Button onClick={() => navigate('/dashboard/teams')}>
              {t('teamsDetail.return')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Permissions
  const canEdit = permissions.canManageTeam(team.id);
  const canDelete = permissions.canManageTeam(team.id);
  const canManageMembers = permissions.canManageTeam(team.id);
  // Team managers may CRUD manual external contacts via 20260707125008 RPCs + manager RLS
  // (20260707160000 supersedes admin-only policies from 20260406000003).
  const canManageExternalContacts =
    canEdit && team.organization_id === currentOrganization.id;

  const preferredView: TeamView = isTeamView(team.preferred_view) ? team.preferred_view : 'internal';
  const activeView = viewOverride ?? preferredView;

  const handleDeleteTeam = async () => {
    if (!team) return;
    try {
      await deleteTeam.mutateAsync({
        teamId: team.id,
        organizationId: currentOrganization.id,
      });
      navigate('/dashboard/teams');
    } catch {
      // Error is handled by the mutation
    }
  };

  const renderTeamInfoSection = () => (
    <Card className="shadow-elevation-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('teamsDetail.information')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-sm font-medium text-muted-foreground">{t('teamsDetail.description')}</span>
          <p className="text-sm">{team.description || t('teamsList.noDescription')}</p>
        </div>

        {/* Stats grid - responsive: 2 cols on mobile, 3 on tablet, 5 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-3 rounded-lg bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('teamsDetail.members')}</span>
            <p className="text-xl sm:text-2xl font-bold text-primary mt-1">{team.members.length}</p>
          </div>
          <Link 
            to={`/dashboard/equipment?team=${team.id}`}
            className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group relative"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1 group-hover:text-primary transition-colors">
              <Forklift className="h-3 w-3" />
              {t('teamsDetail.equipment')}
            </span>
            {isLoadingEquipmentStats ? (
              <Skeleton className="h-7 w-10 mt-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-primary mt-1">{equipmentStats?.totalEquipment ?? 0}</p>
            )}
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link 
            to={`/dashboard/work-orders?team=${team.id}`}
            className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group relative"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1 group-hover:text-primary transition-colors">
              <ClipboardList className="h-3 w-3" />
              {t('teamsDetail.activeWos')}
            </span>
            {isLoadingWorkOrderStats ? (
              <Skeleton className="h-7 w-10 mt-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-primary mt-1">{workOrderStats?.activeWorkOrders ?? 0}</p>
            )}
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <div className="p-3 rounded-lg bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('teamsDetail.created')}</span>
            <p className="text-sm text-foreground mt-1">
              {new Date(team.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('teamsDetail.status')}</span>
            <Badge className="bg-success/20 text-success border-success/30 mt-1">
              {t('teamsDetail.active')}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderMembersSection = () => (
    <Card className="shadow-elevation-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('teamsDetail.teamMembers')}
            </CardTitle>
            <CardDescription>
              {t('teamsDetail.manageMembers')}
            </CardDescription>
          </div>
          {canManageMembers && (
            <Button
              size="sm"
              onClick={() => setShowAddMemberDialog(true)}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {t('teamsDetail.addMember')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TeamMembersList team={team} />
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header */}
      <header className="space-y-4">
        {/* Breadcrumbs + Actions */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground" aria-label={t('teamsDetail.breadcrumb')}>
            <Link
              to="/dashboard/teams"
              className="hover:text-foreground hover:underline underline-offset-4 decoration-muted-foreground/40 transition-colors"
            >
              {t('teamsList.title')}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />
            <span className="text-foreground font-medium truncate max-w-[20ch] sm:max-w-none" aria-current="page" title={team.name}>
              {team.name}
            </span>
          </nav>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMetadataEditor(true)}
                className="gap-1.5"
                aria-label={t('teamsDetail.edit')}
              >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">{t('teamsDetail.edit')}</span>
              </Button>
            )}
            {canDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">{t('teamsDetail.moreActions')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('teamsDetail.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Team title - centered on mobile, left-aligned on desktop */}
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-3 mb-1">
            {team.image_url ? (
              <img
                src={team.image_url}
                alt={team.name}
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-cover"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="p-2 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
            )}
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {team.name}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(team.member_count === 1 ? 'teamsDetail.memberCountSingle' : 'teamsDetail.memberCount', { count: team.member_count })}
          </p>
        </div>
      </header>

      {/* Dedicated team views (issue #1132) */}
      <TeamViewSwitcher
        activeView={activeView}
        preferredView={preferredView}
        canSetPreferred={canEdit}
        isSavingPreferred={setPreferredView.isPending}
        onViewChange={setViewOverride}
        onSetPreferred={(view) => setPreferredView.mutate(view)}
      />

      {VIEW_SECTION_ORDER[activeView].map((sectionKey) => {
        switch (sectionKey) {
          case 'info':
            return (
              <React.Fragment key={sectionKey}>{renderTeamInfoSection()}</React.Fragment>
            );
          case 'location':
            return <TeamLocationCard key={sectionKey} team={team} canEdit={canEdit} />;
          case 'pm-schedule':
            return (
              <TeamPMScheduleCard
                key={sectionKey}
                organizationId={currentOrganization.id}
                teamId={team.id}
              />
            );
          case 'activity':
            return (
              <TeamActivitySummary
                key={sectionKey}
                teamId={team.id}
                equipmentStats={equipmentStats}
                workOrderStats={workOrderStats}
                isLoading={isLoadingEquipmentStats || isLoadingWorkOrderStats}
              />
            );
          case 'recent-equipment':
            return (
              <TeamRecentEquipment
                key={sectionKey}
                teamId={team.id}
                equipment={recentEquipment}
                isLoading={isLoadingRecentEquipment}
              />
            );
          case 'recent-work-orders':
            return (
              <TeamRecentWorkOrders
                key={sectionKey}
                teamId={team.id}
                workOrders={recentWorkOrders}
                isLoading={isLoadingRecentWorkOrders}
              />
            );
          case 'customer-account':
            if (team.customer_id) {
              return (
                <CustomerAccountCard
                  key={sectionKey}
                  customerId={team.customer_id}
                  teamId={team.id}
                  teamName={team.name}
                />
              );
            }
            if (activeView === 'customer') {
              return (
                <Card key={sectionKey} className="shadow-elevation-2">
                  <CardContent className="py-8 text-center space-y-4">
                    <Handshake className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <div>
                      <h3 className="mb-1 text-base font-semibold">{t('teamsDetail.noCustomer')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('teamsDetail.noCustomerDescription')}
                      </p>
                    </div>
                    <QuickBooksCustomerMapping
                      embedded
                      teamId={team.id}
                      teamName={team.name}
                      customerId={null}
                    />
                  </CardContent>
                </Card>
              );
            }
            return (
              <QuickBooksCustomerMapping
                key={sectionKey}
                teamId={team.id}
                teamName={team.name}
                customerId={null}
              />
            );
          case 'external-contacts':
            return (
              <TeamExternalContactsSection
                key={sectionKey}
                team={team}
                canManage={canManageExternalContacts}
              />
            );
          case 'members':
            return (
              <React.Fragment key={sectionKey}>{renderMembersSection()}</React.Fragment>
            );
          default:
            return null;
        }
      })}

      {/* Dialogs */}
      <TeamMetadataEditor
        open={showMetadataEditor}
        onClose={() => setShowMetadataEditor(false)}
        team={team}
      />

      <AddTeamMemberDialog
        open={showAddMemberDialog}
        onClose={() => setShowAddMemberDialog(false)}
        team={team}
      />

      <DeleteTeamDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        teamName={team.name}
        isPending={deleteTeam.isPending}
        onConfirm={handleDeleteTeam}
      />
    </div>
  );
};

export default TeamDetails;
