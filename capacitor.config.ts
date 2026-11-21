import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mototrack.touringlogger',
  appName: 'MotoTrack Touring Logger',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      // Background and High Accuracy settings
    }
  }
};

export default config;
