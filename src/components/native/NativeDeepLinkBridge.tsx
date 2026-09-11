import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { parseEquipQRTarget } from '@/utils/qr';
import { getPendingRedirect, toSameOriginPath } from '@/utils/redirectValidation';

const NATIVE_AUTH_SCHEME = 'equipqr:';
const EQUIPQR_HOSTS = new Set(['equipqr.app', 'www.equipqr.app']);

function getHashParams(url: URL): URLSearchParams {
  return new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
}

function isNativeAuthCallback(url: URL): boolean {
  if (url.protocol === NATIVE_AUTH_SCHEME && url.hostname === 'auth' && url.pathname === '/callback') {
    return true;
  }

  return (
    url.protocol === 'https:' &&
    EQUIPQR_HOSTS.has(url.hostname.toLowerCase()) &&
    url.pathname.replace(/\/+$/, '') === '/auth'
  );
}

/**
 * Native-only URL bridge.
 *
 * Handles:
 * - Supabase Google OAuth callback -> native session restoration
 * - https://equipqr.app/qr/... Android App Links -> in-app React route
 * - cold-launch links via App.getLaunchUrl()
 *
 * The normal browser/PWA build is untouched.
 */
export function NativeDeepLinkBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let disposed = false;
    let handlingAuth = false;

    const finishAuthNavigation = () => {
      const pending = getPendingRedirect();
      navigate(pending ? toSameOriginPath(pending, '/dashboard') : '/dashboard', { replace: true });
    };

    const handleAuthCallback = async (url: URL) => {
      if (handlingAuth) return;
      handlingAuth = true;

      try {
        const search = url.searchParams;
        const hash = getHashParams(url);
        const errorDescription =
          search.get('error_description') ??
          hash.get('error_description') ??
          search.get('error') ??
          hash.get('error');

        if (errorDescription) {
          toast.error(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
          return;
        }

        const code = search.get('code') ?? hash.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          finishAuthNavigation();
          return;
        }

        const accessToken = hash.get('access_token') ?? search.get('access_token');
        const refreshToken = hash.get('refresh_token') ?? search.get('refresh_token');
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          finishAuthNavigation();
          return;
        }

        // Some OAuth callbacks can arrive after the SDK has already persisted
        // the session. Accept that state instead of showing a false error.
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          finishAuthNavigation();
          return;
        }

        throw new Error('Google sign-in returned to the app without a usable session.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Google sign-in could not be completed.';
        toast.error(message);
      } finally {
        handlingAuth = false;
        try {
          await Browser.close();
        } catch {
          // Android Custom Tabs may already be closed by the deep-link return.
        }
      }
    };

    const handleIncomingUrl = async (rawUrl: string) => {
      if (disposed || !rawUrl) return;

      let url: URL;
      try {
        url = new URL(rawUrl);
      } catch {
        return;
      }

      if (isNativeAuthCallback(url)) {
        await handleAuthCallback(url);
        return;
      }

      if (url.protocol === 'https:' && EQUIPQR_HOSTS.has(url.hostname.toLowerCase())) {
        const parsed = parseEquipQRTarget(rawUrl, 'https://equipqr.app');
        if (parsed.ok) {
          navigate(parsed.path);
        }
      }
    };

    const handles: Array<{ remove: () => Promise<void> }> = [];
    void CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      void handleIncomingUrl(url);
    }).then((handle) => {
      if (disposed) void handle.remove();
      else handles.push(handle);
    });

    // Covers links that launched the app from a fully stopped state.
    void CapacitorApp.getLaunchUrl().then((launch) => {
      if (launch?.url) void handleIncomingUrl(launch.url);
    });

    return () => {
      disposed = true;
      handles.forEach((handle) => void handle.remove());
    };
  }, [navigate]);

  return null;
}
