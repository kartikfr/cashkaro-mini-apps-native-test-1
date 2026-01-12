import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import SettingsSidebar from '@/components/layout/SettingsSidebar';
import PageTransition from '@/components/ui/PageTransition';
import { usePlatform } from '@/hooks/usePlatform';

interface SettingsPageLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout wrapper for settings/profile pages that includes:
 * - Desktop: Sidebar navigation on the left with smooth content transitions
 * - Mobile: Regular layout (no sidebar)
 * - Smooth fade + slide animations when navigating between pages
 * - Safe area handling for native mobile devices
 */
const SettingsPageLayout: React.FC<SettingsPageLayoutProps> = ({ children }) => {
  const { isNative } = usePlatform();
  
  return (
    <AppLayout>
      <div 
        className="flex gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full"
        style={isNative ? {
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        } : undefined}
      >
        {/* Desktop Sidebar - hidden on mobile */}
        <SettingsSidebar />
        
        {/* Main Content with smooth page transitions */}
        <PageTransition className="flex-1 min-w-0">
          {children}
        </PageTransition>
      </div>
    </AppLayout>
  );
};

export default SettingsPageLayout;
