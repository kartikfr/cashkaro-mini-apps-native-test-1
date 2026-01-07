import { Capacitor } from '@capacitor/core';

export interface PlatformInfo {
  platform: 'ios' | 'android' | 'web';
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
}

export const usePlatform = (): PlatformInfo => {
  const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  const isNative = Capacitor.isNativePlatform();
  
  return {
    platform,
    isNative,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
  };
};

export default usePlatform;
