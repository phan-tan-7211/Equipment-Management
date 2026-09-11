import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { focusManager } from '@tanstack/react-query';

/**
 * Small native-runtime bridge for behavior the browser normally supplies:
 * - app foreground/background -> TanStack Query focus state
 * - Android keyboard visibility -> CSS state + focused-control visibility
 *
 * It is intentionally a no-op in the normal web/PWA build.
 */
export function NativeRuntimeBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let disposed = false;
    const removers: Array<() => void> = [];

    const keep = (promise: Promise<{ remove: () => Promise<void> }>) => {
      void promise.then((handle) => {
        if (disposed) {
          void handle.remove();
          return;
        }
        removers.push(() => void handle.remove());
      });
    };

    focusManager.setFocused(true);

    keep(
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        focusManager.setFocused(isActive);
        document.documentElement.classList.toggle('app-backgrounded', !isActive);

        if (isActive) {
          // Give the WebView a real focus event as well; several existing web
          // listeners use it independently of TanStack Query.
          window.dispatchEvent(new Event('focus'));
        }
      }),
    );

    if (Capacitor.getPlatform() === 'android') {
      keep(
        Keyboard.addListener('keyboardWillShow', ({ keyboardHeight }) => {
          const root = document.documentElement;
          root.classList.add('keyboard-visible');
          root.style.setProperty('--native-keyboard-height', `${keyboardHeight}px`);

          // Android resizes the WebView, but complex dialogs/forms can still
          // leave the focused field near the IME edge. Center it after resize.
          window.setTimeout(() => {
            const active = document.activeElement;
            if (active instanceof HTMLElement) {
              active.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
            }
          }, 80);
        }),
      );

      keep(
        Keyboard.addListener('keyboardWillHide', () => {
          const root = document.documentElement;
          root.classList.remove('keyboard-visible');
          root.style.setProperty('--native-keyboard-height', '0px');
        }),
      );
    }

    return () => {
      disposed = true;
      removers.forEach((remove) => remove());
      focusManager.setFocused(undefined);
      document.documentElement.classList.remove('keyboard-visible', 'app-backgrounded');
      document.documentElement.style.removeProperty('--native-keyboard-height');
    };
  }, []);

  return null;
}
