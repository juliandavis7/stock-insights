/**
 * Auth redirect route - checks subscription status and redirects accordingly
 * Used after sign-in/sign-up to route users to the correct page
 */

import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@clerk/react-router";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "~/config/subscription";
import { isSubscriptionExpired } from "~/lib/routeProtection";

export default function AuthRedirect() {
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!isSignedIn) {
        // Not signed in, go to home
        navigate("/");
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          navigate("/");
          return;
        }

        // Fetch user subscription status
        const response = await fetch(`${API_BASE_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const subscriptionStatus = {
            subscription_status: data.user?.subscription_status || 'expired',
            subscription_ends_at: data.user?.subscription_ends_at || null,
          };

          // Redirect based on subscription status
          if (isSubscriptionExpired(subscriptionStatus)) {
            navigate("/subscription");
          } else {
            navigate("/search");
          }
        } else {
          // If API call fails, default to subscription page to be safe
          navigate("/subscription");
        }
      } catch (error) {
        console.error('Failed to check subscription status:', error);
        // On error, default to subscription page
        navigate("/subscription");
      }
    };

    checkAndRedirect();
  }, [isSignedIn, getToken, navigate]);

  // Show loading state while checking
  return (
    <div className="min-h-screen flex items-center justify-center bg-page-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}

