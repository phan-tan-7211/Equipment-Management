import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageSEO } from '@/components/seo/PageSEO';
import { Loader2 } from 'lucide-react';
import {
  clearPendingRedirect,
  getPendingRedirect,
  getSafeRedirectPath,
} from '@/utils/redirectValidation';

const Landing = lazy(() => import('@/pages/Landing'));

function hasPersistedAuthSessionHint(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return Object.keys(window.localStorage).some((key) => {
      if (!key.startsWith('sb-') || !key.endsWith('-auth-token')) {
        return false;
      }
      const value = window.localStorage.getItem(key);
      return Boolean(value && value !== 'null' && value !== 'undefined');
    });
  } catch {
    return false;
  }
}

const LandingLoading = ({ label }: { label: string }) => (
  <div
    className="flex min-h-[50vh] items-center justify-center bg-background"
    role="status"
    aria-label={label}
  >
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);


/**
 * Smart landing page that conditionally renders based on authentication state.
 *
 * - Fresh unauthenticated visitors: display the public marketing landing immediately,
 *   with no dependency on auth resolution (issue #671).
 * - Returning browsers with a persisted Supabase auth session: show a neutral loading
 *   state while auth resolves so prerendered marketing content never flashes before
 *   redirecting back into the app.
 * - Authenticated users: honor `pendingRedirect` (e.g. QR scan after Google OAuth)
 *   when present; otherwise redirect to the dashboard once auth resolves.
 *
 * Workspace onboarding is voluntary — users connect their Google Workspace from
 * Organization Settings rather than being prompted on first login.
 */
const SmartLanding = () => {
  const { user, isLoading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const persistedAuthSessionHint = useMemo(hasPersistedAuthSessionHint, []);

  useEffect(() => {
    // Guard on !isLoading so we don't redirect prematurely while auth is resolving.
    if (!isLoading && user) {
      const pendingRedirect = getPendingRedirect();
      if (pendingRedirect) {
        clearPendingRedirect();
        navigate(getSafeRedirectPath(pendingRedirect, '/dashboard'), { replace: true });
        return;
      }
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Authenticated and auth resolved: return null while the redirect fires.
  // The useEffect above will navigate to /dashboard on the next tick.
  if (!isLoading && user) {
    return null;
  }

  // A persisted Supabase session means this browser is very likely returning
  // to the authenticated app. Keep the neutral loading state visible while
  // auth resolves instead of briefly hydrating the prerendered marketing page.
  // A stale/expired token is safe: AuthProvider resolves it and the public
  // landing page appears afterward if the session is no longer valid.
  if (isLoading && (user || persistedAuthSessionHint)) {
    return <LandingLoading label={t('publicChrome.landing.loading')} />;
  }

  // Public marketing page — renders immediately for true fresh visitors:
  //   • isLoading=true, user=null, no persisted auth hint
  //   • isLoading=false, user=null (unauthenticated visitor)
  return (
    <>
      <PageSEO
        title={t('publicChrome.landing.seoTitle')}
        description={t('publicChrome.landing.seoDescription')}
        path="/"
      />
      <Suspense fallback={<LandingLoading label={t('publicChrome.landing.loading')} />}>
        <Landing />
      </Suspense>
    </>
  );
};

export default SmartLanding;