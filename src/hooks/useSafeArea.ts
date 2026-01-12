import { usePlatform } from '@/hooks/usePlatform';

/**
 * Hook providing safe area inset values for native mobile apps.
 * Returns CSS env() values when running on native platforms,
 * or '0px' fallbacks for web.
 */
export const useSafeArea = () => {
  const { isNative } = usePlatform();
  
  return {
    top: isNative ? 'env(safe-area-inset-top)' : '0px',
    bottom: isNative ? 'env(safe-area-inset-bottom)' : '0px',
    left: isNative ? 'env(safe-area-inset-left)' : '0px',
    right: isNative ? 'env(safe-area-inset-right)' : '0px',
    isNative,
  };
};

export default useSafeArea;
