import React, { ReactNode, CSSProperties } from 'react';
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
  /** Apply all safe area insets */
  all?: boolean;
  /** Apply horizontal (left + right) safe area insets */
  horizontal?: boolean;
  /** Apply vertical (top + bottom) safe area insets */
  vertical?: boolean;
  /** Additional padding to add to safe area (e.g., for extra spacing) */
  extraPadding?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  /** Force apply even on web (useful for testing) */
  forceApply?: boolean;
  /** Render as different element */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Wrapper component that automatically applies safe area insets
 * for devices with notches, home indicators, etc.
 * 
 * By default, only applies on native platforms (iOS/Android).
 * Use forceApply={true} to apply on web as well.
 */
const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  className,
  top = false,
  bottom = false,
  left = false,
  right = false,
  all = false,
  horizontal = false,
  vertical = false,
  extraPadding,
  forceApply = false,
  as: Component = 'div',
}) => {
  const { isNative } = usePlatform();

  const shouldApply = isNative || forceApply;

  // Calculate which sides need safe area
  const applyTop = shouldApply && (top || all || vertical);
  const applyBottom = shouldApply && (bottom || all || vertical);
  const applyLeft = shouldApply && (left || all || horizontal);
  const applyRight = shouldApply && (right || all || horizontal);

  // Build safe area styles
  const safeAreaStyles: CSSProperties = {};

  if (applyTop) {
    safeAreaStyles.paddingTop = extraPadding?.top 
      ? `calc(env(safe-area-inset-top) + ${extraPadding.top})`
      : 'env(safe-area-inset-top)';
  }
  if (applyBottom) {
    safeAreaStyles.paddingBottom = extraPadding?.bottom 
      ? `calc(env(safe-area-inset-bottom) + ${extraPadding.bottom})`
      : 'env(safe-area-inset-bottom)';
  }
  if (applyLeft) {
    safeAreaStyles.paddingLeft = extraPadding?.left 
      ? `calc(env(safe-area-inset-left) + ${extraPadding.left})`
      : 'env(safe-area-inset-left)';
  }
  if (applyRight) {
    safeAreaStyles.paddingRight = extraPadding?.right 
      ? `calc(env(safe-area-inset-right) + ${extraPadding.right})`
      : 'env(safe-area-inset-right)';
  }

  return (
    <Component className={cn(className)} style={safeAreaStyles}>
      {children}
    </Component>
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

/**
 * Get safe area CSS calc expression with additional padding
 * @param side - Which safe area inset to use
 * @param extraPadding - Additional padding to add (e.g., '1rem', '16px')
 */
export const getSafeAreaWithPadding = (
  side: 'top' | 'bottom' | 'left' | 'right',
  extraPadding: string
) => `calc(env(safe-area-inset-${side}) + ${extraPadding})`;

export default SafeAreaWrapper;
