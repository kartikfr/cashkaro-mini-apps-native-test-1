import { App, URLOpenListenerEvent } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Deep link route mapping
 * Maps URL paths to app routes
 */
const DEEP_LINK_ROUTES: Record<string, string> = {
  '/offer': '/offer',
  '/deals': '/deals',
  '/earnings': '/earnings',
  '/payments': '/payments',
  '/profile': '/profile',
  '/help': '/help',
  '/orders': '/orders',
};

/**
 * Initialize deep link handling for native platforms
 */
export const initDeepLinks = (): void => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[DeepLinks] Not a native platform, skipping deep link setup');
    return;
  }

  // Listen for app URL open events (deep links)
  App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    console.log('[DeepLinks] App opened with URL:', event.url);
    handleDeepLink(event.url);
  });

  // Handle app state changes
  App.addListener('appStateChange', ({ isActive }) => {
    console.log('[DeepLinks] App state changed, isActive:', isActive);
  });

  // Handle back button on Android
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      // Optionally minimize the app or show exit confirmation
      App.minimizeApp();
    }
  });

  console.log('[DeepLinks] Deep link listeners initialized');
};

/**
 * Parse and handle a deep link URL
 */
const handleDeepLink = (url: string): void => {
  try {
    // Handle custom scheme (cashkaro://path)
    if (url.startsWith('cashkaro://')) {
      const path = url.replace('cashkaro://', '/');
      navigateToPath(path);
      return;
    }

    // Handle universal links (https://app.cashkaro.com/path)
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // Build the full path with query params
    const fullPath = searchParams.toString() 
      ? `${path}?${searchParams.toString()}`
      : path;

    navigateToPath(fullPath);
  } catch (error) {
    console.error('[DeepLinks] Failed to parse deep link:', error);
  }
};

/**
 * Navigate to the appropriate app route
 */
const navigateToPath = (path: string): void => {
  console.log('[DeepLinks] Navigating to:', path);

  // Extract base path and params
  const [basePath, queryString] = path.split('?');
  const pathParts = basePath.split('/').filter(Boolean);

  if (pathParts.length === 0) {
    // Root path - go to home
    window.location.href = '/';
    return;
  }

  // Check if this is a known route
  const routeKey = `/${pathParts[0]}`;
  
  if (routeKey in DEEP_LINK_ROUTES) {
    // Build the full route
    let targetPath = path;
    
    // Handle specific routes with IDs
    if (routeKey === '/offer' && pathParts.length > 1) {
      // /offer/123 -> /offer/123
      targetPath = `/offer/${pathParts[1]}`;
    }

    // Navigate using window.location for simplicity
    // In a more complex app, you might use a router reference
    window.location.href = targetPath;
  } else {
    console.log('[DeepLinks] Unknown route, navigating to home');
    window.location.href = '/';
  }
};

/**
 * Generate a deep link URL for sharing
 */
export const generateDeepLink = (
  path: string,
  params?: Record<string, string>
): { customScheme: string; universalLink: string } => {
  const queryString = params 
    ? '?' + new URLSearchParams(params).toString()
    : '';

  return {
    customScheme: `cashkaro://${path}${queryString}`,
    universalLink: `https://app.cashkaro.com${path}${queryString}`,
  };
};

/**
 * Share a deep link using the native share sheet
 */
export const shareDeepLink = async (
  title: string,
  path: string,
  params?: Record<string, string>
): Promise<void> => {
  const links = generateDeepLink(path, params);
  
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        url: links.universalLink,
      });
    } catch (error) {
      console.log('[DeepLinks] Share cancelled or failed:', error);
    }
  } else {
    // Fallback - copy to clipboard
    try {
      await navigator.clipboard.writeText(links.universalLink);
      console.log('[DeepLinks] Link copied to clipboard');
    } catch (error) {
      console.error('[DeepLinks] Failed to copy link:', error);
    }
  }
};

/**
 * Remove all deep link listeners (cleanup)
 */
export const removeDeepLinkListeners = async (): Promise<void> => {
  await App.removeAllListeners();
};
