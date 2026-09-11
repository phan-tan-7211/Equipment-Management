import { toast } from 'sonner';
import {
  downloadBlobNative,
  isNativeAndroidFileRuntime,
} from '@/services/nativeFileBridge';

let installed = false;

function isInterceptableDownload(anchor: HTMLAnchorElement): boolean {
  if (!anchor.download) return false;
  const href = anchor.href;
  return href.startsWith('blob:') || href.startsWith('data:');
}

function handleNativeAnchorDownload(anchor: HTMLAnchorElement): void {
  const href = anchor.href;
  const filename = anchor.download || `equipqr-export-${Date.now()}`;

  void fetch(href)
    .then((response) => response.blob())
    .then((blob) => downloadBlobNative(blob, filename))
    .catch((error) => {
      const message = error instanceof Error ? error.message : 'Could not save Android download.';
      toast.error(message);
    });
}

/**
 * Catch libraries such as jsPDF/FileSaver that call <a download>.click() directly.
 * Capacitor's WebView does not provide a browser Download Manager, so these blob
 * downloads are routed to Documents/EquipQR + the native Share action instead.
 */
export function installNativeDownloadInterceptor(): void {
  if (installed || !isNativeAndroidFileRuntime()) return;
  installed = true;

  const originalClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function nativeDownloadClick(this: HTMLAnchorElement): void {
    if (isInterceptableDownload(this)) {
      handleNativeAnchorDownload(this);
      return;
    }
    originalClick.call(this);
  };

  // FileSaver implementations that dispatch MouseEvent('click') instead of
  // calling anchor.click() are caught here when the anchor is attached to DOM.
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      const anchor = target instanceof Element ? target.closest('a[download]') : null;
      if (!(anchor instanceof HTMLAnchorElement) || !isInterceptableDownload(anchor)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      handleNativeAnchorDownload(anchor);
    },
    true,
  );
}
