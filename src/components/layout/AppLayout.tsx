import React, { ReactNode } from 'react';
import BottomNav from './BottomNav';
import Footer from './Footer';
import TopNav from './TopNav';
import MobilePageTransition from '@/components/ui/MobilePageTransition';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePlatform } from '@/hooks/usePlatform';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  /** Whether to disable page transition animations (useful when parent already handles transitions) */
  disableTransition?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, disableTransition = false }) => {
  const isMobile = useIsMobile();
  const { isNative } = usePlatform();
  
  // Wrap content in mobile transition if on mobile and transitions not disabled
  const content = (isMobile && !disableTransition) ? (
    <MobilePageTransition>
      {children}
    </MobilePageTransition>
  ) : (
    children
  );

  return (
    <div 
      className="min-h-screen bg-background flex flex-col"
      style={isNative ? {
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      } : undefined}
    >
      <TopNav />
      <main 
        className={cn(
          "flex-1 pt-16",
          // Adjust bottom padding for native vs web
          isNative ? "pb-24" : "pb-20 lg:pb-0"
        )}
      >
        {content}
        <Footer />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
