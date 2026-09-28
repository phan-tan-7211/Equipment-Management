import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useWorkspaceAccessRequest, useWorkspaceAccessRequestResubmission, useWorkspaceOnboardingState } from '@/hooks/useWorkspaceOnboarding';
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
  const resubmitAccessRequest = useWorkspaceAccessRequestResubmission();
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

  const googleUser = isGoogleUser(user);

  if (accessRequestLoading || (googleUser && onboardingLoading)) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label={t('authFlow.checkingWorkspace')} />
      </div>
    );
  }

  if (organizationsError || accessRequestError || (googleUser && onboardingError)) {
    return <WorkspaceAccessGate mode="error" domain={null} onRetry={() => { void refetch(); }} />;
  }

  if (accessRequest?.request_status === 'rejected') {
    return (
      <WorkspaceAccessGate
        mode="rejected"
        domain={googleUser ? onboardingState?.domain ?? null : null}
        rejectionReason={accessRequest.rejection_reason}
        reviewedAt={accessRequest.reviewed_at}
        reviewedByName={accessRequest.reviewed_by_name}
        isResubmitting={resubmitAccessRequest.isPending}
        resubmitFailed={resubmitAccessRequest.isError}
        onResubmit={() => resubmitAccessRequest.mutate()}
      />
    );
  }

  if (accessRequest?.request_status === 'pending' || accessRequest?.request_status === 'invitation_pending' || (googleUser && (onboardingState?.has_pending_invitation || onboardingState?.has_pending_claim))) {
    return <WorkspaceAccessGate mode="pending" domain={onboardingState?.domain ?? null} />;
  }

  if (!googleUser) {
    return <WorkspaceAccessGate mode="blocked" domain={null} />;
  }

  return (
    <WorkspaceAccessGate
      mode="blocked"
      domain={onboardingState?.domain_status === 'claimed' ? onboardingState.domain : null}
    />
  );
};

export default WorkspaceOnboardingGuard;
