import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWorkspaceAccessRequest, useWorkspaceOnboardingState } from '@/hooks/useWorkspaceOnboarding';
import { isGoogleUser } from '@/utils/google-workspace';
import WorkspaceAccessGate from '@/components/auth/WorkspaceAccessGate';
import { useAuthFlowCopy } from './useAuthFlowCopy';

interface WorkspaceOnboardingGuardProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

/**
 * Keeps Google authentication separate from organization authorization.
 * Existing active memberships grant access; invitations and import claims remain
 * pending until their established server-side flows complete.
 */
const WorkspaceOnboardingGuard: React.FC<WorkspaceOnboardingGuardProps> = ({
  children,
  loadingFallback,
}) => {
  const t = useAuthFlowCopy();
  const { user } = useAuth();
  const {
    organizations,
    isLoading: organizationsLoading,
    error: organizationsError,
  } = useOrganization();
  const { data: accessRequest, isLoading: accessRequestLoading, isError: accessRequestError } = useWorkspaceAccessRequest();
  const { data: onboardingState, isLoading: onboardingLoading, isError: onboardingError, refetch } = useWorkspaceOnboardingState();

  if (!user) {
    return <>{children}</>;
  }

  if (organizationsLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label={t('authFlow.checkingWorkspace')} />
      </div>
    );
  }

  if (organizations.length > 0) {
    return <>{children}</>;
  }

  if (!isGoogleUser(user)) {
    return <WorkspaceAccessGate mode="blocked" domain={null} />;
  }

  if (accessRequestLoading || (isGoogleUser(user) && onboardingLoading)) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label={t('authFlow.checkingWorkspace')} />
      </div>
    );
  }

  if (organizationsError || accessRequestError || onboardingError) {
    return <WorkspaceAccessGate mode="error" domain={null} onRetry={() => { void refetch(); }} />;
  }

  if (accessRequest?.request_status === 'pending' || accessRequest?.request_status === 'invitation_pending' || onboardingState?.has_pending_invitation || onboardingState?.has_pending_claim) {
    return <WorkspaceAccessGate mode="pending" domain={onboardingState?.domain ?? null} />;
  }

  return (
    <WorkspaceAccessGate
      mode="blocked"
      domain={onboardingState?.domain_status === 'claimed' ? onboardingState.domain : null}
    />
  );
};

export default WorkspaceOnboardingGuard;
