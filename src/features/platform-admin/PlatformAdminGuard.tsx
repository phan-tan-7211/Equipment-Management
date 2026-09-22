import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { usePlatformAdminAccess } from './usePlatformAdminAccess';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

export function PlatformAdminGuard({ children }: { children: ReactNode }) {
  const { isPlatformAdmin, isLoading } = usePlatformAdminAccess();
  if (isLoading) return <PageSkeleton />;
  if (!isPlatformAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <ShieldX className="mx-auto mb-4 h-10 w-10 text-destructive" />
          <h1 className="text-xl font-semibold">Platform Administration unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">Active Platform Admin authority is required.</p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
