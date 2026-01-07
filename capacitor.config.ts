import type { CapacitorConfig } from '@capacitor/cli';

// Set to true for development (hot-reload from Lovable), false for production builds
const useDevServer = false;

const config: CapacitorConfig = {
  appId: 'com.cashkaro.creditcardcashback',
  appName: 'Credit Card Cashback',
  webDir: 'dist',
  // Only use server URL for development hot-reload
  ...(useDevServer && {
    server: {
      url: 'https://386f832b-24ab-46c0-adee-2f5ed9377efd.lovableproject.com?forceHideBadge=true',
      cleartext: true
    }
  }),
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0d9669',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'cashkaro'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
