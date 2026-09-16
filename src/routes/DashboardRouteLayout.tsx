import { Suspense } from 'react';
import { Routes, useLocation } from 'react-router-dom';
import { TeamProvider } from '@/contexts/TeamContext';
import { SelectedTeamProvider } from '@/contexts/SelectedTeamContext';
import { SimpleOrganizationProvider } from '@/contexts/SimpleOrganizationProvider';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DashboardLoadingShell } from '@/components/layout/DashboardLoadingShell';
import WorkspaceOnboardingGuard from '@/components/auth/WorkspaceOnboardingGuard';
import ProductOnboardingGuard from '@/components/auth/ProductOnboardingGuard';
import MFAEnforcementGuard from '@/components/auth/MFAEnforcementGuard';
import IdleSessionTimeoutGuard from '@/components/auth/IdleSessionTimeoutGuard';
import { BugReportProvider } from '@/features/tickets/context/BugReportContext';
import { PendingSyncBanner } from '@/features/offline-queue/components/PendingSyncBanner';
import { OFFLINE_QUEUE_ENABLED } from '@/lib/flags';
import LegalFooter from '@/components/layout/LegalFooter';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { AppSidebar, TopBar, BottomNav } from '@/routes/lazyDashboardPages';
import { OptionalOfflineQueueProvider } from '@/routes/OptionalOfflineQueueProvider';
import { dashboardRouteElements } from '@/routes/DashboardRoutes';
import { useI18n } from '@/i18n';
import { cn } from '@/lib/utils';

const BrandedTopBar = () => <TopBar />;

export const DashboardRouteLayout = () => {
  const { t } = useI18n();
  const location = useLocation();
  const isEquipmentListRoute = /^\/dashboard\/equipment\/?$/.test(location.pathname);

  const authLoadingFallback = (
    <DashboardLoadingShell
      statusLabel={t('dashboardLoading.authStatus')}
      message={t('dashboardLoading.authMessage')}
    />
  );

  const securityLoadingFallback = (
    <DashboardLoadingShell
      statusLabel={t('dashboardLoading.securityStatus')}
      message={t('dashboardLoading.securityMessage')}
    />
  );

  const workspaceLoadingFallback = (
    <DashboardLoadingShell
      statusLabel={t('dashboardLoading.workspaceStatus')}
      message={t('dashboardLoading.workspaceMessage')}
    />
  );

  const onboardingLoadingFallback = (
    <DashboardLoadingShell
      statusLabel={t('dashboardLoading.onboardingStatus')}
      message={t('dashboardLoading.onboardingMessage')}
    />
  );

  return (
    <ProtectedRoute loadingFallback={authLoadingFallback}>
      <SimpleOrganizationProvider>
        <MFAEnforcementGuard loadingFallback={securityLoadingFallback}>
          <WorkspaceOnboardingGuard loadingFallback={workspaceLoadingFallback}>
            <ProductOnboardingGuard loadingFallback={onboardingLoadingFallback}>
              <OptionalOfflineQueueProvider>
                <TeamProvider>
                  <SelectedTeamProvider>
                    <SidebarProvider>
                      <BugReportProvider>
                        <div className="flex h-svh min-h-0 w-full overflow-hidden">
                          <IdleSessionTimeoutGuard />
                          <Suspense
                            fallback={
                              <div className="w-64 border-r bg-sidebar">
                                <div className="animate-pulse h-full bg-sidebar-accent/20" />
                              </div>
                            }
                          >
                            <AppSidebar />
                          </Suspense>
                          <SidebarInset className="flex h-svh min-h-0 flex-1 min-w-0">
                            <Suspense
                              fallback={
                                <div className="h-14 sm:h-16 border-b">
                                  <div className="animate-pulse h-full bg-muted/20" />
                                </div>
                              }
                            >
                              <BrandedTopBar />
                            </Suspense>
                            {OFFLINE_QUEUE_ENABLED && <PendingSyncBanner />}
                            <main
                              id="main-content"
                              tabIndex={-1}
                              className={cn(
                                'flex-1 min-h-0 min-w-0 pb-16 md:pb-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                isEquipmentListRoute ? 'min-h-0 overflow-hidden' : 'overflow-auto',
                              )}
                            >
                              <Suspense fallback={<PageSkeleton />}>
                                <Routes>{dashboardRouteElements}</Routes>
                              </Suspense>
                            </main>
                            <LegalFooter />
                          </SidebarInset>
                          <Suspense fallback={null}>
                            <BottomNav />
                          </Suspense>
                        </div>
                      </BugReportProvider>
                    </SidebarProvider>
                  </SelectedTeamProvider>
                </TeamProvider>
              </OptionalOfflineQueueProvider>
            </ProductOnboardingGuard>
          </WorkspaceOnboardingGuard>
        </MFAEnforcementGuard>
      </SimpleOrganizationProvider>
    </ProtectedRoute>
  );
};
