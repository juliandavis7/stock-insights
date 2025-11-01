import { useAuth } from "@clerk/react-router";
import { useCallback } from "react";

export function useAuthenticatedFetch() {
  const { getToken, isSignedIn, userId } = useAuth();
  
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (!isSignedIn) return null;
    
    try {
      const token = await getToken();
      // Only log token in local environment
      if (import.meta.env.VITE_ENV === 'local') {
        console.log(`Token: ${token}`);
      }
      return token;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  }, [getToken, isSignedIn, userId]);
  
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!isSignedIn) throw new Error("User not authenticated");
    
    const token = await getToken();
    if (!token) throw new Error("Failed to obtain authentication token");
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Check for 403 trial expiration error
    if (response.status === 403) {
      try {
        // Clone the response so we can read it and still return the original
        const clonedResponse = response.clone();
        const errorData = await clonedResponse.json();
        
        // Check if this is a trial expiration error
        if (errorData.detail?.toLowerCase().includes('trial has expired') || 
            errorData.detail?.toLowerCase().includes('upgrade to continue')) {
          // Prevent redirect if already on pricing page
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/pricing')) {
            console.log('Trial expired - redirecting to pricing page');
            window.location.href = '/pricing?expired=true';
          }
          throw new Error('Trial expired');
        }
      } catch (error) {
        // If error is "Trial expired", rethrow it
        if (error instanceof Error && error.message === 'Trial expired') {
          throw error;
        }
        // If JSON parsing fails or other error, continue with normal error handling
        // Fall through to return the original response
      }
    }
    
    return response;
  }, [getToken, isSignedIn]);
  
  return { 
    authenticatedFetch, 
    getAuthToken,
    isSignedIn,
    userId 
  };
}
