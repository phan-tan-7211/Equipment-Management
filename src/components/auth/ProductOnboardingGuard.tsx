import React from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useProductOnboardingStatus } from '@/features/onboarding/hooks/useProductOnboarding';
import { useAuthFlowCopy } from './useAuthFlowCopy';

const GETTING_STARTED_PATH = '/dashboard/onboarding/getting-started';

interface ProductOnboardingGuardProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

/**
 * Redirects org owners/admins who have not completed product onboarding
 * to the getting-started wizard. Non-admins bypass this guard.
 */
const ProductOnboardingGuard: React.FC<ProductOnboardingGuardProps> = ({
  children,
  loadingFallback,
}) => {
  const t = useAuthFlowCopy();
  const location = useLocation();
  const { organizationId, isLoading: orgContextLoading } = useOrganization();
  const { data: status, isLoading, isError, isPending, isFetched } = useProductOnboardingStatus();

  if (location.pathname.startsWith(GETTING_STARTED_PATH)) {
    return <>{children}</>;
  }

  const onboardingCheckPending =
    orgContextLoading ||
    (Boolean(organizationId) && (isPending || isLoading || (!isFetched && !isError)));

  if (onboardingCheckPending) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          aria-label={t('authFlow.checkingOnboarding')}
        />
      </div>
    );
  }

  if (isError || !status) {
    return <>{children}</>;
  }

  if (status.needs_onboarding && status.is_org_admin) {
    return <Navigate to={GETTING_STARTED_PATH} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default ProductOnboardingGuard;
