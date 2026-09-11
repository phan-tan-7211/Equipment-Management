import React from 'react';
import { useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { MFAProvider } from '@/contexts/MFAContext';
import { UserProvider } from '@/contexts/UserContext';
import { SessionProvider } from '@/contexts/SessionContext';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import { CookieConsentBanner } from '@/components/privacy/CookieConsentBanner';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const isNativeRuntime = Capacitor.isNativePlatform();

/**
 * Sonner toasts are mounted above modals. On a phone, top-center keeps short
 * native feedback away from the Android gesture/navigation area.
 */
const AppSonnerToaster: React.FC = () => (
  <SonnerToaster
    theme="dark"
    position={isNativeRuntime ? 'top-center' : 'bottom-right'}
    closeButton
    mobileOffset={{ top: 'calc(var(--safe-area-inset-top, 0px) + 12px)', left: 12, right: 12 }}
    style={{ zIndex: 'var(--z-toast)' } as React.CSSProperties}
  />
);

/** TanStack Query retries should stop on hard auth/RBAC failures (not only numeric 401/403 strings). */
function isNonRetryableQueryError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (message.includes('401') || message.includes('403')) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes('jwt') ||
    lower.includes('permission denied') ||
    lower.includes('not authorized') ||
    lower.includes('unauthorized') ||
    lower.includes('invalid refresh token') ||
    lower.includes('session expired')
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Native users revisit the same equipment/work-order screens repeatedly.
      // Keep successful data warm longer in the APK to reduce factory-Wi-Fi
      // round trips while still refreshing on reconnect.
      staleTime: isNativeRuntime ? 10 * 60 * 1000 : 5 * 60 * 1000,
      gcTime: isNativeRuntime ? 24 * 60 * 60 * 1000 : 30 * 60 * 1000,
      refetchOnReconnect: true,
      refetchOnWindowFocus: !isNativeRuntime,
      retry: (failureCount, error) => {
        if (isNonRetryableQueryError(error)) return false;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Persistent storage is intentionally not enabled globally: many queries
      // contain tenant-scoped data and indiscriminate disk persistence would be
      // a privacy/security regression. Existing offline-aware mutations remain
      // responsible for their own durable queue.
    },
    mutations: {
      networkMode: 'always', // Offline handling is in OfflineAwareService layer.
    },
  },
});

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const { pathname } = useLocation();
  const isQrEntry = pathname.startsWith('/qr/');

  if (isQrEntry) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" forcedTheme="dark">
          <CookieConsentProvider>
            <TooltipProvider>
              <AuthProvider>
                <SessionProvider>{children}</SessionProvider>
              </AuthProvider>
            </TooltipProvider>
            <CookieConsentBanner />
            <Toaster />
            <AppSonnerToaster />
          </CookieConsentProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" forcedTheme="dark">
        <CookieConsentProvider>
          <TooltipProvider>
            <AuthProvider>
              <MFAProvider>
                <UserProvider>
                  <SessionProvider>{children}</SessionProvider>
                </UserProvider>
              </MFAProvider>
            </AuthProvider>
          </TooltipProvider>
          <CookieConsentBanner />
          <Toaster />
          <AppSonnerToaster />
        </CookieConsentProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};