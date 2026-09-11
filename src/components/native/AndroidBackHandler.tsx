import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

const EXIT_CONFIRM_WINDOW_MS = 2000;

/**
 * Maps the Android hardware/system Back button to React Router navigation.
 *
 * Behaviour on Android native builds:
 * - Nested routes: go back through the web navigation history.
 * - A dashboard child route without usable history: return to /dashboard.
 * - Dashboard root: require a second Back press within 2 seconds to exit.
 *
 * On the normal web build this component is a no-op.
 */
export function AndroidBackHandler() {
  const navigate = useNavigate();
  const lastDashboardBackAt = useRef(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return undefined;
    }

    let disposed = false;
    let removeListener: (() => void) | undefined;

    void CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const pathname = window.location.pathname;
      const isDashboardRoot = pathname === '/dashboard' || pathname === '/dashboard/';

      if (isDashboardRoot) {
        const now = Date.now();
        if (now - lastDashboardBackAt.current <= EXIT_CONFIRM_WINDOW_MS) {
          void CapacitorApp.exitApp();
          return;
        }

        lastDashboardBackAt.current = now;
        toast('Nhấn Back lần nữa để thoát', { duration: EXIT_CONFIRM_WINDOW_MS });
        return;
      }

      // Prefer actual browser/router history so Back behaves like the web app.
      if (canGoBack && window.history.length > 1) {
        navigate(-1);
        return;
      }

      // Deep links can open a dashboard child directly with no history entry.
      if (pathname.startsWith('/dashboard/')) {
        navigate('/dashboard', { replace: true });
        return;
      }

      if (canGoBack) {
        navigate(-1);
        return;
      }

      // Public/native entry route fallback: return to the app home instead of exiting.
      if (pathname !== '/') {
        navigate('/', { replace: true });
      }
    }).then((handle) => {
      if (disposed) {
        void handle.remove();
        return;
      }
      removeListener = () => {
        void handle.remove();
      };
    });

    return () => {
      disposed = true;
      removeListener?.();
    };
  }, [navigate]);

  return null;
}
