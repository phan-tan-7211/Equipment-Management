import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

const EXIT_CONFIRM_WINDOW_MS = 2000;

/**
 * Dismiss the top-most Radix/shadcn overlay before changing routes. Android
 * users expect Back to close a dialog, drawer, popover, or menu first.
 */
function dismissOpenOverlay(): boolean {
  const openOverlay = document.querySelector<HTMLElement>(
    [
      '[role="dialog"][data-state="open"]',
      '[role="alertdialog"][data-state="open"]',
      '[data-radix-menu-content][data-state="open"]',
      '[data-radix-select-content][data-state="open"]',
      '[data-radix-popover-content][data-state="open"]',
      '[data-radix-dropdown-menu-content][data-state="open"]',
      '[data-radix-context-menu-content][data-state="open"]',
    ].join(','),
  );

  if (!openOverlay) return false;

  // Radix primitives consistently handle Escape and restore focus to the
  // trigger. Dispatch on the active element and document for nested portals.
  const eventOptions: KeyboardEventInit = {
    key: 'Escape',
    code: 'Escape',
    bubbles: true,
    cancelable: true,
  };
  (document.activeElement instanceof HTMLElement ? document.activeElement : openOverlay)
    .dispatchEvent(new KeyboardEvent('keydown', eventOptions));
  document.dispatchEvent(new KeyboardEvent('keydown', eventOptions));
  return true;
}

/**
 * Maps the Android hardware/system Back button to React Router navigation.
 *
 * Behaviour on Android native builds:
 * - Open overlay: close the overlay first.
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
      if (dismissOpenOverlay()) return;

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

      if (canGoBack && window.history.length > 1) {
        navigate(-1);
        return;
      }

      if (pathname.startsWith('/dashboard/')) {
        navigate('/dashboard', { replace: true });
        return;
      }

      if (canGoBack) {
        navigate(-1);
        return;
      }

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
