import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { onlineManager } from '@tanstack/react-query';
import { WifiOff } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Native Android network bridge.
 *
 * Capacitor's Network plugin is more reliable than navigator.onLine inside an
 * Android WebView. Keep TanStack Query and the existing browser online/offline
 * hooks in sync by mirroring native connectivity back into window events.
 */
export function NativeNetworkBridge() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;

    let disposed = false;
    let previous: boolean | null = null;
    let removeListener: (() => void) | undefined;

    const applyStatus = (connected: boolean) => {
      if (disposed) return;

      setIsOnline(connected);
      onlineManager.setOnline(connected);
      document.documentElement.classList.toggle('native-offline', !connected);

      if (previous !== null && previous !== connected) {
        window.dispatchEvent(new Event(connected ? 'online' : 'offline'));
        if (connected) {
          toast.success('Đã kết nối lại mạng', { id: 'native-network-status', duration: 2200 });
        } else {
          toast.warning('Mất kết nối mạng — dữ liệu chưa đồng bộ sẽ được giữ lại', {
            id: 'native-network-status',
            duration: 4000,
          });
        }
      }

      previous = connected;
    };

    void Network.getStatus().then(({ connected }) => applyStatus(connected));

    void Network.addListener('networkStatusChange', ({ connected }) => {
      applyStatus(connected);
    }).then((handle) => {
      if (disposed) {
        void handle.remove();
        return;
      }
      removeListener = () => void handle.remove();
    });

    return () => {
      disposed = true;
      removeListener?.();
      onlineManager.setOnline(undefined);
      document.documentElement.classList.remove('native-offline');
    };
  }, []);

  if (!Capacitor.isNativePlatform() || isOnline !== false) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 top-[calc(var(--safe-area-inset-top,0px)+0.5rem)] z-[10000] mx-auto flex max-w-xl items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-background/95 px-3 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
      <span>Offline — thay đổi hỗ trợ offline sẽ được đồng bộ khi có mạng.</span>
    </div>
  );
}
