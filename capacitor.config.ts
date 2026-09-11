import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cev.equipmentmanagement.trial',
  appName: 'Equipment Management',
  webDir: 'dist',
  backgroundColor: '#0A0A0A',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0A0A0A',
    zoomEnabled: false,
    resolveServiceWorkerRequests: false,
  },
  plugins: {
    // Capacitor 8 SystemBars is the modern edge-to-edge API. On Android it
    // injects --safe-area-inset-* CSS variables, including a fallback for
    // WebView versions where env(safe-area-inset-*) is inaccurate.
    SystemBars: {
      insetsHandling: 'css',
      style: 'DARK',
      hidden: false,
      animation: 'NONE',
    },
    SplashScreen: {
      launchShowDuration: 650,
      launchAutoHide: true,
      launchFadeOutDuration: 180,
      backgroundColor: '#0A0A0A',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
    },
    Keyboard: {
      // Android normally resizes the WebView itself. This also covers
      // fullscreen/edge-to-edge layouts where the keyboard can otherwise
      // overlap focused form controls.
      resizeOnFullScreen: true,
    },
  },
};

export default config;
