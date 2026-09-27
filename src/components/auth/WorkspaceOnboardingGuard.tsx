import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWorkspaceOnboardingState } from '@/hooks/useWorkspaceOnboarding';
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
  const { data: onboardingState, isLoading, isError, refetch } = useWorkspaceOnboardingState();

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

  if (isLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label={t('authFlow.checkingWorkspace')} />
      </div>
    );
  }

  if (organizationsError || isError) {
    return <WorkspaceAccessGate mode="error" domain={null} onRetry={() => { void refetch(); }} />;
  }

  if (onboardingState?.has_pending_invitation || onboardingState?.has_pending_claim) {
    return <WorkspaceAccessGate mode="pending" domain={onboardingState.domain} />;
  }

  return (
    <WorkspaceAccessGate
      mode="blocked"
      domain={onboardingState?.domain_status === 'claimed' ? onboardingState.domain : null}
    />
  );
};

export default WorkspaceOnboardingGuard;
