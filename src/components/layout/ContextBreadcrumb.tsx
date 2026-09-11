import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import OrganizationSwitcher from '@/features/organization/components/OrganizationSwitcher';
import MobileWorkspaceSwitcher from '@/components/layout/MobileWorkspaceSwitcher';
import WorkspaceAvatar from '@/components/layout/WorkspaceAvatar';
import CreateTeamDialog from '@/features/teams/components/CreateTeamDialog';
import { useTeam } from '@/features/teams/hooks/useTeam';
import { useSelectedTeam } from '@/hooks/useSelectedTeam';
import { useSelectedTeamImageUrl } from '@/hooks/useSelectedTeamImageUrl';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOrganization } from '@/contexts/OrganizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { UNASSIGNED_TEAM_ID } from '@/contexts/selected-team-context';
import { getPageLabelKey, shouldSuppressLabelOnMobile } from './topBarRouteLabels';
import { useI18n } from '@/i18n';

/** Persistent global context breadcrumb rendered in the TopBar left slot. */
const ContextBreadcrumb: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { t } = useI18n();
  const { teamMemberships } = useTeam();
  const { selectedTeamId, selectedTeam, setSelectedTeamId } = useSelectedTeam();
  const { data: selectedTeamImageUrl } = useSelectedTeamImageUrl(selectedTeamId);
  const { currentOrganization } = useOrganization();
  const { canCreateTeam } = usePermissions();
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);

  const sectionLabelKey = getPageLabelKey(location.pathname);
  const sectionLabel = sectionLabelKey ? t(sectionLabelKey) : '';
  const suppressSectionOnMobile =
    isMobile && shouldSuppressLabelOnMobile(location.pathname);

  const canCreateTeams = canCreateTeam();
  const showTeamSegment = teamMemberships.length > 0 || canCreateTeams;
  const teamLabel =
    selectedTeam?.team_name ??
    (selectedTeamId === UNASSIGNED_TEAM_ID ? t('breadcrumb.unassigned') : t('breadcrumb.allTeams'));

  if (isMobile) {
    return (
      <>
        <MobileWorkspaceSwitcher
          showTeamSegment={showTeamSegment}
          teamLabel={teamLabel}
          onRequestCreateTeam={() => setShowCreateTeamDialog(true)}
        />
        {showCreateTeamDialog && currentOrganization?.id && (
          <CreateTeamDialog
            open={showCreateTeamDialog}
            onClose={() => setShowCreateTeamDialog(false)}
            organizationId={currentOrganization.id}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Breadcrumb className="w-full min-w-0 sm:w-auto">
        <BreadcrumbList className="w-full flex-nowrap items-center justify-center gap-1 sm:w-auto sm:justify-start sm:gap-1.5">
          <BreadcrumbItem className="min-w-0 flex-1 sm:flex-initial flex justify-end sm:justify-start text-foreground">
            <OrganizationSwitcher variant="topbar" />
          </BreadcrumbItem>

          {showTeamSegment && (
            <>
              <BreadcrumbSeparator className="inline-flex shrink-0 items-center px-0.5 text-muted-foreground/70 sm:hidden">
                <span aria-hidden="true" className="text-sm leading-none">·</span>
              </BreadcrumbSeparator>
              <BreadcrumbSeparator className="hidden sm:inline-flex" />
              <BreadcrumbItem className="min-w-0 flex-1 sm:flex-initial flex justify-start">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={t('breadcrumb.switchTeamCurrent', { name: teamLabel })}
                      className="inline-flex max-w-full items-center justify-center gap-1.5 h-8 px-2 sm:max-w-40 text-muted-foreground hover:text-foreground sm:justify-start"
                    >
                      <WorkspaceAvatar kind="team" src={selectedTeamImageUrl} name={teamLabel} size="sm" />
                      <span className="text-sm truncate">{teamLabel}</span>
                      <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="bottom" className="w-56">
                    <DropdownMenuLabel className="text-xs flex items-center justify-between gap-2 pr-1">
                      <span>{t('breadcrumb.switchTeam')}</span>
                      {canCreateTeams && (
                        <Button
                          type="button"
                          size="icon"
                          aria-label={t('breadcrumb.createNewTeam')}
                          title={t('breadcrumb.createNewTeam')}
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setShowCreateTeamDialog(true);
                          }}
                          className="h-6 w-6 rounded-md bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedTeamId(null)} className="text-sm cursor-pointer flex items-center justify-between">
                      <span>{t('breadcrumb.allTeams')}</span>
                      {selectedTeamId === null && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSelectedTeamId(UNASSIGNED_TEAM_ID)} className="text-sm cursor-pointer flex items-center justify-between">
                      <span>{t('breadcrumb.unassigned')}</span>
                      {selectedTeamId === UNASSIGNED_TEAM_ID && <Check className="h-4 w-4 text-primary" />}
                    </DropdownMenuItem>
                    {teamMemberships.length > 0 && <DropdownMenuSeparator />}
                    {teamMemberships.map((m) => (
                      <DropdownMenuItem key={m.team_id} onClick={() => setSelectedTeamId(m.team_id)} className="text-sm cursor-pointer flex items-center justify-between">
                        <span className="truncate">{m.team_name}</span>
                        {selectedTeamId === m.team_id && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            </>
          )}

          {!suppressSectionOnMobile && sectionLabel && (
            <>
              <BreadcrumbSeparator className="inline-flex shrink-0 items-center px-0.5 text-muted-foreground/70 sm:hidden">
                <span aria-hidden="true" className="text-sm leading-none">·</span>
              </BreadcrumbSeparator>
              <BreadcrumbSeparator className="hidden sm:inline-flex" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="text-sm sm:text-base font-medium truncate max-w-32 sm:max-w-none text-center sm:text-left">
                  {sectionLabel}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {showCreateTeamDialog && currentOrganization?.id && (
        <CreateTeamDialog
          open={showCreateTeamDialog}
          onClose={() => setShowCreateTeamDialog(false)}
          organizationId={currentOrganization.id}
        />
      )}
    </>
  );
};

export default ContextBreadcrumb;
