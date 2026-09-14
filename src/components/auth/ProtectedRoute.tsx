
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { logger } from '@/utils/logger';
import { useAuthFlowCopy } from './useAuthFlowCopy';

interface ProtectedRouteProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, loadingFallback }) => {
  const t = useAuthFlowCopy();
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Debugging logs for auth state (dev only to prevent PII logging)
  if (import.meta.env.DEV) {
    logger.debug('ProtectedRoute auth state', {
      user: user ? `${user.email} (${user.id})` : 'null',
      isLoading,
      timestamp: new Date().toISOString()
    });
  }

  if (isLoading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="min-h-screen bg-background">
        <div role="status" aria-label={t('authFlow.checkingAuth')} className="sr-only">
          {t('authFlow.verifyingProtected')}
        </div>
        <PageSkeleton />
      </div>
    );
  }

  if (!user) {
    if (import.meta.env.DEV) {
      logger.info('ProtectedRoute redirecting to auth (no user)');
    }
    
    // Save the current URL (with query params) so we can redirect back after login
    // This is important for OAuth callbacks (QuickBooks, etc.) that include result params
    const currentUrl = location.pathname + location.search;
    if (currentUrl !== '/' && currentUrl !== '/auth') {
      sessionStorage.setItem('pendingRedirect', currentUrl);
    }
    
    return <Navigate to="/auth" replace />;
  }

  if (import.meta.env.DEV) {
    logger.info('ProtectedRoute access granted');
  }
  return <>{children}</>;
};

export default ProtectedRoute;
