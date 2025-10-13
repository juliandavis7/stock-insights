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
    
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }, [getToken, isSignedIn]);
  
  return { 
    authenticatedFetch, 
    getAuthToken,
    isSignedIn,
    userId 
  };
}
