import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cev.equipmentmanagement.trial',
  appName: 'Equipment Management',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;
