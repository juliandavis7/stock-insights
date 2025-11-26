/**
 * Hook to check subscription status and redirect if expired
 * Used in protected route components
 */

import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@clerk/react-router";
import { useAuthenticatedFetch } from "./useAuthenticatedFetch";
import { API_BASE_URL } from "~/config/subscription";
import { isSubscriptionExpired } from "~/lib/routeProtection";

export function useSubscriptionCheck() {
  const { isSignedIn } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSignedIn) return;

      try {
        const response = await authenticatedFetch(`${API_BASE_URL}/users/me`);
        if (response.ok) {
          const data = await response.json();
          const subscriptionStatus = {
            subscription_status: data.user?.subscription_status || 'expired',
            subscription_ends_at: data.user?.subscription_ends_at || null,
          };

          // Redirect to subscription page if expired
          if (isSubscriptionExpired(subscriptionStatus)) {
            navigate('/subscription');
          }
        }
      } catch (error) {
        // Silently fail - let useAuthenticatedFetch handle redirects
        console.error('Failed to check subscription status:', error);
      }
    };

    checkSubscription();
  }, [isSignedIn, authenticatedFetch, navigate]);
}

