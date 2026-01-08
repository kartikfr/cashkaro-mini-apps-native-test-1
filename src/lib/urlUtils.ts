/**
 * Utility to append user profile ID to tracking URLs
 */

export const appendUserIdToUrl = (url: string, userId: number | null): string => {
  if (!url) return url;
  
  try {
    const urlObj = new URL(url);
    // Check if URL has 'id' parameter (with or without value)
    if (urlObj.searchParams.has('id')) {
      // Replace empty/existing id with user's profile ID
      urlObj.searchParams.set('id', userId?.toString() || '');
    }
    return urlObj.toString();
  } catch {
    // Fallback for malformed URLs - simple string replacement
    if (url.includes('?id=') && userId) {
      return url.replace(/([?&])id=([^&]*)/, `$1id=${userId}`);
    }
    return url;
  }
};
