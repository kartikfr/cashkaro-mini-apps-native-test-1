import React, { ReactNode } from 'react';
import { usePlatform } from '@/hooks/usePlatform';
import { cn } from '@/lib/utils';

interface SafeAreaWrapperProps {
  children: ReactNode;
  className?: string;
  /** Apply top safe area padding */
  top?: boolean;
  /** Apply bottom safe area padding */
  bottom?: boolean;
  /** Apply left safe area padding */
  left?: boolean;
  /** Apply right safe area padding */
  right?: boolean;
}

/**
 * Wrapper component that automatically applies safe area insets
 * for devices with notches, home indicators, etc.
 * 
 * Only applies on native platforms (iOS/Android).
 */
const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  className,
  top = false,
  bottom = false,
  left = false,
  right = false,
}) => {
  const { isNative } = usePlatform();

  // Only apply safe area styles on native platforms
  const safeAreaStyles = isNative ? {
    paddingTop: top ? 'env(safe-area-inset-top)' : undefined,
    paddingBottom: bottom ? 'env(safe-area-inset-bottom)' : undefined,
    paddingLeft: left ? 'env(safe-area-inset-left)' : undefined,
    paddingRight: right ? 'env(safe-area-inset-right)' : undefined,
  } : {};

  return (
    <div className={cn(className)} style={safeAreaStyles}>
      {children}
    </div>
  );
};

/**
 * Get safe area inset values (CSS custom properties)
 * Useful for inline styles or calculations
 */
export const getSafeAreaInsets = () => ({
  top: 'env(safe-area-inset-top)',
  bottom: 'env(safe-area-inset-bottom)',
  left: 'env(safe-area-inset-left)',
  right: 'env(safe-area-inset-right)',
});

export default SafeAreaWrapper;
