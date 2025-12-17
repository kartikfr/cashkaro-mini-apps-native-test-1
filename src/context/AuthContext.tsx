import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { generateToken, refreshToken as refreshTokenApi, initGuestToken, stopTokenRefresh } from '@/lib/api';

interface User {
  userId: number;
  mobileNumber: string;
  email: string;
  firstName: string;
  isNewUser: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  refreshTokenStr: string | null;
  guestToken: string | null;
}

interface AuthContextType extends AuthState {
  login: (loginData: {
    access_token: string;
    refresh_token: string;
    user_id: number;
    mobile_number: string;
    email: string;
    first_name: string;
    is_new_user: boolean;
    expires_in?: number;
  }) => void;
  logout: () => void;
  getGuestToken: () => Promise<string>;
}

const AUTH_STORAGE_KEY = 'cashkaro_auth';

interface StoredAuthData {
  accessToken: string;
  refreshTokenStr: string;
  user: User;
  expiresAt: number;
}

// Helper to decode JWT and get expiration time
const getJwtExpiration = (jwt: string): number | null => {
  try {
    const [, payloadB64] = jwt.split('.');
    if (!payloadB64) return null;
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : null; // Convert to ms
  } catch {
    return null;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    accessToken: null,
    refreshTokenStr: null,
    guestToken: null,
  });

  const [userTokenRefreshTimer, setUserTokenRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  // Clear auth state and storage
  const clearAuth = useCallback(() => {
    console.log('[Auth] Clearing auth state');
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (userTokenRefreshTimer) {
      clearTimeout(userTokenRefreshTimer);
    }
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshTokenStr: null,
    }));
  }, [userTokenRefreshTimer]);

  // Save auth to localStorage
  const saveAuthToStorage = useCallback((accessToken: string, refreshTokenStr: string, user: User, expiresAt: number) => {
    const data: StoredAuthData = { accessToken, refreshTokenStr, user, expiresAt };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    console.log('[Auth] Auth state saved to storage');
  }, []);

  // Restore auth from localStorage
  const restoreAuthFromStorage = useCallback((): StoredAuthData | null => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored) as StoredAuthData;
      
      // Validate data structure
      if (!data.accessToken || !data.refreshTokenStr || !data.user) {
        console.log('[Auth] Invalid stored auth data, clearing');
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('[Auth] Failed to parse stored auth:', error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  }, []);

  // Best-effort: derive expires_in from JWT exp if API doesn't return it
  const getExpiresInFromJwt = useCallback((jwt: string): number | null => {
    const expMs = getJwtExpiration(jwt);
    if (!expMs) return null;
    const nowMs = Date.now();
    return Math.max(Math.floor((expMs - nowMs) / 1000), 0);
  }, []);

  // Setup user token refresh (for authenticated users)
  const setupUserTokenRefresh = useCallback((expiresIn: number, currentRefreshToken: string, currentAccessToken: string) => {
    if (userTokenRefreshTimer) {
      clearTimeout(userTokenRefreshTimer);
    }

    // Refresh 2 minutes before expiry, minimum 1 minute
    const refreshTime = Math.max((expiresIn - 120) * 1000, 60000);
    console.log(`[Auth] User token will refresh in ${Math.round(refreshTime / 1000)}s`);

    const timer = setTimeout(async () => {
      console.log('[Auth] Refreshing user access token...');
      try {
        const response = await refreshTokenApi(currentRefreshToken, currentAccessToken);
        const newData = response.data.attributes;

        const newAccessToken = newData.access_token;
        const newRefreshToken = newData.refresh_token;

        setState(prev => {
          if (!prev.user) return prev;
          
          // Calculate new expiry
          const newExpiresIn = typeof newData.expires_in === 'number'
            ? newData.expires_in
            : getExpiresInFromJwt(newAccessToken);
          
          const expiresAt = newExpiresIn 
            ? Date.now() + newExpiresIn * 1000 
            : Date.now() + 3600000; // Default 1 hour
          
          // Save to storage
          saveAuthToStorage(newAccessToken, newRefreshToken, prev.user, expiresAt);
          
          return {
            ...prev,
            accessToken: newAccessToken,
            refreshTokenStr: newRefreshToken,
          };
        });

        const nextExpiresIn =
          typeof newData.expires_in === 'number'
            ? newData.expires_in
            : getExpiresInFromJwt(newAccessToken);

        if (typeof nextExpiresIn === 'number') {
          console.log('[Auth] User token refreshed successfully');
          setupUserTokenRefresh(nextExpiresIn, newRefreshToken, newAccessToken);
        } else {
          console.warn('[Auth] Token refreshed but expires_in missing; skipping auto-refresh scheduling');
        }
      } catch (error: any) {
        console.error('[Auth] Token refresh failed:', error);
        
        // Check if it's a 401 error - force re-login
        const errorMessage = error?.message || '';
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          console.log('[Auth] 401 on refresh - forcing re-login');
          clearAuth();
        } else {
          // For other errors, try again in 1 minute
          console.log('[Auth] Will retry token refresh in 1 minute');
          setupUserTokenRefresh(60, currentRefreshToken, currentAccessToken);
        }
      }
    }, refreshTime);

    setUserTokenRefreshTimer(timer);
  }, [userTokenRefreshTimer, getExpiresInFromJwt, saveAuthToStorage, clearAuth]);

  // Initialize: restore auth from storage OR initialize guest token
  useEffect(() => {
    const initAuth = async () => {
      // Try to restore auth from storage
      const storedAuth = restoreAuthFromStorage();
      
      if (storedAuth) {
        console.log('[Auth] Restoring auth from storage');
        
        // Check if token is still valid (with 5 minute buffer)
        const isExpired = storedAuth.expiresAt < Date.now() + 300000;
        
        if (isExpired) {
          console.log('[Auth] Stored token expired, attempting refresh...');
          
          try {
            const response = await refreshTokenApi(storedAuth.refreshTokenStr, storedAuth.accessToken);
            const newData = response.data.attributes;
            
            const newExpiresIn = typeof newData.expires_in === 'number'
              ? newData.expires_in
              : getExpiresInFromJwt(newData.access_token);
            
            const expiresAt = newExpiresIn 
              ? Date.now() + newExpiresIn * 1000 
              : Date.now() + 3600000;
            
            saveAuthToStorage(newData.access_token, newData.refresh_token, storedAuth.user, expiresAt);
            
            setState(prev => ({
              ...prev,
              isAuthenticated: true,
              user: storedAuth.user,
              accessToken: newData.access_token,
              refreshTokenStr: newData.refresh_token,
              isLoading: false,
            }));
            
            if (typeof newExpiresIn === 'number') {
              setupUserTokenRefresh(newExpiresIn, newData.refresh_token, newData.access_token);
            }
            
            // Still initialize guest token for public API calls
            initGuestToken().then(token => {
              setState(prev => ({ ...prev, guestToken: token }));
            });
            
            return;
          } catch (error) {
            console.error('[Auth] Failed to refresh stored token, clearing auth:', error);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } else {
          // Token still valid, restore state
          setState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: storedAuth.user,
            accessToken: storedAuth.accessToken,
            refreshTokenStr: storedAuth.refreshTokenStr,
            isLoading: false,
          }));
          
          // Setup refresh for remaining time
          const remainingTime = Math.floor((storedAuth.expiresAt - Date.now()) / 1000);
          setupUserTokenRefresh(remainingTime, storedAuth.refreshTokenStr, storedAuth.accessToken);
          
          // Still initialize guest token for public API calls
          initGuestToken().then(token => {
            setState(prev => ({ ...prev, guestToken: token }));
          });
          
          return;
        }
      }
      
      // No valid stored auth, initialize guest token
      try {
        console.log('[Auth] Initializing guest token...');
        const token = await initGuestToken();
        console.log('[Auth] Guest token initialized successfully');
        setState(prev => ({
          ...prev,
          guestToken: token,
          isLoading: false,
        }));
      } catch (error) {
        console.error('[Auth] Failed to generate guest token:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      stopTokenRefresh();
    };
  }, []);

  const login = useCallback((loginData: {
    access_token: string;
    refresh_token: string;
    user_id: number;
    mobile_number: string;
    email: string;
    first_name: string;
    is_new_user: boolean;
    expires_in?: number;
  }) => {
    console.log('[Auth] User logged in:', loginData.first_name);

    const user: User = {
      userId: loginData.user_id,
      mobileNumber: loginData.mobile_number,
      email: loginData.email,
      firstName: loginData.first_name,
      isNewUser: loginData.is_new_user,
    };

    const expiresIn =
      typeof loginData.expires_in === 'number'
        ? loginData.expires_in
        : getExpiresInFromJwt(loginData.access_token);

    const expiresAt = expiresIn 
      ? Date.now() + expiresIn * 1000 
      : Date.now() + 3600000; // Default 1 hour

    // Save to storage
    saveAuthToStorage(loginData.access_token, loginData.refresh_token, user, expiresAt);

    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      accessToken: loginData.access_token,
      refreshTokenStr: loginData.refresh_token,
      user,
    }));

    if (typeof expiresIn === 'number') {
      setupUserTokenRefresh(expiresIn, loginData.refresh_token, loginData.access_token);
    } else {
      console.warn('[Auth] Login succeeded but expires_in missing; skipping auto-refresh scheduling');
    }
  }, [setupUserTokenRefresh, getExpiresInFromJwt, saveAuthToStorage]);

  const logout = useCallback(() => {
    console.log('[Auth] User logged out');
    clearAuth();
  }, [clearAuth]);

  const getGuestToken = useCallback(async (): Promise<string> => {
    const token = await initGuestToken();

    if (token !== state.guestToken) {
      setState(prev => ({ ...prev, guestToken: token }));
    }

    return token;
  }, [state.guestToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (userTokenRefreshTimer) {
        clearTimeout(userTokenRefreshTimer);
      }
    };
  }, [userTokenRefreshTimer]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        getGuestToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
