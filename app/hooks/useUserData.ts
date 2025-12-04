import { useEffect, useState } from "react";
import { useAuthenticatedFetch } from "~/hooks/useAuthenticatedFetch";
import { API_BASE_URL } from "~/config/subscription";

interface UserData {
  id: string;
  clerk_user_id: string;
  email: string;
  subscription_status: "trial" | "active" | "expired";
  subscription_ends_at: number | null;
}

interface UserApiResponse {
  success: boolean;
  user: UserData;
}

/**
 * Hook to fetch user data from /users/{clerk-user-id} endpoint
 * For local development, uses hardcoded user ID: user_2t4MjunbcI87etIBl4WdjXkYuxD
 */
export function useUserData() {
  const { authenticatedFetch, userId, isSignedIn } = useAuthenticatedFetch();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isSignedIn) {
        setLoading(false);
        return;
      }

      try {
        // For local development, use hardcoded user ID with /users/{clerk-user-id}
        // Otherwise use /users/me endpoint
        const isLocal = import.meta.env.VITE_ENV === "local" || 
                       import.meta.env.DEV ||
                       !import.meta.env.PROD;
        
        let url: string;
        if (isLocal) {
          const userIdToUse = "user_2t4MjunbcI87etIBl4WdjXkYuxD";
          url = `${API_BASE_URL}/users/${userIdToUse}`;
        } else {
          url = `${API_BASE_URL}/users/me`;
        }

        const response = await authenticatedFetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }

        const data: UserApiResponse = await response.json();
        
        if (data.success && data.user) {
          setUserData(data.user);
          setError(null);
        } else {
          throw new Error("Invalid API response format");
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch user data");
        // Don't set userData to null on error - keep previous data if available
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authenticatedFetch, userId, isSignedIn]);

  return { userData, loading, error };
}

