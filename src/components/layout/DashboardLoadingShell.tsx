import { PageSkeleton } from '@/components/ui/PageSkeleton';
import Logo from '@/components/ui/Logo';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/i18n';
import { getDashboardLoadingShellCopy } from '@/i18n/dashboardLoadingShellResources';

interface DashboardLoadingShellProps {
  statusLabel?: string;
  message?: string;
}

export function DashboardLoadingShell({
  statusLabel,
  message,
}: DashboardLoadingShellProps) {
  const { language } = useI18n();
  const copy = getDashboardLoadingShellCopy(language);
  const resolvedStatusLabel = statusLabel ?? copy.loadingDashboard;
  const resolvedMessage = message ?? copy.loadingContent;
  const sectionSkeletonWidths = ['w-full', 'w-11/12', 'w-10/12'] as const;
  const sections = [copy.fleet, copy.operations, copy.infrastructure];

  return (
    <div data-testid="dashboard-loading-shell" className="flex h-svh min-h-0 w-full overflow-hidden bg-background">
      <aside
        aria-label={copy.navigationLoading}
        data-testid="dashboard-loading-sidebar"
        className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col"
      >
        <div className="border-b p-4">
          <div className="flex items-center gap-2 rounded-md px-2 py-2 text-sidebar-foreground">
            <Logo size="sm" title="" />
            <span className="font-semibold text-base">ZNTEQR™</span>
          </div>
        </div>

        <div className="flex-1 space-y-4 p-3">
          {sections.map((sectionLabel) => (
            <section key={sectionLabel} className="space-y-2">
              <span className="px-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
                {sectionLabel}
              </span>
              <div className="space-y-1">
                {sectionSkeletonWidths.map((widthClass, index) => (
                  <div
                    key={`${sectionLabel}-${index}`}
                    className="flex items-center gap-2 rounded-md px-2 py-2"
                  >
                    <Skeleton className="h-4 w-4 rounded-sm" />
                    <Skeleton className={`h-4 ${widthClass}`} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </aside>

      <div className="flex h-svh min-h-0 min-w-0 flex-1 flex-col">
        <header
          aria-label={copy.headerLoading}
          data-testid="dashboard-loading-header"
          className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:h-16"
        >
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="hidden h-4 w-px bg-border sm:block" />
          <Skeleton className="h-6 w-40" />
          <div className="ml-auto flex items-center gap-3">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-auto pb-16 outline-none md:pb-0"
        >
          <div role="status" aria-label={resolvedStatusLabel} className="sr-only">
            {resolvedMessage}
          </div>
          <PageSkeleton />
        </main>
      </div>
    </div>
  );
}
