import React, { ReactNode } from 'react';
import { usePlatform } from '@/hooks/usePlatform';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /** Max width class - defaults to max-w-7xl */
  maxWidth?: string;
  /** Whether to apply horizontal safe area on native */
  safeAreaX?: boolean;
  /** Whether to center content horizontally */
  centered?: boolean;
  /** Remove default padding */
  noPadding?: boolean;
}

/**
 * Consistent page container with standardized padding:
 * - Mobile: px-4 py-4 (16px)
 * - Tablet (sm+): px-5 py-5 (20px)
 * - Desktop (lg+): px-6 py-6 (24px)
 * - Large Desktop (xl+): px-8 py-8 (32px)
 * 
 * Includes safe area awareness for native platforms.
 */
const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  maxWidth = 'max-w-7xl',
  safeAreaX = true,
  centered = true,
  noPadding = false,
}) => {
  const { isNative } = usePlatform();

  const paddingClasses = noPadding 
    ? '' 
    : 'px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6 xl:px-8 xl:py-8';

  // Safe area styles for native platforms
  const safeAreaStyles = (isNative && safeAreaX) ? {
    paddingLeft: 'max(1rem, env(safe-area-inset-left))',
    paddingRight: 'max(1rem, env(safe-area-inset-right))',
  } : {};

  return (
    <div 
      className={cn(
        paddingClasses,
        centered && maxWidth,
        centered && 'mx-auto',
        'w-full',
        className
      )}
      style={safeAreaStyles}
    >
      {children}
    </div>
  );
};

export default PageContainer;
